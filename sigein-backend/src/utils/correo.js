// Envío de correos. Mientras se configura Nodemailer (RNF de notificaciones),
// los correos se muestran en la consola del servidor.
async function enviarCorreo({ para, asunto, texto }) {
  console.log(`\n[Correo] Para: ${para}\n[Correo] Asunto: ${asunto}\n${texto}\n`);
}

module.exports = { enviarCorreo };
