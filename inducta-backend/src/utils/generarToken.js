const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config');

function generarToken(usuario) {
  return jwt.sign({ sub: usuario.id, rol: usuario.rol.nombre }, jwtSecret, { expiresIn: jwtExpiresIn });
}

module.exports = generarToken;
