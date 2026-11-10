const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');

const MAXIMO_LISTA = 20;

// RF-24: notificaciones internas. La campana muestra las últimas y el total sin leer.
async function listar(usuarioId) {
  const [notificaciones, sinLeer] = await Promise.all([
    prisma.notificacion.findMany({ where: { usuarioId }, orderBy: { createdAt: 'desc' }, take: MAXIMO_LISTA }),
    prisma.notificacion.count({ where: { usuarioId, leida: false } }),
  ]);
  return { notificaciones, sinLeer };
}

async function marcarLeida(id, usuarioId) {
  const { count } = await prisma.notificacion.updateMany({ where: { id, usuarioId }, data: { leida: true } });
  if (count === 0) throw new HttpError(404, 'Notificación no encontrada');
}

async function marcarTodasLeidas(usuarioId) {
  await prisma.notificacion.updateMany({ where: { usuarioId, leida: false }, data: { leida: true } });
}

module.exports = { listar, marcarLeida, marcarTodasLeidas };
