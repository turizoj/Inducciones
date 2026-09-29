const { borrarArchivoSubido } = require('../utils/archivos');

// Manejador central de errores de Express
function errores(err, req, res, next) {
  borrarArchivoSubido(req);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ mensaje: 'El archivo supera el tamaño máximo permitido' });
  }
  if (err.status) {
    return res.status(err.status).json({ mensaje: err.message });
  }
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = errores;
