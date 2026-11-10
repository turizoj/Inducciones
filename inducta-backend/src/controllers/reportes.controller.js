const reportesService = require('../services/reportes.service');
const { aExcel, aPdf } = require('../utils/exportarReporte');
const accion = require('../utils/accion');

// HU-14 criterio 2: el archivo exportado usa los mismos filtros que la pantalla
function exportar(formato) {
  const tipos = {
    excel: { generar: aExcel, mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' },
    pdf: { generar: aPdf, mime: 'application/pdf', extension: 'pdf' },
  };
  const { generar, mime, extension } = tipos[formato];
  return async (req, res, next) => {
    try {
      const [reporte, filtrosTexto] = await Promise.all([
        reportesService.cumplimiento(req.filtros, req.usuario),
        reportesService.describirFiltros(req.filtros, req.usuario),
      ]);
      const archivo = await generar(reporte, filtrosTexto);
      // Fecha de Colombia en formato AAAA-MM-DD para el nombre del archivo
      const fecha = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
      res.set({ 'Content-Type': mime, 'Content-Disposition': `attachment; filename="reporte-cumplimiento-${fecha}.${extension}"` });
      res.send(archivo);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  resumen: accion(() => reportesService.resumen()),
  cumplimiento: accion((req) => reportesService.cumplimiento(req.filtros, req.usuario)),
  excel: exportar('excel'),
  pdf: exportar('pdf'),
};
