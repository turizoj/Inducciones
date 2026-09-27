const prisma = require('../config/prisma');

// RF-23: indicadores del tablero del administrador
async function resumen() {
  const [colaboradoresActivos, enCurso, completadas, programasPublicados, areas, sinCargo, ultimosUsuarios] =
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
    ]);

  return {
    indicadores: { colaboradoresActivos, enCurso, completadas, programasPublicados },
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

module.exports = { resumen };
