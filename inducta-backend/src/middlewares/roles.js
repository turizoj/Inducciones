// Permite el acceso solo a los roles indicados. Se usa después de auth.
function permitirRoles(...roles) {
  return (req, res, next) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      return res.status(403).json({ mensaje: 'No tiene permiso para esta acción' });
    }
    next();
  };
}

module.exports = permitirRoles;
