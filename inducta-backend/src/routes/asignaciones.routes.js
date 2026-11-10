const { Router } = require('express');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const controller = require('../controllers/asignaciones.controller');
const {
  esquemaFiltrosAsignaciones,
  esquemaAsignacion,
  esquemaFecha,
  esquemaProgreso,
} = require('../schemas/asignaciones.schema');

// /api/asignaciones (HU-08): el jefe de área queda limitado a su área dentro del servicio
const asignaciones = Router();
asignaciones.use(auth, permitirRoles('Administrador', 'Jefe de área'));
asignaciones.get('/', validar(esquemaFiltrosAsignaciones, 'query'), controller.listar);
asignaciones.get('/opciones', controller.opciones);
asignaciones.post('/', validar(esquemaAsignacion), controller.crear);
asignaciones.patch('/:id/fecha', validar(esquemaFecha), controller.cambiarFecha);
asignaciones.delete('/:id', controller.eliminar);

// /api/mis-inducciones (HU-09, HU-10)
const misInducciones = Router();
misInducciones.use(auth, permitirRoles('Colaborador'));
misInducciones.get('/', controller.misInducciones);
misInducciones.get('/:id', controller.miInduccion);

// /api/progreso/:contenidoId (RF-16)
const progreso = Router();
progreso.use(auth, permitirRoles('Colaborador'));
progreso.post('/:contenidoId', validar(esquemaProgreso), controller.marcarVisto);

// /api/notificaciones (RF-24)
const notificaciones = Router();
notificaciones.use(auth);
notificaciones.get('/', controller.notificaciones);
notificaciones.patch('/leidas', controller.marcarTodasLeidas);
notificaciones.patch('/:id/leida', controller.marcarLeida);

module.exports = { asignaciones, misInducciones, progreso, notificaciones };
