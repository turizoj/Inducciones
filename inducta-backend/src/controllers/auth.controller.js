const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    res.json(await authService.login(req.body.email, req.body.password));
  } catch (err) {
    next(err);
  }
}

async function perfil(req, res, next) {
  try {
    res.json(await authService.perfil(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

async function recuperar(req, res, next) {
  try {
    await authService.solicitarRecuperacion(req.body.email);
    res.json({ mensaje: 'Si el correo está registrado, recibirá un enlace para restablecer la contraseña.' });
  } catch (err) {
    next(err);
  }
}

async function restablecer(req, res, next) {
  try {
    await authService.restablecerPassword(req.body.token, req.body.password);
    res.json({ mensaje: 'Contraseña actualizada. Ya puede iniciar sesión.' });
  } catch (err) {
    next(err);
  }
}

async function aceptarDatos(req, res, next) {
  try {
    res.json(await authService.aceptarPoliticaDatos(req.usuario.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { login, perfil, recuperar, restablecer, aceptarDatos };
