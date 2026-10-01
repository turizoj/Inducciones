const prisma = require('../config/prisma');
const { frontendUrl } = require('../config');
const { enviarCorreo } = require('../utils/correo');
const { hoy, formatearFecha } = require('../utils/fechas');

const DIAS_ANTES = 3;
const CADA_HORA = 60 * 60 * 1000;

// HU-15: recordatorio interno y por correo cuando faltan 3 días o menos para la fecha límite.
// Se envía una sola vez por asignación (queda marcado en recordatorioAt).
async function enviarRecordatorios() {
  const desde = hoy();
  const hasta = new Date(desde.getTime() + DIAS_ANTES * 86400000);
  const pendientes = await prisma.asignacion.findMany({
    where: {
      estado: { in: ['pendiente', 'en_curso'] },
      recordatorioAt: null,
      fechaLimite: { gte: desde, lte: hasta },
      usuario: { estado: 'activo' },
    },
    include: {
      usuario: { select: { nombres: true, email: true } },
      programa: { select: { titulo: true } },
    },
  });

  for (const a of pendientes) {
    const dias = Math.round((a.fechaLimite - desde) / 86400000);
    const cuando = dias === 0 ? 'hoy' : dias === 1 ? 'mañana' : `en ${dias} días`;
    const limite = formatearFecha(a.fechaLimite);
    await prisma.$transaction([
      prisma.notificacion.create({
        data: {
          usuarioId: a.usuarioId,
          titulo: 'Inducción por vencer',
          mensaje: `"${a.programa.titulo}" vence ${cuando} (${limite}). Lleva ${Math.round(Number(a.porcentajeAvance))} % de avance.`.slice(0, 255),
        },
      }),
      prisma.asignacion.update({ where: { id: a.id }, data: { recordatorioAt: new Date() } }),
    ]);
    await enviarCorreo({
      para: a.usuario.email,
      asunto: `SIGEIN - Su inducción vence ${cuando}`,
      texto:
        `Hola ${a.usuario.nombres}, le recordamos que la inducción "${a.programa.titulo}" vence ${cuando} (${limite}).\n` +
        `Continúe en ${frontendUrl}/mis-inducciones`,
    });
  }
  return pendientes.length;
}

// Revisa al encender el servidor y luego cada hora
function iniciarRecordatorios() {
  const ejecutar = () =>
    enviarRecordatorios()
      .then((n) => n && console.log(`[Recordatorios] Se enviaron ${n} recordatorio(s) de vencimiento`))
      .catch((err) => console.error('[Recordatorios] Error:', err));
  setTimeout(ejecutar, 10 * 1000);
  setInterval(ejecutar, CADA_HORA).unref();
}

module.exports = { enviarRecordatorios, iniciarRecordatorios };
