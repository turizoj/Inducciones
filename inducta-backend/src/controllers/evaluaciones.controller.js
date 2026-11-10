const evaluacionesService = require('../services/evaluaciones.service');
const intentosService = require('../services/intentos.service');
const certificadosService = require('../services/certificados.service');
const { idDeRuta } = require('../utils/textos');
const accion = require('../utils/accion');

const id = (req) => idDeRuta(req.params.id);

module.exports = {
  // Constructor de evaluaciones (HU-07): administrador
  obtenerEvaluacion: accion((req) => evaluacionesService.obtener(id(req))),
  guardarEvaluacion: accion((req) => evaluacionesService.guardar(id(req), req.body)),
  eliminarEvaluacion: accion(async (req) => {
    await evaluacionesService.eliminar(id(req));
    return { mensaje: 'Evaluación eliminada' };
  }),

  // Presentar evaluación (HU-11): colaborador
  informacion: accion((req) => intentosService.informacion(id(req), req.filtros.asignacionId, req.usuario.id)),
  iniciarIntento: accion((req) => intentosService.iniciar(id(req), req.body.asignacionId, req.usuario.id), 201),
  responder: accion((req) => intentosService.responder(id(req), req.body.respuestas, req.usuario.id)),

  // Certificados (HU-12)
  misCertificados: accion((req) => certificadosService.listarPropios(req.usuario.id)),
  verificar: accion((req) => certificadosService.verificar(req.params.codigo)),
  async descargarPdf(req, res, next) {
    try {
      const { pdf, nombreArchivo } = await certificadosService.generarPdf(id(req), req.usuario.id);
      res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${nombreArchivo}"` });
      res.send(pdf);
    } catch (err) {
      // CU-12 flujo 3a: el error queda registrado en la consola del servidor para el administrador
      if (!err.status) console.error('[Certificados] Error al generar el PDF:', err);
      next(err);
    }
  },
};
