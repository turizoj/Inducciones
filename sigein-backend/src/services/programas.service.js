const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');
const { borrarArchivo } = require('../utils/archivos');

const incluirResumen = {
  _count: { select: { modulos: true, asignaciones: true } },
  modulos: { select: { _count: { select: { contenidos: true } } } },
};

const incluirDetalle = {
  _count: { select: { asignaciones: true } },
  modulos: {
    orderBy: { orden: 'asc' },
    include: {
      contenidos: { orderBy: { orden: 'asc' } },
      evaluacion: { select: { id: true } },
    },
  },
};

function formatearResumen({ _count, modulos, ...programa }) {
  return {
    ...programa,
    totalModulos: _count.modulos,
    totalContenidos: modulos.reduce((suma, m) => suma + m._count.contenidos, 0),
    totalAsignaciones: _count.asignaciones,
  };
}

function formatearDetalle({ _count, modulos, ...programa }) {
  return {
    ...programa,
    totalAsignaciones: _count.asignaciones,
    modulos: modulos.map(({ evaluacion, ...m }) => ({ ...m, tieneEvaluacion: Boolean(evaluacion) })),
  };
}

async function listar({ buscar, estado }) {
  const programas = await prisma.programa.findMany({
    where: {
      ...(buscar && { titulo: { contains: buscar } }),
      ...(estado && { estado }),
    },
    include: incluirResumen,
    orderBy: { createdAt: 'desc' },
  });
  return programas.map(formatearResumen);
}

async function buscarPorId(id) {
  const programa = await prisma.programa.findUnique({ where: { id }, include: incluirDetalle });
  if (!programa) throw new HttpError(404, 'Programa no encontrado');
  return programa;
}

async function obtener(id) {
  return formatearDetalle(await buscarPorId(id));
}

// HU-05: un programa nuevo queda en estado "Borrador"
async function crear(datos, idCreador) {
  const programa = await prisma.programa.create({
    data: { ...datos, estado: 'borrador', creadoPor: idCreador },
    include: incluirDetalle,
  });
  return formatearDetalle(programa);
}

async function actualizar(id, datos) {
  await buscarPorId(id);
  return formatearDetalle(await prisma.programa.update({ where: { id }, data: datos, include: incluirDetalle }));
}

// HU-05: solo se puede publicar si tiene al menos un módulo con contenido
async function cambiarEstado(id, estado) {
  await buscarPorId(id);
  if (estado === 'publicado') {
    const contenidos = await prisma.contenido.count({ where: { modulo: { programaId: id } } });
    if (contenidos === 0) {
      throw new HttpError(400, 'Para publicar, el programa debe tener al menos un módulo con contenido.');
    }
  }
  return formatearDetalle(await prisma.programa.update({ where: { id }, data: { estado }, include: incluirDetalle }));
}

// Un programa con asignaciones no se elimina (se perdería el historial); se archiva
async function eliminar(id) {
  const programa = await buscarPorId(id);
  if (programa._count.asignaciones > 0) {
    throw new HttpError(409, 'El programa ya fue asignado a colaboradores. No se puede eliminar; puede archivarlo.');
  }
  await prisma.programa.delete({ where: { id } });
  borrarArchivo(programa.imagenUrl);
  programa.modulos.forEach((m) => m.contenidos.forEach((c) => borrarArchivo(c.url)));
}

async function cambiarImagen(id, rutaImagen) {
  const programa = await buscarPorId(id);
  const actualizado = await prisma.programa.update({ where: { id }, data: { imagenUrl: rutaImagen }, include: incluirDetalle });
  borrarArchivo(programa.imagenUrl);
  return formatearDetalle(actualizado);
}

// Evita borrar módulos o contenidos que los colaboradores ya están viendo
async function verificarSinAsignaciones(programaId, accion) {
  const asignaciones = await prisma.asignacion.count({ where: { programaId } });
  if (asignaciones > 0) {
    throw new HttpError(409, `El programa ya fue asignado a colaboradores. No se puede ${accion}.`);
  }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar, cambiarImagen, verificarSinAsignaciones };
