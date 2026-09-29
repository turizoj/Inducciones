const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');
const { incluirAvance, calcularAvance, estadoSegun, actualizarVencidas } = require('./avance.service');

// HU-09: inducciones asignadas al colaborador con avance, estado y fecha límite
async function listar(usuarioId) {
  await actualizarVencidas({ usuarioId });
  const asignaciones = await prisma.asignacion.findMany({
    where: { usuarioId },
    include: {
      programa: {
        select: { id: true, titulo: true, descripcion: true, imagenUrl: true, duracionHoras: true, obligatorio: true },
      },
    },
    orderBy: [{ fechaLimite: 'asc' }],
  });
  return asignaciones.map((a) => ({
    id: a.id,
    estado: a.estado,
    porcentajeAvance: Number(a.porcentajeAvance),
    fechaAsignacion: a.fechaAsignacion,
    fechaLimite: a.fechaLimite,
    programa: a.programa,
  }));
}

async function buscarPropia(id, usuarioId) {
  const asignacion = await prisma.asignacion.findFirst({ where: { id, usuarioId }, include: incluirAvance });
  if (!asignacion) throw new HttpError(404, 'Inducción no encontrada');
  return asignacion;
}

// Guarda el estado y el porcentaje si cambiaron, y avisa cuando se completa el programa
async function sincronizar(asignacion, avance) {
  const estado = estadoSegun(asignacion, avance);
  const porcentaje = avance.porcentaje;
  if (estado === asignacion.estado && porcentaje === Number(asignacion.porcentajeAvance)) return estado;

  await prisma.asignacion.update({ where: { id: asignacion.id }, data: { estado, porcentajeAvance: porcentaje } });
  if (estado === 'completada' && asignacion.estado !== 'completada') {
    await prisma.notificacion.create({
      data: {
        usuarioId: asignacion.usuarioId,
        titulo: '¡Inducción completada!',
        mensaje: `Terminó "${asignacion.programa.titulo}". ¡Felicitaciones!`,
      },
    });
  }
  return estado;
}

// HU-10: módulos con su estado (bloqueado, en curso, completado) y contenidos vistos
async function detalle(id, usuarioId) {
  const asignacion = await buscarPropia(id, usuarioId);
  const avance = calcularAvance(asignacion);
  const estado = await sincronizar(asignacion, avance);
  const { programa } = asignacion;

  // "Retomar donde lo dejé": primer contenido sin ver de un módulo desbloqueado
  const siguiente = avance.modulos.flatMap((m) => (m.estado === 'bloqueado' ? [] : m.contenidos)).find((c) => !c.visto);

  return {
    id: asignacion.id,
    estado,
    fechaLimite: asignacion.fechaLimite,
    porcentajeAvance: avance.porcentaje,
    programa: {
      id: programa.id,
      titulo: programa.titulo,
      descripcion: programa.descripcion,
      imagenUrl: programa.imagenUrl,
      duracionHoras: programa.duracionHoras,
    },
    modulos: avance.modulos,
    siguienteContenidoId: siguiente?.id ?? null,
  };
}

// RF-16: el avance se registra al marcar un contenido como visto
async function marcarVisto(asignacionId, contenidoId, usuarioId) {
  const asignacion = await buscarPropia(asignacionId, usuarioId);
  const avance = calcularAvance(asignacion);
  const modulo = avance.modulos.find((m) => m.contenidos.some((c) => c.id === contenidoId));
  if (!modulo) throw new HttpError(404, 'El contenido no pertenece a esta inducción');
  if (modulo.estado === 'bloqueado') {
    throw new HttpError(403, 'Este módulo está bloqueado. Primero complete el módulo anterior.');
  }

  await prisma.progresoContenido.upsert({
    where: { asignacionId_contenidoId: { asignacionId, contenidoId } },
    update: {},
    create: { asignacionId, contenidoId },
  });
  return detalle(asignacionId, usuarioId);
}

module.exports = { listar, detalle, marcarVisto };
