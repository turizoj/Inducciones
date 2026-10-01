const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { empresaNombre } = require('../config');
const { formatearFecha } = require('./fechas');

const NOMBRES_ESTADO = { pendiente: 'Pendiente', en_curso: 'En curso', completada: 'Completada', vencida: 'Vencida' };
const AZUL = '1F4E79';

const ahora = () =>
  new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/Bogota',
  }).format(new Date());

const textoResumen = (r) =>
  `Total: ${r.total} · Completadas: ${r.completada} · En curso: ${r.en_curso} · Pendientes: ${r.pendiente} · Vencidas: ${r.vencida}` +
  ` · Cumplimiento: ${r.cumplimiento ?? 0} %` +
  (r.tasaAprobacion !== null ? ` · Aprobación de evaluaciones: ${r.tasaAprobacion} %` : '');

const COLUMNAS = [
  { titulo: 'Colaborador', valor: (f) => f.colaborador, ancho: 26 },
  { titulo: 'Documento', valor: (f) => f.documento, ancho: 14 },
  { titulo: 'Área', valor: (f) => f.area ?? '', ancho: 18 },
  { titulo: 'Cargo', valor: (f) => f.cargo ?? '', ancho: 20 },
  { titulo: 'Programa', valor: (f) => f.programa, ancho: 28 },
  { titulo: 'Asignada', valor: (f) => formatearFecha(f.fechaAsignacion), ancho: 12 },
  { titulo: 'Fecha límite', valor: (f) => formatearFecha(f.fechaLimite), ancho: 12 },
  { titulo: 'Estado', valor: (f) => NOMBRES_ESTADO[f.estado], ancho: 12 },
  { titulo: 'Avance', valor: (f) => `${Math.round(f.porcentajeAvance)} %`, ancho: 9 },
  { titulo: 'Nota', valor: (f) => (f.nota === null ? '—' : f.nota.toFixed(1)), ancho: 7 },
  { titulo: 'Certificado', valor: (f) => f.certificado ?? '', ancho: 20 },
];

// HU-14: reporte en Excel con título, filtros aplicados, resumen y la tabla con autofiltro
async function aExcel(reporte, filtrosTexto) {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'SIGEIN';
  libro.created = new Date();
  const hoja = libro.addWorksheet('Cumplimiento', { views: [{ state: 'frozen', ySplit: 6 }] });
  hoja.columns = COLUMNAS.map((c) => ({ width: c.ancho }));

  hoja.mergeCells(1, 1, 1, COLUMNAS.length);
  hoja.getCell('A1').value = `${empresaNombre} · Reporte de cumplimiento de inducciones`;
  hoja.getCell('A1').font = { bold: true, size: 14, color: { argb: `FF${AZUL}` } };
  hoja.getCell('A2').value = `Generado: ${ahora()}`;
  hoja.getCell('A3').value = `Filtros: ${filtrosTexto}`;
  hoja.getCell('A4').value = textoResumen(reporte.resumen);
  ['A2', 'A3', 'A4'].forEach((c) => (hoja.getCell(c).font = { color: { argb: 'FF475569' } }));

  const encabezado = hoja.getRow(6);
  encabezado.values = COLUMNAS.map((c) => c.titulo);
  encabezado.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  encabezado.eachCell((celda) => {
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${AZUL}` } };
    celda.alignment = { vertical: 'middle' };
  });
  reporte.filas.forEach((f) => {
    const fila = hoja.addRow(COLUMNAS.map((c) => c.valor(f)));
    if (f.estado === 'vencida') fila.getCell(8).font = { bold: true, color: { argb: 'FFC62828' } };
  });
  hoja.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: COLUMNAS.length } };
  if (reporte.truncado) hoja.addRow([`Se muestran las primeras ${reporte.filas.length} filas. Use filtros para acotar el reporte.`]);

  return Buffer.from(await libro.xlsx.writeBuffer());
}

// HU-14: el mismo reporte en PDF (A4 horizontal), repitiendo el encabezado de la tabla en cada página
async function aPdf(reporte, filtrosTexto) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36, bufferPages: true, info: { Title: 'Reporte de cumplimiento', Author: empresaNombre } });
  const partes = [];
  doc.on('data', (p) => partes.push(p));
  const terminado = new Promise((r) => doc.on('end', () => r(Buffer.concat(partes))));

  const ancho = doc.page.width - 72;
  const anchoTotal = COLUMNAS.reduce((s, c) => s + c.ancho, 0);
  const anchos = COLUMNAS.map((c) => (c.ancho / anchoTotal) * ancho);
  const x0 = 36;
  const altoFila = 18;
  const limiteY = doc.page.height - 50;
  // Con la altura fija, PDFKit corta el texto largo con «…» en lugar de pasarlo a otra línea

  doc.font('Helvetica-Bold').fontSize(15).fillColor(`#${AZUL}`).text(`${empresaNombre} · Reporte de cumplimiento de inducciones`);
  doc.font('Helvetica').fontSize(8.5).fillColor('#475569');
  doc.text(`Generado: ${ahora()}`).text(`Filtros: ${filtrosTexto}`).text(textoResumen(reporte.resumen));
  doc.moveDown(0.8);

  const encabezado = () => {
    const y = doc.y;
    doc.rect(x0, y, ancho, altoFila).fill(`#${AZUL}`);
    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
    let x = x0;
    COLUMNAS.forEach((c, i) => {
      doc.text(c.titulo, x + 3, y + 5, { width: anchos[i] - 6, height: 10, lineBreak: false, ellipsis: true });
      x += anchos[i];
    });
    doc.y = y + altoFila;
  };

  encabezado();
  if (reporte.filas.length === 0) {
    doc.moveDown().font('Helvetica').fontSize(9).fillColor('#64748b').text('No hay asignaciones con los filtros aplicados.', x0);
  }
  reporte.filas.forEach((f, n) => {
    if (doc.y + altoFila > limiteY) {
      doc.addPage();
      encabezado();
    }
    const y = doc.y;
    if (n % 2 === 1) doc.rect(x0, y, ancho, altoFila).fill('#f1f5f9');
    let x = x0;
    COLUMNAS.forEach((c, i) => {
      const vencida = c.titulo === 'Estado' && f.estado === 'vencida';
      doc.font(vencida ? 'Helvetica-Bold' : 'Helvetica').fontSize(7.5).fillColor(vencida ? '#c62828' : '#1e293b');
      doc.text(String(c.valor(f)), x + 3, y + 5, { width: anchos[i] - 6, height: 10, lineBreak: false, ellipsis: true });
      x += anchos[i];
    });
    doc.y = y + altoFila;
  });
  if (reporte.truncado) {
    doc.moveDown().fontSize(8).fillColor('#c62828').text(`Se muestran las primeras ${reporte.filas.length} filas. Use filtros para acotar el reporte.`, x0);
  }

  // Número de página al pie
  const rango = doc.bufferedPageRange();
  for (let i = rango.start; i < rango.start + rango.count; i++) {
    doc.switchToPage(i);
    // El pie va dentro del margen inferior; sin esto PDFKit crearía una página nueva
    doc.page.margins.bottom = 0;
    doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text(`Página ${i + 1} de ${rango.count} · SIGEIN`, x0, doc.page.height - 30, {
      width: ancho,
      align: 'right',
      lineBreak: false,
    });
  }

  doc.end();
  return terminado;
}

module.exports = { aExcel, aPdf };
