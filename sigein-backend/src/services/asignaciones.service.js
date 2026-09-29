const prisma = require('../config/prisma');
const { frontendUrl } = require('../config');
const { HttpError } = require('../utils/errores');
const { enviarCorreo } = require('../utils/correo');
const { hoy, textoAFecha, formatearFecha } = require('../utils/fechas');
const { ESTADOS_ACTIVOS, actualizarVencidas } = require('./avance.service');

const ROL_JEFE = 'Jefe de área';

// HU-08: el jefe de área solo ve y asigna a colaboradores de las áreas que dirige
function alcanceUsuarios(actor) {
  return actor.rol === ROL_JEFE ? { cargo: { area: { jefeId: actor.id } } } : {};
}

const colaboradorActivo = { estado: 'activo', rol: { nombre: 'Colaborador' } };

const incluirLista = {
  usuario: {
    select: {
      id: true,
      nombres: true,
      apellidos: true,
      documento: true,
      cargo: { select: { nombre: true, area: { select: { nombre: true } } } },
    },
  },
  programa: { select: { id: true, titulo: true, estado: true } },
  asignador: { select: { nombres: true, apellidos: true } },
};

function formatear(a) {
  return {
    id: a.id,
    estado: a.estado,
    porcentajeAvance: Number(a.porcentajeAvance),
    fechaAsignacion: a.fechaAsignacion,
    fechaLimite: a.fechaLimite,
    usuario: {
      id: a.usuario.id,
      nombre: `${a.usuario.nombres} ${a.usuario.apellidos}`,
      documento: a.usuario.documento,
      cargo: a.usuario.cargo?.nombre ?? null,
      area: a.usuario.cargo?.area.nombre ?? null,
    },
    programa: a.programa,
    asignadoPor: `${a.asignador.nombres} ${a.asignador.apellidos}`,
  };
}

