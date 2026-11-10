const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');

const incluir = {
  area: { select: { id: true, nombre: true, estado: true } },
  _count: { select: { usuarios: true } },
};

function formatear({ _count, ...cargo }) {
  return { ...cargo, totalUsuarios: _count.usuarios };
}

async function listar({ buscar, estado, areaId }) {
  const cargos = await prisma.cargo.findMany({
    where: {
      ...(buscar && { nombre: { contains: buscar } }),
      ...(estado && { estado }),
      ...(areaId && { areaId }),
    },
    include: incluir,
    orderBy: [{ area: { nombre: 'asc' } }, { nombre: 'asc' }],
  });
  return cargos.map(formatear);
}

async function buscarPorId(id) {
  const cargo = await prisma.cargo.findUnique({ where: { id }, include: incluir });
  if (!cargo) throw new HttpError(404, 'Cargo no encontrado');
  return cargo;
}

// HU-04: cada cargo pertenece a una sola área y no se repite dentro de ella
async function validarDatos({ nombre, areaId }, idActual) {
  const area = await prisma.area.findUnique({ where: { id: areaId } });
  if (!area) throw new HttpError(400, 'El área seleccionada no existe');

  const repetido = await prisma.cargo.findUnique({ where: { areaId_nombre: { areaId, nombre } } });
  if (repetido && repetido.id !== idActual) {
    throw new HttpError(409, `El área "${area.nombre}" ya tiene un cargo llamado "${nombre}"`);
  }
}

async function crear(datos) {
  await validarDatos(datos);
  return formatear(await prisma.cargo.create({ data: datos, include: incluir }));
}

async function actualizar(id, datos) {
  await buscarPorId(id);
  await validarDatos(datos, id);
  return formatear(await prisma.cargo.update({ where: { id }, data: datos, include: incluir }));
}

async function cambiarEstado(id, estado) {
  await buscarPorId(id);
  return formatear(await prisma.cargo.update({ where: { id }, data: { estado }, include: incluir }));
}

async function eliminar(id) {
  const cargo = formatear(await buscarPorId(id));
  if (cargo.totalUsuarios > 0) {
    throw new HttpError(409, `El cargo tiene ${cargo.totalUsuarios} usuario(s). No se puede eliminar; puede inactivarlo.`);
  }
  await prisma.cargo.delete({ where: { id } });
}

module.exports = { listar, crear, actualizar, cambiarEstado, eliminar };
