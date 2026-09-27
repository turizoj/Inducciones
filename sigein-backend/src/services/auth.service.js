const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const generarToken = require('../utils/generarToken');
const { frontendUrl } = require('../config');
const { HttpError } = require('../utils/errores');
const { enviarCorreo } = require('../utils/correo');

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;
const MINUTOS_ENLACE = 30;

// Datos del usuario que se pueden enviar al navegador (sin contraseña ni tokens)
function datosPublicos(usuario) {
  return {
    id: usuario.id,
    documento: usuario.documento,
    nombres: usuario.nombres,
    apellidos: usuario.apellidos,
    email: usuario.email,
    telefono: usuario.telefono,
    rol: usuario.rol.nombre,
    cargo: usuario.cargo ? { id: usuario.cargo.id, nombre: usuario.cargo.nombre, area: usuario.cargo.area?.nombre } : null,
    aceptaDatosAt: usuario.aceptaDatosAt,
    ultimoAcceso: usuario.ultimoAcceso,
  };
}

const incluirRelaciones = { rol: true, cargo: { include: { area: true } } };

// CU-01 / HU-01: iniciar sesión con bloqueo tras 5 intentos fallidos
async function login(email, password) {
  const usuario = await prisma.usuario.findUnique({ where: { email }, include: incluirRelaciones });
  const credencialesInvalidas = new HttpError(401, 'Correo o contraseña incorrectos');

  if (!usuario) throw credencialesInvalidas;

  if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
    const minutos = Math.ceil((usuario.bloqueadoHasta - new Date()) / 60000);
    throw new HttpError(423, `Cuenta bloqueada por intentos fallidos. Intente de nuevo en ${minutos} minuto(s).`);
  }

  const valida = await bcrypt.compare(password, usuario.passwordHash);
  if (!valida) {
    const intentos = usuario.intentosFallidos + 1;
    const bloquear = intentos >= MAX_INTENTOS;
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        intentosFallidos: bloquear ? 0 : intentos,
        bloqueadoHasta: bloquear ? new Date(Date.now() + MINUTOS_BLOQUEO * 60000) : null,
      },
    });
    if (bloquear) {
      throw new HttpError(423, `Cuenta bloqueada por ${MINUTOS_BLOQUEO} minutos tras ${MAX_INTENTOS} intentos fallidos.`);
    }
    throw credencialesInvalidas;
  }

  if (usuario.estado === 'inactivo') {
    throw new HttpError(403, 'Su usuario está inactivo. Comuníquese con Talento Humano.');
  }

  const actualizado = await prisma.usuario.update({
    where: { id: usuario.id },
    data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoAcceso: new Date() },
    include: incluirRelaciones,
  });

  return { token: generarToken(actualizado), usuario: datosPublicos(actualizado) };
}

async function perfil(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, include: incluirRelaciones });
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  return datosPublicos(usuario);
}

// HU-02: genera un enlace temporal y lo envía por correo
async function solicitarRecuperacion(email) {
  const usuario = await prisma.usuario.findUnique({ where: { email } });
  // Se responde igual exista o no el correo, para no revelar qué cuentas existen
  if (!usuario || usuario.estado === 'inactivo') return;

  const token = crypto.randomBytes(32).toString('hex');
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      resetTokenExpira: new Date(Date.now() + MINUTOS_ENLACE * 60000),
    },
  });

  await enviarCorreo({
    para: email,
    asunto: 'SIGEIN - Recuperación de contraseña',
    texto: `Para crear una nueva contraseña ingrese a:\n${frontendUrl}/restablecer?token=${token}\nEl enlace vence en ${MINUTOS_ENLACE} minutos.`,
  });
}

async function restablecerPassword(token, password) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const usuario = await prisma.usuario.findFirst({
    where: { resetTokenHash: hash, resetTokenExpira: { gt: new Date() } },
  });
  if (!usuario) throw new HttpError(400, 'El enlace no es válido o ya venció');

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: {
      passwordHash: await bcrypt.hash(password, 10),
      resetTokenHash: null,
      resetTokenExpira: null,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    },
  });
}

// RNF-13: aceptación de la política de tratamiento de datos (Ley 1581 de 2012)
async function aceptarPoliticaDatos(id) {
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { aceptaDatosAt: new Date() },
    include: incluirRelaciones,
  });
  return datosPublicos(usuario);
}

module.exports = { login, perfil, solicitarRecuperacion, restablecerPassword, aceptarPoliticaDatos };
