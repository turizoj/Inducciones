const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');

const incluir = {
  jefe: { select: { id: true, nombres: true, apellidos: true } },
  cargos: { select: { id: true, _count: { select: { usuarios: true } } } },
};

// Área con el total de cargos y de usuarios (los usuarios pertenecen al área por medio del cargo)
function formatear(area) {
  const { cargos, ...resto } = area;
  return {
    ...resto,
    totalCargos: cargos.length,
    totalUsuarios: cargos.reduce((suma, c) => suma + c._count.usuarios, 0),
  };
}

async function listar({ buscar, estado }) {
  const areas = await prisma.area.findMany({
    where: {
      ...(buscar && { nombre: { contains: buscar } }),
      ...(estado && { estado }),
    },
    include: incluir,
    orderBy: { nombre: 'asc' },
  });
  return areas.map(formatear);
}

async function buscarPorId(id) {
  const area = await prisma.area.findUnique({ where: { id }, include: incluir });
  if (!area) throw new HttpError(404, 'Área no encontrada');
  return area;
}

async function validarDatos({ nombre, jefeId }, idActual) {
  const repetida = await prisma.area.findUnique({ where: { nombre } });
  if (repetida && repetida.id !== idActual) throw new HttpError(409, `Ya existe un área llamada "${nombre}"`);

  if (jefeId) {
    const jefe = await prisma.usuario.findUnique({ where: { id: jefeId }, include: { rol: true } });
    if (!jefe || jefe.rol.nombre !== 'Jefe de área' || jefe.estado !== 'activo') {
      throw new HttpError(400, 'El jefe del área debe ser un usuario activo con rol "Jefe de área"');
    }
  }
}

async function crear(datos) {
  await validarDatos(datos);
  return formatear(await prisma.area.create({ data: datos, include: incluir }));
}

async function actualizar(id, datos) {
  await buscarPorId(id);
  await validarDatos(datos, id);
  return formatear(await prisma.area.update({ where: { id }, data: datos, include: incluir }));
}

async function cambiarEstado(id, estado) {
  await buscarPorId(id);
  return formatear(await prisma.area.update({ where: { id }, data: { estado }, include: incluir }));
}

// HU-04: un área con usuarios no se elimina, solo se inactiva
async function eliminar(id) {
  const area = formatear(await buscarPorId(id));
  if (area.totalUsuarios > 0) {
    throw new HttpError(409, `El área tiene ${area.totalUsuarios} usuario(s). No se puede eliminar; puede inactivarla.`);
  }
  await prisma.$transaction([prisma.cargo.deleteMany({ where: { areaId: id } }), prisma.area.delete({ where: { id } })]);
}

module.exports = { listar, crear, actualizar, cambiarEstado, eliminar };
