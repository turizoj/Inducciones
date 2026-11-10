const prisma = require('../config/prisma');
const { actualizarVencidas } = require('./avance.service');
const { textoAFecha } = require('../utils/fechas');

const ROL_JEFE = 'Jefe de área';
const MAX_FILAS = 5000;

const NOMBRES_ESTADO = { pendiente: 'Pendiente', en_curso: 'En curso', completada: 'Completada', vencida: 'Vencida' };

// RF-23: porcentaje de intentos de evaluación aprobados sobre los presentados
async function tasaAprobacion(whereAsignacion = {}) {
  const where = { finalizadoAt: { not: null }, asignacion: whereAsignacion };
  const [presentados, aprobados] = await Promise.all([
    prisma.intentoEvaluacion.count({ where }),
    prisma.intentoEvaluacion.count({ where: { ...where, aprobado: true } }),
  ]);
  return presentados ? Math.round((aprobados / presentados) * 1000) / 10 : null;
}

// RF-23: indicadores del tablero del administrador
async function resumen() {
  await actualizarVencidas();
  const [colaboradoresActivos, enCurso, completadas, programasPublicados, areas, sinCargo, ultimosUsuarios, aprobacion] =
    await Promise.all([
      prisma.usuario.count({ where: { estado: 'activo', rol: { nombre: 'Colaborador' } } }),
      prisma.asignacion.count({ where: { estado: 'en_curso' } }),
      prisma.asignacion.count({ where: { estado: 'completada' } }),
      prisma.programa.count({ where: { estado: 'publicado' } }),
      prisma.area.findMany({
        where: { estado: 'activo' },
        select: { id: true, nombre: true, cargos: { select: { _count: { select: { usuarios: { where: { estado: 'activo' } } } } } } },
        orderBy: { nombre: 'asc' },
      }),
      prisma.usuario.count({ where: { estado: 'activo', cargoId: null, rol: { nombre: { not: 'Administrador' } } } }),
      prisma.usuario.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, nombres: true, apellidos: true, createdAt: true, rol: { select: { nombre: true } }, cargo: { select: { nombre: true } } },
      }),
      tasaAprobacion(),
    ]);

  return {
    indicadores: { colaboradoresActivos, enCurso, completadas, programasPublicados, tasaAprobacion: aprobacion },
    usuariosPorArea: areas.map((a) => ({
      id: a.id,
      nombre: a.nombre,
      total: a.cargos.reduce((suma, c) => suma + c._count.usuarios, 0),
    })),
    usuariosSinCargo: sinCargo,
    ultimosUsuarios: ultimosUsuarios.map((u) => ({
      id: u.id,
      nombre: `${u.nombres} ${u.apellidos}`,
      rol: u.rol.nombre,
      cargo: u.cargo?.nombre ?? null,
      creado: u.createdAt,
    })),
  };
}

// HU-14: los filtros se pueden combinar. El jefe de área (HU-13) solo ve su área.
function construirFiltro({ areaId, programaId, estado, desde, hasta, buscar }, actor) {
  const usuario = {
    ...(actor.rol === ROL_JEFE && { cargo: { area: { jefeId: actor.id } } }),
    ...(areaId && { AND: [{ cargo: { areaId } }] }),
    ...(buscar && {
      OR: [{ nombres: { contains: buscar } }, { apellidos: { contains: buscar } }, { documento: { contains: buscar } }],
    }),
  };
  return {
    usuario,
    ...(programaId && { programaId }),
    ...(estado && { estado }),
    ...((desde || hasta) && {
      fechaAsignacion: { ...(desde && { gte: textoAFecha(desde) }), ...(hasta && { lte: textoAFecha(hasta) }) },
    }),
  };
}

// Nota de la persona en el programa: promedio de la mejor nota de cada evaluación presentada
function notaPrograma(intentos) {
  const mejores = new Map();
  intentos.forEach((i) => mejores.set(i.evaluacionId, Math.max(mejores.get(i.evaluacionId) ?? 0, Number(i.nota))));
  if (mejores.size === 0) return null;
  const suma = [...mejores.values()].reduce((a, b) => a + b, 0);
  return Math.round((suma / mejores.size) * 10) / 10;
}

// HU-13 / HU-14: filas del reporte de cumplimiento con su resumen
async function cumplimiento(filtros, actor) {
  await actualizarVencidas();
  const where = construirFiltro(filtros, actor);
  const [total, asignaciones, porEstado, aprobacion] = await Promise.all([
    prisma.asignacion.count({ where }),
    prisma.asignacion.findMany({
      where,
      take: MAX_FILAS,
      orderBy: [{ fechaLimite: 'asc' }, { id: 'asc' }],
      include: {
        usuario: {
          select: {
            nombres: true,
            apellidos: true,
            documento: true,
            cargo: { select: { nombre: true, area: { select: { nombre: true } } } },
          },
        },
        programa: { select: { titulo: true } },
        certificado: { select: { codigoVerificacion: true, fechaEmision: true } },
        intentos: { where: { finalizadoAt: { not: null } }, select: { evaluacionId: true, nota: true } },
      },
    }),
    prisma.asignacion.groupBy({ by: ['estado'], where, _count: { _all: true } }),
    tasaAprobacion(where),
  ]);

  const conteo = Object.fromEntries(Object.keys(NOMBRES_ESTADO).map((e) => [e, 0]));
  porEstado.forEach((g) => (conteo[g.estado] = g._count._all));

  return {
    resumen: {
      total,
      ...conteo,
      cumplimiento: total ? Math.round((conteo.completada / total) * 1000) / 10 : null,
      tasaAprobacion: aprobacion,
    },
    filas: asignaciones.map((a) => ({
      id: a.id,
      colaborador: `${a.usuario.nombres} ${a.usuario.apellidos}`,
      documento: a.usuario.documento,
      area: a.usuario.cargo?.area.nombre ?? null,
      cargo: a.usuario.cargo?.nombre ?? null,
      programa: a.programa.titulo,
      fechaAsignacion: a.fechaAsignacion,
      fechaLimite: a.fechaLimite,
      estado: a.estado,
      porcentajeAvance: Number(a.porcentajeAvance),
      nota: notaPrograma(a.intentos),
      fechaCertificado: a.certificado?.fechaEmision ?? null,
      certificado: a.certificado?.codigoVerificacion ?? null,
    })),
    truncado: total > MAX_FILAS,
  };
}

// HU-14 criterio 2: descripción de los filtros aplicados para mostrarla en el archivo exportado
async function describirFiltros({ areaId, programaId, estado, desde, hasta, buscar }, actor) {
  const partes = [];
  if (actor.rol === ROL_JEFE) partes.push('Solo colaboradores de su área');
  if (areaId) partes.push(`Área: ${(await prisma.area.findUnique({ where: { id: areaId } }))?.nombre ?? areaId}`);
  if (programaId) partes.push(`Programa: ${(await prisma.programa.findUnique({ where: { id: programaId } }))?.titulo ?? programaId}`);
  if (estado) partes.push(`Estado: ${NOMBRES_ESTADO[estado]}`);
  if (desde || hasta) partes.push(`Asignadas ${desde ? `desde ${desde}` : ''}${desde && hasta ? ' ' : ''}${hasta ? `hasta ${hasta}` : ''}`);
  if (buscar) partes.push(`Búsqueda: "${buscar}"`);
  return partes.length ? partes.join(' · ') : 'Sin filtros (todas las asignaciones)';
}

module.exports = { resumen, cumplimiento, describirFiltros, NOMBRES_ESTADO };
