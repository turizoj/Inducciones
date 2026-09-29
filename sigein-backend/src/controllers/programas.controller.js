const programasService = require('../services/programas.service');
const modulosService = require('../services/modulos.service');
const contenidosService = require('../services/contenidos.service');
const { HttpError } = require('../utils/errores');
const { rutaPublica, verificarTipoReal } = require('../utils/archivos');
const { idDeRuta } = require('../utils/textos');

// Envuelve cada acción: responde con lo que devuelve el servicio o pasa el error al manejador central
function accion(fn, estado = 200) {
  return async (req, res, next) => {
    try {
      res.status(estado).json(await fn(req));
    } catch (err) {
      next(err);
    }
  };
}

const id = (req) => idDeRuta(req.params.id);

module.exports = {
  // Programas (HU-05)
  listar: accion((req) => programasService.listar(req.filtros)),
  obtener: accion((req) => programasService.obtener(id(req))),
  crear: accion((req) => programasService.crear(req.body, req.usuario.id), 201),
  actualizar: accion((req) => programasService.actualizar(id(req), req.body)),
  cambiarEstado: accion((req) => programasService.cambiarEstado(id(req), req.body.estado)),
  eliminar: accion(async (req) => {
    await programasService.eliminar(id(req));
    return { mensaje: 'Programa eliminado' };
  }),
  subirImagen: accion((req) => {
    if (!req.file) throw new HttpError(400, 'Seleccione una imagen');
    verificarTipoReal(req.file, 'imagen JPG, PNG o WEBP');
    return programasService.cambiarImagen(id(req), rutaPublica(req.file, 'programas'));
  }),
  quitarImagen: accion((req) => programasService.cambiarImagen(id(req), null)),

  // Módulos (HU-06)
  crearModulo: accion((req) => modulosService.crear(id(req), req.body), 201),
  actualizarModulo: accion((req) => modulosService.actualizar(id(req), req.body)),
  eliminarModulo: accion(async (req) => {
    await modulosService.eliminar(id(req));
    return { mensaje: 'Módulo eliminado' };
  }),
  ordenarModulos: accion(async (req) => {
    await modulosService.ordenar(id(req), req.body.ids);
    return { mensaje: 'Orden guardado' };
  }),

  // Contenidos (HU-06)
  crearContenido: accion((req) => contenidosService.crear(id(req), req.body, req.file), 201),
  actualizarContenido: accion((req) => contenidosService.actualizar(id(req), req.body, req.file)),
  eliminarContenido: accion(async (req) => {
    await contenidosService.eliminar(id(req));
    return { mensaje: 'Contenido eliminado' };
  }),
  ordenarContenidos: accion(async (req) => {
    await contenidosService.ordenar(id(req), req.body.ids);
    return { mensaje: 'Orden guardado' };
  }),
};
