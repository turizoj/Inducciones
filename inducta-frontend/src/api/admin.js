import cliente from './cliente'

// Servicios de administración: usuarios (HU-03), áreas y cargos (HU-04) y tablero (RF-23)

export async function listarUsuarios(filtros) {
  const { data } = await cliente.get('/usuarios', { params: filtros })
  return data
}

export async function listarRoles() {
  const { data } = await cliente.get('/usuarios/roles')
  return data
}

export async function guardarUsuario({ id, ...datos }) {
  const { data } = id ? await cliente.put(`/usuarios/${id}`, datos) : await cliente.post('/usuarios', datos)
  return data
}

export async function cambiarEstadoUsuario({ id, estado }) {
  const { data } = await cliente.patch(`/usuarios/${id}/estado`, { estado })
  return data
}

export async function importarUsuarios(csv) {
  const { data } = await cliente.post('/usuarios/importar', { csv })
  return data
}

export async function listarAreas(filtros) {
  const { data } = await cliente.get('/areas', { params: filtros })
  return data
}

export async function guardarArea({ id, ...datos }) {
  const { data } = id ? await cliente.put(`/areas/${id}`, datos) : await cliente.post('/areas', datos)
  return data
}

export async function cambiarEstadoArea({ id, estado }) {
  const { data } = await cliente.patch(`/areas/${id}/estado`, { estado })
  return data
}

export async function eliminarArea(id) {
  const { data } = await cliente.delete(`/areas/${id}`)
  return data
}

export async function listarCargos(filtros) {
  const { data } = await cliente.get('/cargos', { params: filtros })
  return data
}

export async function guardarCargo({ id, ...datos }) {
  const { data } = id ? await cliente.put(`/cargos/${id}`, datos) : await cliente.post('/cargos', datos)
  return data
}

export async function cambiarEstadoCargo({ id, estado }) {
  const { data } = await cliente.patch(`/cargos/${id}/estado`, { estado })
  return data
}

export async function eliminarCargo(id) {
  const { data } = await cliente.delete(`/cargos/${id}`)
  return data
}

export async function obtenerResumen() {
  const { data } = await cliente.get('/reportes/resumen')
  return data
}