async function listar({ buscar, programaId, estado, pagina, porPagina }, actor) {
  await actualizarVencidas();
  const where = {
    usuario: {
      ...alcanceUsuarios(actor),
      ...(buscar && {
        OR: [{ nombres: { contains: buscar } }, { apellidos: { contains: buscar } }, { documento: { contains: buscar } }],
      }),
    },
    ...(programaId && { programaId }),
    ...(estado && { estado }),
  };
  const [total, asignaciones] = await prisma.$transaction([
    prisma.asignacion.count({ where }),
    prisma.asignacion.findMany({
      where,
      include: incluirLista,
      orderBy: [{ fechaLimite: 'asc' }, { id: 'desc' }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ]);
  return { datos: asignaciones.map(formatear), total, pagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
}

// Datos para el formulario "Nueva asignación", ya filtrados según quien asigna
async function opciones(actor) {
  const esJefe = actor.rol === ROL_JEFE;
  const [programas, areas, cargos, colaboradores] = await Promise.all([
    prisma.programa.findMany({ where: { estado: 'publicado' }, select: { id: true, titulo: true }, orderBy: { titulo: 'asc' } }),
    prisma.area.findMany({
      where: { estado: 'activo', ...(esJefe && { jefeId: actor.id }) },
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    }),
    prisma.cargo.findMany({
      where: { estado: 'activo', area: { estado: 'activo', ...(esJefe && { jefeId: actor.id }) } },
      select: { id: true, nombre: true, area: { select: { id: true, nombre: true } } },
      orderBy: [{ area: { nombre: 'asc' } }, { nombre: 'asc' }],
    }),
    prisma.usuario.findMany({
      where: { ...colaboradorActivo, ...alcanceUsuarios(actor) },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        documento: true,
        cargo: { select: { nombre: true, area: { select: { nombre: true } } } },
      },
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
    }),
  ]);
  return {
    programas,
    areas,
    cargos: cargos.map((c) => ({ id: c.id, nombre: c.nombre, areaId: c.area.id, area: c.area.nombre })),
    colaboradores: colaboradores.map((u) => ({
      id: u.id,
      nombre: `${u.nombres} ${u.apellidos}`,
      documento: u.documento,
      cargo: u.cargo?.nombre ?? null,
      area: u.cargo?.area.nombre ?? null,
    })),
  };
}

// Revisa que el jefe no asigne por fuera de sus áreas
async function verificarAlcance({ modo, areaId, cargoId }, actor) {
  if (actor.rol !== ROL_JEFE) return;
  if (modo === 'area') {
    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (area?.jefeId !== actor.id) throw new HttpError(403, 'Solo puede asignar a colaboradores de su área');
  }
  if (modo === 'cargo') {
    const cargo = await prisma.cargo.findUnique({ where: { id: cargoId }, include: { area: true } });
    if (cargo?.area.jefeId !== actor.id) throw new HttpError(403, 'Solo puede asignar a colaboradores de su área');
  }
}

// CU-08: crea las asignaciones en "Pendiente", omite las repetidas y avisa a cada colaborador
async function crear({ programaId, modo, usuarioIds, areaId, cargoId, fechaLimite }, actor) {
  const programa = await prisma.programa.findUnique({ where: { id: programaId } });
  if (!programa) throw new HttpError(404, 'Programa no encontrado');
  if (programa.estado !== 'publicado') throw new HttpError(400, 'Solo se pueden asignar programas publicados');

  const limite = textoAFecha(fechaLimite);
  if (limite < hoy()) throw new HttpError(400, 'La fecha límite no puede ser anterior a hoy');

  await verificarAlcance({ modo, areaId, cargoId }, actor);

  const porModo = { individual: { id: { in: usuarioIds } }, area: { cargo: { areaId } }, cargo: { cargoId } };
  const destinatarios = await prisma.usuario.findMany({
    where: { ...colaboradorActivo, ...alcanceUsuarios(actor), ...porModo[modo] },
    select: { id: true, nombres: true, apellidos: true, email: true },
  });

  const omitidos = [];
  if (modo === 'individual') {
    const encontrados = new Set(destinatarios.map((u) => u.id));
    const faltantes = usuarioIds.filter((id) => !encontrados.has(id));
    if (faltantes.length) {
      omitidos.push({ nombre: `${faltantes.length} persona(s)`, motivo: 'No están activas, no son colaboradores o no pertenecen a su área' });
    }
  }
  if (destinatarios.length === 0 && omitidos.length === 0) {
    throw new HttpError(400, 'No hay colaboradores activos para asignar con esa selección');
  }

  // RF-14: no se asigna dos veces el mismo programa activo a la misma persona
  const yaTienen = await prisma.asignacion.findMany({
    where: { programaId, usuarioId: { in: destinatarios.map((u) => u.id) }, estado: { in: ESTADOS_ACTIVOS } },
    select: { usuarioId: true },
  });
  const conPrograma = new Set(yaTienen.map((a) => a.usuarioId));
  const nuevos = destinatarios.filter((u) => {
    if (!conPrograma.has(u.id)) return true;
    omitidos.push({ nombre: `${u.nombres} ${u.apellidos}`, motivo: 'Ya tiene este programa asignado' });
    return false;
  });

  const textoLimite = formatearFecha(limite);
  await prisma.$transaction([
    prisma.asignacion.createMany({
      data: nuevos.map((u) => ({
        usuarioId: u.id,
        programaId,
        asignadoPor: actor.id,
        fechaAsignacion: hoy(),
        fechaLimite: limite,
      })),
    }),
    prisma.notificacion.createMany({
      data: nuevos.map((u) => ({
        usuarioId: u.id,
        titulo: 'Nueva inducción asignada',
        mensaje: `Se le asignó "${programa.titulo}". Fecha límite: ${textoLimite}.`,
      })),
    }),
  ]);

  for (const u of nuevos) {
    await enviarCorreo({
      para: u.email,
      asunto: `SIGEIN - Nueva inducción: ${programa.titulo}`,
      texto:
        `Hola ${u.nombres}, se le asignó el programa de inducción "${programa.titulo}".\n` +
        `Fecha límite: ${textoLimite}.\nIngrese a ${frontendUrl}/mis-inducciones para empezar.`,
    });
  }

  return { asignados: nuevos.map((u) => `${u.nombres} ${u.apellidos}`), omitidos };
}

async function buscarEnAlcance(id, actor) {
  const asignacion = await prisma.asignacion.findFirst({ where: { id, usuario: alcanceUsuarios(actor) }, include: incluirLista });
  if (!asignacion) throw new HttpError(404, 'Asignación no encontrada');
  return asignacion;
}

// Cambiar la fecha límite; si estaba vencida y la nueva fecha es vigente, vuelve a su estado
async function cambiarFecha(id, fechaLimite, actor) {
  const asignacion = await buscarEnAlcance(id, actor);
  if (asignacion.estado === 'completada') throw new HttpError(400, 'La inducción ya fue completada');
  const limite = textoAFecha(fechaLimite);
  if (limite < hoy()) throw new HttpError(400, 'La fecha límite no puede ser anterior a hoy');
  const estado = asignacion.estado === 'vencida' ? (Number(asignacion.porcentajeAvance) > 0 ? 'en_curso' : 'pendiente') : asignacion.estado;
  const actualizada = await prisma.asignacion.update({ where: { id }, data: { fechaLimite: limite, estado }, include: incluirLista });
  return formatear(actualizada);
}

// Solo se quita una asignación sin avance (por ejemplo, si se asignó por error)
async function eliminar(id, actor) {
  const asignacion = await buscarEnAlcance(id, actor);
  if (Number(asignacion.porcentajeAvance) > 0 || asignacion.estado === 'completada') {
    throw new HttpError(409, 'El colaborador ya tiene avance en esta inducción; no se puede quitar');
  }
  await prisma.asignacion.delete({ where: { id } });
}

module.exports = { listar, opciones, crear, cambiarFecha, eliminar };
