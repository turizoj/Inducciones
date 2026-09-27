// Valida req.body (o req.query) con un esquema de zod y deja los datos limpios.
// En Express 5 req.query es de solo lectura, por eso la consulta validada queda en req.filtros.
function validar(esquema, origen = 'body') {
  return (req, res, next) => {
    const resultado = esquema.safeParse(req[origen]);
    if (!resultado.success) {
      const errores = resultado.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
      return res.status(400).json({ mensaje: 'Datos inválidos', errores });
    }
    if (origen === 'query') req.filtros = resultado.data;
    else req.body = resultado.data;
    next();
  };
}

module.exports = validar;
