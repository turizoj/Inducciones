// Las fechas límite se guardan como DATE (sin hora). Prisma las entrega como medianoche UTC,
// por eso "hoy" también se arma como medianoche UTC del día local del servidor.
function hoy() {
  const d = new Date();
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

function textoAFecha(texto) {
  return new Date(`${texto}T00:00:00.000Z`);
}

// 05/10/2026
function formatearFecha(fecha) {
  return new Intl.DateTimeFormat('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' }).format(fecha);
}

module.exports = { hoy, textoAFecha, formatearFecha };
