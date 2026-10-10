const nodemailer = require('nodemailer');
const { smtp, empresaNombre } = require('../config');

// RF-24: envío de correos con Nodemailer. Si no se configuró un servidor SMTP en el .env,
// los correos se muestran en la consola del servidor (útil en desarrollo).
const transporte = smtp.host
  ? nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    })
  : null;

const escaparHtml = (texto) => texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Versión HTML del mismo texto: respeta los saltos de línea y vuelve clicables los enlaces
function aHtml(asunto, texto) {
  const cuerpo = escaparHtml(texto)
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" style="color:#2e75b6">$1</a>')
    .replace(/\n/g, '<br>');
  return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1e293b;max-width:560px">
  <p style="font-size:18px;font-weight:bold;color:#1f4e79;margin:0 0 16px">${escaparHtml(asunto)}</p>
  <p style="line-height:1.6;margin:0">${cuerpo}</p>
  <p style="font-size:12px;color:#94a3b8;margin-top:24px">${escaparHtml(empresaNombre)} · Mensaje automático de SIGEIN. No responda a este correo.</p>
</div>`;
}

// Un error al enviar el correo no debe detener la acción principal (crear el usuario, asignar…):
// se registra en la consola para que el administrador lo revise.
async function enviarCorreo({ para, asunto, texto }) {
  if (!transporte) {
    console.log(`\n[Correo] Para: ${para}\n[Correo] Asunto: ${asunto}\n${texto}\n`);
    return;
  }
  try {
    return await transporte.sendMail({
      from: `"${empresaNombre} · SIGEIN" <${smtp.remitente}>`,
      to: para,
      subject: asunto,
      text: texto,
      html: aHtml(asunto, texto),
    });
  } catch (err) {
    console.error(`[Correo] No se pudo enviar a ${para} ("${asunto}"):`, err.message);
  }
}

// Revisa al arrancar que la conexión con el servidor de correo funcione
async function verificarCorreo() {
  if (!transporte) {
    console.log('[Correo] Sin servidor SMTP configurado: los correos se mostrarán en esta consola.');
    return;
  }
  try {
    await transporte.verify();
    console.log(`[Correo] Conectado a ${smtp.host}. Los correos se envían desde ${smtp.remitente}.`);
  } catch (err) {
    console.error(`[Correo] No se pudo conectar a ${smtp.host}: ${err.message}. Revise los datos SMTP del archivo .env.`);
  }
}

module.exports = { enviarCorreo, verificarCorreo };
