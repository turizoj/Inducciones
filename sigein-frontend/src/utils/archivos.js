// Dirección del servidor sin "/api", donde están los archivos cargados (/uploads/...)
const ORIGEN_API = new URL(import.meta.env.VITE_API_URL).origin

// Convierte la ruta guardada en la base de datos en una dirección que el navegador puede abrir
export function urlArchivo(ruta) {
  if (!ruta) return null
  return ruta.startsWith('/uploads/') ? `${ORIGEN_API}${ruta}` : ruta
}

export const MB = 1024 * 1024

// Deben coincidir con los límites del backend (HU-06)
export const LIMITES = { pdf: 20 * MB, video: 100 * MB, imagen: 2 * MB }
