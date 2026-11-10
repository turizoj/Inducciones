const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');
const { borrarArchivo } = require('../utils/archivos');
const { mismosIds } = require('../utils/textos');
const { verificarSinAsignaciones } = require('./programas.service');

async function buscarPorId(id) {
  const modulo = await prisma.modulo.findUnique({ where: { id }, include: { contenidos: true } });
  if (!modulo) throw new HttpError(404, 'Módulo no encontrado');
  return modulo;
}

// El módulo nuevo queda al final del programa
async function crear(programaId, datos) {
  const programa = await prisma.programa.findUnique({ where: { id: programaId } });
  if (!programa) throw new HttpError(404, 'Programa no encontrado');
  const ultimo = await prisma.modulo.aggregate({ where: { programaId }, _max: { orden: true } });
  return prisma.modulo.create({ data: { ...datos, programaId, orden: (ultimo._max.orden ?? 0) + 1 } });
}

async function actualizar(id, datos) {
  await buscarPorId(id);
  return prisma.modulo.update({ where: { id }, data: datos });
}

async function eliminar(id) {
  const modulo = await buscarPorId(id);
  await verificarSinAsignaciones(modulo.programaId, 'eliminar sus módulos');
  await prisma.modulo.delete({ where: { id } });
  modulo.contenidos.forEach((c) => borrarArchivo(c.url));
  // Se vuelven a numerar los módulos que quedan para no dejar huecos en el orden
  const restantes = await prisma.modulo.findMany({ where: { programaId: modulo.programaId }, orderBy: { orden: 'asc' } });
  await prisma.$transaction(restantes.map((m, i) => prisma.modulo.update({ where: { id: m.id }, data: { orden: i + 1 } })));
}

// HU-06: los módulos se reordenan arrastrándolos. Recibe los ids en el nuevo orden.
async function ordenar(programaId, ids) {
  const modulos = await prisma.modulo.findMany({ where: { programaId }, select: { id: true } });
  if (!mismosIds(modulos.map((m) => m.id), ids)) {
    throw new HttpError(400, 'La lista de módulos no coincide con la del programa. Recargue la página.');
  }
  await prisma.$transaction(ids.map((id, i) => prisma.modulo.update({ where: { id }, data: { orden: i + 1 } })));
}

module.exports = { crear, actualizar, eliminar, ordenar };
