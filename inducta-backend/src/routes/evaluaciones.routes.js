const { Router } = require('express');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const controller = require('../controllers/evaluaciones.controller');
const { esquemaEvaluacion, esquemaIniciar, esquemaRespuestas } = require('../schemas/evaluaciones.schema');

// /api/modulos/:id/evaluacion (HU-07): constructor del administrador
const evaluacionModulo = Router();
evaluacionModulo.use(auth, permitirRoles('Administrador'));
evaluacionModulo.get('/:id/evaluacion', controller.obtenerEvaluacion);
evaluacionModulo.put('/:id/evaluacion', validar(esquemaEvaluacion), controller.guardarEvaluacion);
evaluacionModulo.delete('/:id/evaluacion', controller.eliminarEvaluacion);

// /api/evaluaciones (HU-11): el colaborador presenta la evaluación
const evaluaciones = Router();
evaluaciones.use(auth, permitirRoles('Colaborador'));
evaluaciones.get('/:id', validar(esquemaIniciar, 'query'), controller.informacion);
evaluaciones.post('/:id/intentos', validar(esquemaIniciar), controller.iniciarIntento);
evaluaciones.post('/intentos/:id/respuestas', validar(esquemaRespuestas), controller.responder);

// /api/certificados (HU-12). La verificación es pública (RF-20): no pide sesión.
const certificados = Router();
certificados.get('/:codigo/verificar', controller.verificar);
certificados.get('/', auth, permitirRoles('Colaborador'), controller.misCertificados);
certificados.get('/:id/pdf', auth, permitirRoles('Colaborador'), controller.descargarPdf);

module.exports = { evaluacionModulo, evaluaciones, certificados };
