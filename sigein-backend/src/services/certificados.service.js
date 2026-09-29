const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const prisma = require('../config/prisma');
const { frontendUrl, empresaNombre } = require('../config');
const { HttpError } = require('../utils/errores');
const { enviarCorreo } = require('../utils/correo');
const { hoy } = require('../utils/fechas');

// Sin letras ni números que se confundan al escribirlos (0/O, 1/I/L)
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function nuevoCodigo() {
  const bytes = crypto.randomBytes(8);
  const parte = [...bytes].map((b) => ALFABETO[b % ALFABETO.length]).join('');
  return `SIG-${new Date().getFullYear()}-${parte}`;
}

const urlVerificacion = (codigo) => `${frontendUrl}/verificar/${codigo}`;

const fechaLarga = (fecha) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(fecha);

const incluirDatos = {
  asignacion: {
    include: {
      usuario: { select: { id: true, nombres: true, apellidos: true, documento: true, email: true } },
      programa: { select: { titulo: true, duracionHoras: true } },
    },
  },
};

// RF-19: se emite una sola vez, cuando la asignación queda completada
async function emitir(asignacionId) {
  const existente = await prisma.certificado.findUnique({ where: { asignacionId } });
  if (existente) return existente;

  const certificado = await prisma.certificado.create({
    data: { asignacionId, codigoVerificacion: nuevoCodigo(), fechaEmision: hoy() },
    include: incluirDatos,
  });
  const { usuario, programa } = certificado.asignacion;
  await prisma.notificacion.create({
    data: { usuarioId: usuario.id, titulo: 'Certificado disponible', mensaje: `Ya puede descargar el certificado de "${programa.titulo}".` },
  });
  await enviarCorreo({
    para: usuario.email,
    asunto: `SIGEIN - Certificado de ${programa.titulo}`,
    texto:
      `Hola ${usuario.nombres}, felicitaciones por completar "${programa.titulo}".\n` +
      `Descargue su certificado en ${frontendUrl}/certificados\n` +
      `Código de verificación: ${certificado.codigoVerificacion}`,
  });
  return certificado;
}

function formatear(c) {
  return {
    id: c.id,
    codigo: c.codigoVerificacion,
    fechaEmision: c.fechaEmision,
    urlVerificacion: urlVerificacion(c.codigoVerificacion),
    programa: c.asignacion.programa,
  };
}

// HU-12: certificados del colaborador. Si alguna inducción completada no lo tiene, se emite aquí.
async function listarPropios(usuarioId) {
  const sinCertificado = await prisma.asignacion.findMany({
    where: { usuarioId, estado: 'completada', certificado: null },
    select: { id: true },
  });
  for (const a of sinCertificado) await emitir(a.id);

  const certificados = await prisma.certificado.findMany({
    where: { asignacion: { usuarioId } },
    include: incluirDatos,
    orderBy: { fechaEmision: 'desc' },
  });
  return certificados.map(formatear);
}

