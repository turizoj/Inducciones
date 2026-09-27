// Manejador central de errores de Express
function errores(err, req, res, next) {
  if (err.status) {
    return res.status(err.status).json({ mensaje: err.message });
  }
  console.error(err);
  res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = errores;
