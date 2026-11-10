const asignacionesService = require('../services/asignaciones.service');
const misInduccionesService = require('../services/misInducciones.service');
const notificacionesService = require('../services/notificaciones.service');
const { idDeRuta } = require('../utils/textos');
const accion = require('../utils/accion');

const id = (req) => idDeRuta(req.params.id);

module.exports = {
  // Asignaciones (HU-08): administrador y jefe de área
  listar: accion((req) => asignacionesService.listar(req.filtros, req.usuario)),
  opciones: accion((req) => asignacionesService.opciones(req.usuario)),
  crear: accion((req) => asignacionesService.crear(req.body, req.usuario), 201),
  cambiarFecha: accion((req) => asignacionesService.cambiarFecha(id(req), req.body.fechaLimite, req.usuario)),
  eliminar: accion(async (req) => {
    await asignacionesService.eliminar(id(req), req.usuario);
    return { mensaje: 'Asignación eliminada' };
  }),

  // Mis inducciones y avance (HU-09, HU-10): colaborador
  misInducciones: accion((req) => misInduccionesService.listar(req.usuario.id)),
  miInduccion: accion((req) => misInduccionesService.detalle(id(req), req.usuario.id)),
  marcarVisto: accion((req) =>
    misInduccionesService.marcarVisto(req.body.asignacionId, idDeRuta(req.params.contenidoId), req.usuario.id),
  ),

  // Notificaciones (RF-24): cualquier usuario autenticado
  notificaciones: accion((req) => notificacionesService.listar(req.usuario.id)),
  marcarLeida: accion(async (req) => {
    await notificacionesService.marcarLeida(id(req), req.usuario.id);
    return { mensaje: 'Notificación leída' };
  }),
  marcarTodasLeidas: accion(async (req) => {
    await notificacionesService.marcarTodasLeidas(req.usuario.id);
    return { mensaje: 'Notificaciones leídas' };
  }),
};
