const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');
const { calcularAvance } = require('./avance.service');
const { buscarPropia, sincronizar } = require('./misInducciones.service');

// Margen para que el envío automático al llegar a cero alcance a llegar al servidor
const GRACIA_MS = 30 * 1000;

const venceEn = (intento, evaluacion) =>
  evaluacion.tiempoLimiteMin ? new Date(intento.iniciadoAt.getTime() + evaluacion.tiempoLimiteMin * 60000) : null;

// Carga la asignación del colaborador y el módulo al que pertenece la evaluación
async function contexto(evaluacionId, asignacionId, usuarioId) {
  const asignacion = await buscarPropia(asignacionId, usuarioId);
  const avance = calcularAvance(asignacion);
  const modulo = avance.modulos.find((m) => m.evaluacion?.id === evaluacionId);
  if (!modulo) throw new HttpError(404, 'La evaluación no pertenece a esta inducción');
  return { asignacion, avance, modulo, evaluacion: modulo.evaluacion };
}

// Un intento abierto cuyo tiempo se agotó (por ejemplo, si se cerró la página) se cierra con nota 0
async function cerrarVencidos(evaluacion, asignacionId) {
  if (!evaluacion.tiempoLimiteMin) return;
  const limite = new Date(Date.now() - evaluacion.tiempoLimiteMin * 60000 - GRACIA_MS);
  await prisma.intentoEvaluacion.updateMany({
    where: { asignacionId, evaluacionId: evaluacion.id, finalizadoAt: null, iniciadoAt: { lt: limite } },
    data: { nota: 0, aprobado: false, finalizadoAt: new Date() },
  });
}

// Revisa si el colaborador puede presentar un intento nuevo y, si no, por qué
function disponibilidad(modulo, evaluacion, finalizados) {
  if (modulo.estado === 'bloqueado') return 'Este módulo está bloqueado. Primero complete el módulo anterior.';
  if (!modulo.contenidos.every((c) => c.visto)) return 'Primero vea todos los contenidos del módulo.';
  if (evaluacion.aprobada) return 'Ya aprobó esta evaluación.';
  if (finalizados >= evaluacion.intentosMax) return 'Ya usó todos los intentos permitidos.';
  return null;
}

// CU-11 paso 2: instrucciones, nota mínima, tiempo e intentos realizados
async function informacion(evaluacionId, asignacionId, usuarioId) {
  const { modulo, evaluacion } = await contexto(evaluacionId, asignacionId, usuarioId);
  await cerrarVencidos(evaluacion, asignacionId);
  const [intentos, totalPreguntas] = await Promise.all([
    prisma.intentoEvaluacion.findMany({ where: { asignacionId, evaluacionId }, orderBy: { numeroIntento: 'asc' } }),
    prisma.pregunta.count({ where: { evaluacionId } }),
  ]);
  const finalizados = intentos.filter((i) => i.finalizadoAt);
  const abierto = intentos.find((i) => !i.finalizadoAt);
  const motivo = abierto ? null : disponibilidad(modulo, evaluacion, finalizados.length);

  return {
    evaluacion: {
      id: evaluacion.id,
      notaMinima: evaluacion.notaMinima,
      intentosMax: evaluacion.intentosMax,
      tiempoLimiteMin: evaluacion.tiempoLimiteMin,
      totalPreguntas,
    },
    modulo: { id: modulo.id, titulo: modulo.titulo },
    aprobada: evaluacion.aprobada,
    intentos: finalizados.map((i) => ({ numero: i.numeroIntento, nota: Number(i.nota), aprobado: i.aprobado, fecha: i.finalizadoAt })),
    intentosRestantes: Math.max(evaluacion.intentosMax - finalizados.length, 0),
    intentoEnCurso: abierto ? { id: abierto.id, venceAt: venceEn(abierto, evaluacion) } : null,
    puedePresentar: !motivo,
    motivo,
  };
}

// CU-11 paso 3: inicia un intento (o retoma el que está abierto) y entrega las preguntas SIN las respuestas correctas
async function iniciar(evaluacionId, asignacionId, usuarioId) {
  const { modulo, evaluacion } = await contexto(evaluacionId, asignacionId, usuarioId);
  await cerrarVencidos(evaluacion, asignacionId);

  let intento = await prisma.intentoEvaluacion.findFirst({ where: { asignacionId, evaluacionId, finalizadoAt: null } });
  if (!intento) {
    const finalizados = await prisma.intentoEvaluacion.count({ where: { asignacionId, evaluacionId } });
    const motivo = disponibilidad(modulo, evaluacion, finalizados);
    if (motivo) throw new HttpError(400, motivo);
    intento = await prisma.intentoEvaluacion.create({ data: { asignacionId, evaluacionId, numeroIntento: finalizados + 1 } });
  }

  const preguntas = await prisma.pregunta.findMany({
    where: { evaluacionId },
    orderBy: { orden: 'asc' },
    select: { id: true, enunciado: true, tipo: true, opciones: { select: { id: true, texto: true }, orderBy: { id: 'asc' } } },
  });
  return {
    intentoId: intento.id,
    numeroIntento: intento.numeroIntento,
    intentosMax: evaluacion.intentosMax,
    notaMinima: evaluacion.notaMinima,
    venceAt: venceEn(intento, evaluacion),
    preguntas,
  };
}

