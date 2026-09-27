const reportesService = require('../services/reportes.service');

async function resumen(req, res, next) {
  try {
    res.json(await reportesService.resumen());
  } catch (err) {
    next(err);
  }
}

module.exports = { resumen };
