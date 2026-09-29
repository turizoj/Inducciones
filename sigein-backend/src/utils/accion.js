// Envuelve una acción de un controlador: responde con lo que devuelve el servicio
// o pasa el error al manejador central
function accion(fn, estado = 200) {
  return async (req, res, next) => {
    try {
      res.status(estado).json(await fn(req));
    } catch (err) {
      next(err);
    }
  };
}

module.exports = accion;