// CU-11 pasos 4 a 6: califica en el servidor, registra el intento y actualiza el avance
async function responder(intentoId, respuestas, usuarioId) {
  const intento = await prisma.intentoEvaluacion.findFirst({
    where: { id: intentoId, asignacion: { usuarioId } },
    include: {
      evaluacion: {
        include: { preguntas: { include: { opciones: true } }, modulo: { select: { titulo: true } } },
      },
    },
  });
  if (!intento) throw new HttpError(404, 'Intento no encontrado');
  if (intento.finalizadoAt) throw new HttpError(409, 'Este intento ya fue enviado');

  const { evaluacion } = intento;
  const vence = venceEn(intento, evaluacion);
  const fueraDeTiempo = vence && Date.now() > vence.getTime() + GRACIA_MS;

  // Una pregunta es correcta si se marcaron exactamente las opciones correctas
  const elegidas = new Map(respuestas.map((r) => [r.preguntaId, new Set(r.opcionIds)]));
  const registros = [];
  let correctas = 0;
  for (const p of evaluacion.preguntas) {
    const validas = new Set(p.opciones.map((o) => o.id));
    let marcadas = [...(elegidas.get(p.id) ?? [])].filter((id) => validas.has(id));
    if (p.tipo !== 'multiple') marcadas = marcadas.slice(0, 1);
    const correctasPregunta = p.opciones.filter((o) => o.esCorrecta).map((o) => o.id);
    const acierta = marcadas.length === correctasPregunta.length && correctasPregunta.every((id) => marcadas.includes(id));
    if (acierta) correctas++;
    marcadas.forEach((opcionId) => registros.push({ intentoId, preguntaId: p.id, opcionId }));
  }

  const total = evaluacion.preguntas.length;
  // HU-07: nota de 0 a 5 con un decimal. Si llegó fuera de tiempo, no se tiene en cuenta.
  const nota = fueraDeTiempo || total === 0 ? 0 : Math.round((correctas / total) * 50) / 10;
  const notaMinima = Number(evaluacion.notaMinima);
  const aprobado = nota >= notaMinima;

  await prisma.$transaction([
    prisma.respuesta.createMany({ data: fueraDeTiempo ? [] : registros }),
    prisma.intentoEvaluacion.update({ where: { id: intentoId }, data: { nota, aprobado, finalizadoAt: new Date() } }),
  ]);

  // Si aprobó, se desbloquea el módulo siguiente o se completa el programa
  const asignacion = await buscarPropia(intento.asignacionId, usuarioId);
  const estado = await sincronizar(asignacion, calcularAvance(asignacion));

  const usados = await prisma.intentoEvaluacion.count({ where: { asignacionId: intento.asignacionId, evaluacionId: evaluacion.id } });
  const intentosRestantes = Math.max(evaluacion.intentosMax - usados, 0);
  if (!aprobado && intentosRestantes === 0) await avisarAlJefe(asignacion, evaluacion.modulo.titulo);

  return { nota, aprobado, notaMinima, correctas, total, intentosRestantes, fueraDeTiempo: Boolean(fueraDeTiempo), programaCompletado: estado === 'completada' };
}

// CU-11 flujo 6b: sin aprobar y sin intentos, se notifica al jefe de área
async function avisarAlJefe(asignacion, tituloModulo) {
  const colaborador = await prisma.usuario.findUnique({
    where: { id: asignacion.usuarioId },
    select: { nombres: true, apellidos: true, cargo: { select: { area: { select: { jefeId: true } } } } },
  });
  const jefeId = colaborador?.cargo?.area.jefeId;
  if (!jefeId) return;
  await prisma.notificacion.create({
    data: {
      usuarioId: jefeId,
      titulo: 'Evaluación sin aprobar',
      mensaje: `${colaborador.nombres} ${colaborador.apellidos} agotó los intentos de "${tituloModulo}" en "${asignacion.programa.titulo}".`.slice(0, 255),
    },
  });
}

module.exports = { informacion, iniciar, responder };
