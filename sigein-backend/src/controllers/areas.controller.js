const areasService = require('../services/areas.service');
const cargosService = require('../services/cargos.service');
const { idDeRuta } = require('../utils/textos');

// Crea los controladores de áreas o de cargos, que funcionan igual
function controladores(servicio, nombre) {
  return {
    async listar(req, res, next) {
      try {
        res.json(await servicio.listar(req.filtros));
      } catch (err) {
        next(err);
      }
    },
    async crear(req, res, next) {
      try {
        res.status(201).json(await servicio.crear(req.body));
      } catch (err) {
        next(err);
      }
    },
    async actualizar(req, res, next) {
      try {
        res.json(await servicio.actualizar(idDeRuta(req.params.id), req.body));
      } catch (err) {
        next(err);
      }
    },
    async cambiarEstado(req, res, next) {
      try {
        res.json(await servicio.cambiarEstado(idDeRuta(req.params.id), req.body.estado));
      } catch (err) {
        next(err);
      }
    },
    async eliminar(req, res, next) {
      try {
        await servicio.eliminar(idDeRuta(req.params.id));
        res.json({ mensaje: `${nombre} eliminado` });
      } catch (err) {
        next(err);
      }
    },
  };
}

module.exports = {
  areas: controladores(areasService, 'Área'),
  cargos: controladores(cargosService, 'Cargo'),
};
