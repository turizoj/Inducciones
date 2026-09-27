import axios from 'axios'

export const CLAVE_TOKEN = 'sigein_token'

// Cliente HTTP que envía el token JWT en cada petición a la API
const cliente = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

cliente.interceptors.request.use((config) => {
  const token = localStorage.getItem(CLAVE_TOKEN)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Devuelve el mensaje de error que envía la API, o uno genérico si no hay conexión
export function mensajeDeError(error) {
  if (!error.response) return 'No fue posible conectar con el servidor. Intente de nuevo.'
  return error.response.data?.mensaje || 'Ocurrió un error inesperado.'
}

export default cliente
