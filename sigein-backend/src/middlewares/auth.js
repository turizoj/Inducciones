const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Verifica el token JWT enviado en la cabecera Authorization: Bearer <token>
function auth(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ mensaje: 'No autenticado' });
  }
  try {
    const datos = jwt.verify(token, jwtSecret);
    req.usuario = { id: datos.sub, rol: datos.rol };
    next();
  } catch {
    return res.status(401).json({ mensaje: 'La sesión venció o no es válida' });
  }
}

module.exports = auth;
