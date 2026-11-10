const usuariosService = require('../services/usuarios.service');
const { idDeRuta } = require('../utils/textos');

async function listar(req, res, next) {
  try {
    res.json(await usuariosService.listar(req.filtros));
  } catch (err) {
    next(err);
  }
}

async function obtener(req, res, next) {
  try {
    res.json(await usuariosService.obtener(idDeRuta(req.params.id)));
  } catch (err) {
    next(err);
  }
}

async function crear(req, res, next) {
  try {
    res.status(201).json(await usuariosService.crear(req.body));
  } catch (err) {
    next(err);
  }
}

async function actualizar(req, res, next) {
  try {
    res.json(await usuariosService.actualizar(idDeRuta(req.params.id), req.body, req.usuario.id));
  } catch (err) {
    next(err);
  }
}

async function cambiarEstado(req, res, next) {
  try {
    res.json(await usuariosService.cambiarEstado(idDeRuta(req.params.id), req.body.estado, req.usuario.id));
  } catch (err) {
    next(err);
  }
}

async function importar(req, res, next) {
  try {
    res.json(await usuariosService.importar(req.body.csv));
  } catch (err) {
    next(err);
  }
}

async function roles(req, res, next) {
  try {
    res.json(await usuariosService.listarRoles());
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, importar, roles };
