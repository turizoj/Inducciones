import cliente from './cliente'

export async function iniciarSesion(datos) {
  const { data } = await cliente.post('/auth/login', datos)
  return data
}

export async function obtenerPerfil() {
  const { data } = await cliente.get('/auth/perfil')
  return data
}

export async function solicitarRecuperacion(datos) {
  const { data } = await cliente.post('/auth/recuperar', datos)
  return data
}

export async function restablecerPassword(datos) {
  const { data } = await cliente.post('/auth/restablecer', datos)
  return data
}

export async function aceptarPoliticaDatos() {
  const { data } = await cliente.post('/auth/aceptar-datos')
  return data
}
