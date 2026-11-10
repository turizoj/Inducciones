const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');

const incluirEvaluacion = {
  preguntas: { orderBy: { orden: 'asc' }, include: { opciones: { orderBy: { id: 'asc' } } } },
  _count: { select: { intentos: true } },
};

function formatear(evaluacion) {
  if (!evaluacion) return null;
  return {
    id: evaluacion.id,
    notaMinima: Number(evaluacion.notaMinima),
    intentosMax: evaluacion.intentosMax,
    tiempoLimiteMin: evaluacion.tiempoLimiteMin,
    // Si ya hay intentos, las preguntas no se cambian para no alterar las notas registradas
    tieneIntentos: evaluacion._count.intentos > 0,
    preguntas: evaluacion.preguntas.map((p) => ({
      id: p.id,
      enunciado: p.enunciado,
      tipo: p.tipo,
      opciones: p.opciones.map((o) => ({ id: o.id, texto: o.texto, esCorrecta: o.esCorrecta })),
    })),
  };
}

async function buscarModulo(moduloId) {
  const modulo = await prisma.modulo.findUnique({
    where: { id: moduloId },
    include: { programa: { select: { id: true, titulo: true } }, evaluacion: { include: incluirEvaluacion } },
  });
  if (!modulo) throw new HttpError(404, 'Módulo no encontrado');
  return modulo;
}

// HU-07: evaluación del módulo con sus preguntas (el administrador sí ve las respuestas correctas)
async function obtener(moduloId) {
  const modulo = await buscarModulo(moduloId);
  return {
    modulo: { id: modulo.id, titulo: modulo.titulo },
    programa: modulo.programa,
    evaluacion: formatear(modulo.evaluacion),
  };
}

// Crea o reemplaza la evaluación completa (configuración, preguntas y opciones)
async function guardar(moduloId, { notaMinima, intentosMax, tiempoLimiteMin, preguntas }) {
  const modulo = await buscarModulo(moduloId);
  const configuracion = { notaMinima, intentosMax, tiempoLimiteMin };
  const actual = modulo.evaluacion;

  if (actual && actual._count.intentos > 0) {
    // Ya la presentaron: solo se actualiza la configuración
    await prisma.evaluacion.update({ where: { id: actual.id }, data: configuracion });
    return obtener(moduloId);
  }

  const preguntasNuevas = preguntas.map((p, i) => ({
    enunciado: p.enunciado,
    tipo: p.tipo,
    orden: i + 1,
    opciones: { create: p.opciones.map((o) => ({ texto: o.texto, esCorrecta: o.esCorrecta })) },
  }));

  await prisma.$transaction(async (tx) => {
    if (actual) {
      await tx.pregunta.deleteMany({ where: { evaluacionId: actual.id } });
      await tx.evaluacion.update({ where: { id: actual.id }, data: configuracion });
      for (const p of preguntasNuevas) await tx.pregunta.create({ data: { ...p, evaluacionId: actual.id } });
    } else {
      await tx.evaluacion.create({ data: { ...configuracion, moduloId, preguntas: { create: preguntasNuevas } } });
    }
  });
  return obtener(moduloId);
}

async function eliminar(moduloId) {
  const { evaluacion } = await buscarModulo(moduloId);
  if (!evaluacion) throw new HttpError(404, 'El módulo no tiene evaluación');
  if (evaluacion._count.intentos > 0) {
    throw new HttpError(409, 'La evaluación ya fue presentada por colaboradores; no se puede eliminar.');
  }
  await prisma.evaluacion.delete({ where: { id: evaluacion.id } });
}

module.exports = { obtener, guardar, eliminar };
