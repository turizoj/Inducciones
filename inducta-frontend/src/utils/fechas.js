// Las fechas límite llegan como medianoche UTC ("2026-10-05T00:00:00.000Z"): se muestran en UTC
// para que no aparezcan un día antes por la zona horaria de Colombia.
const formato = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatearFecha(iso) {
  return formato.format(new Date(iso))
}

// Fecha de hoy (más unos días) en formato AAAA-MM-DD según la hora local, para los campos de fecha
export function fechaTexto(diasAdelante = 0) {
  const d = new Date()
  d.setDate(d.getDate() + diasAdelante)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Días que faltan para la fecha límite (negativo si ya pasó)
export function diasRestantes(iso) {
  const limite = new Date(iso)
  const hoy = new Date(`${fechaTexto()}T00:00:00.000Z`)
  return Math.round((limite - hoy) / 86400000)
}

// "Vence hoy", "Vence en 3 días", "Venció hace 2 días"
export function textoVencimiento(iso) {
  const dias = diasRestantes(iso)
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  if (dias > 1) return `Vence en ${dias} días`
  return dias === -1 ? 'Venció ayer' : `Venció hace ${-dias} días`
}
