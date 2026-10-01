import cliente from './cliente'

// Quita los filtros vacíos para no enviarlos en la dirección
const limpiar = (filtros) => Object.fromEntries(Object.entries(filtros).filter(([, v]) => v !== '' && v !== null && v !== undefined))

// HU-13 / HU-14: reporte de cumplimiento (el jefe de área recibe solo su área)
export async function obtenerCumplimiento(filtros) {
  const { data } = await cliente.get('/reportes/cumplimiento', { params: limpiar(filtros) })
  return data
}

// HU-14: descarga el reporte en Excel o PDF con los mismos filtros de la pantalla
export async function descargarReporte({ formato, filtros }) {
  const respuesta = await cliente.get(`/reportes/cumplimiento/${formato}`, { params: limpiar(filtros), responseType: 'blob' })
  const nombre = respuesta.headers['content-disposition']?.match(/filename="([^"]+)"/)?.[1] ?? `reporte.${formato === 'excel' ? 'xlsx' : 'pdf'}`
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(respuesta.data)
  enlace.download = nombre
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}