// CU-12: genera el PDF (A4 horizontal) con los datos, la firma y el código QR
async function generarPdf(id, usuarioId) {
  const certificado = await prisma.certificado.findFirst({ where: { id, asignacion: { usuarioId } }, include: incluirDatos });
  if (!certificado) throw new HttpError(404, 'Certificado no encontrado');

  const { usuario, programa } = certificado.asignacion;
  const codigo = certificado.codigoVerificacion;
  const qr = await QRCode.toBuffer(urlVerificacion(codigo), { margin: 1, width: 360, color: { dark: '#1f4e79' } });

  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margin: 0,
    info: { Title: `Certificado - ${programa.titulo}`, Author: empresaNombre, Subject: `Código ${codigo}` },
  });
  const partes = [];
  doc.on('data', (parte) => partes.push(parte));
  const terminado = new Promise((resolver) => doc.on('end', () => resolver(Buffer.concat(partes))));

  const { width: W, height: H } = doc.page;
  const centrado = { width: W, align: 'center' };

  // Marco
  doc.rect(22, 22, W - 44, H - 44).lineWidth(4).stroke('#1f4e79');
  doc.rect(32, 32, W - 64, H - 64).lineWidth(1).stroke('#2e75b6');

  // Encabezado
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#2e75b6').text(empresaNombre.toUpperCase(), 0, 62, { ...centrado, characterSpacing: 3 });
  doc.font('Helvetica-Bold').fontSize(32).fillColor('#1f4e79').text('CERTIFICADO DE INDUCCIÓN', 0, 88, centrado);
  doc.moveTo(W / 2 - 60, 132).lineTo(W / 2 + 60, 132).lineWidth(2).stroke('#2e75b6');

  // Cuerpo
  doc.font('Helvetica').fontSize(14).fillColor('#475569').text('Se certifica que', 0, 158, centrado);
  doc.font('Helvetica-Bold').fontSize(28).fillColor('#0f172a').text(`${usuario.nombres} ${usuario.apellidos}`, 60, 182, { width: W - 120, align: 'center' });
  doc.font('Helvetica').fontSize(13).fillColor('#475569').text(`identificado(a) con documento No. ${usuario.documento}`, 0, doc.y + 6, centrado);
  doc.text('completó satisfactoriamente el programa de inducción', 0, doc.y + 14, centrado);
  doc.font('Helvetica-Bold').fontSize(19).fillColor('#1f4e79').text(`«${programa.titulo}»`, 90, doc.y + 8, { width: W - 180, align: 'center' });
  doc
    .font('Helvetica')
    .fontSize(13)
    .fillColor('#475569')
    .text(`con una intensidad de ${programa.duracionHoras} hora(s). Expedido el ${fechaLarga(certificado.fechaEmision)}.`, 0, doc.y + 8, centrado);

  // Firma
  const yFirma = H - 132;
  doc.moveTo(110, yFirma).lineTo(340, yFirma).lineWidth(1).stroke('#94a3b8');
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0f172a').text('Dirección de Talento Humano', 110, yFirma + 8, { width: 230, align: 'center' });
  doc.font('Helvetica').fontSize(10).fillColor('#64748b').text(empresaNombre, 110, yFirma + 24, { width: 230, align: 'center' });

  // Código QR y código de verificación
  const tamQr = 96;
  const xQr = W - 110 - 150 + (150 - tamQr) / 2;
  doc.image(qr, xQr, H - 200, { width: tamQr });
  doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Código de verificación', W - 260, H - 98, { width: 150, align: 'center' });
  doc.font('Helvetica-Bold').fontSize(11).fillColor('#1f4e79').text(codigo, W - 270, H - 85, { width: 170, align: 'center' });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#94a3b8')
    .text(`Verifique la autenticidad de este certificado en ${urlVerificacion(codigo)}`, 0, H - 56, centrado);

  doc.end();
  return { pdf: await terminado, nombreArchivo: `certificado-${codigo}.pdf` };
}

// RF-20: página pública de verificación. El documento se muestra parcialmente por privacidad.
async function verificar(codigo) {
  const certificado = await prisma.certificado.findUnique({
    where: { codigoVerificacion: codigo.trim().toUpperCase() },
    include: incluirDatos,
  });
  if (!certificado) throw new HttpError(404, 'No existe un certificado con ese código');
  const { usuario, programa } = certificado.asignacion;
  return {
    valido: true,
    codigo: certificado.codigoVerificacion,
    nombre: `${usuario.nombres} ${usuario.apellidos}`,
    documento: `${'•'.repeat(Math.max(usuario.documento.length - 4, 2))}${usuario.documento.slice(-4)}`,
    programa: programa.titulo,
    horas: programa.duracionHoras,
    fechaEmision: certificado.fechaEmision,
    empresa: empresaNombre,
  };
}

module.exports = { emitir, listarPropios, generarPdf, verificar };
