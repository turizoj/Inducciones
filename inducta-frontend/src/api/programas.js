import cliente from './cliente'

// Servicios de programas, módulos y contenidos (HU-05, HU-06)

export async function listarProgramas(filtros) {
  const { data } = await cliente.get('/programas', { params: filtros })
  return data
}

export async function obtenerPrograma(id) {
  const { data } = await cliente.get(`/programas/${id}`)
  return data
}

export async function guardarPrograma({ id, ...datos }) {
  const { data } = id ? await cliente.put(`/programas/${id}`, datos) : await cliente.post('/programas', datos)
  return data
}

export async function cambiarEstadoPrograma({ id, estado }) {
  const { data } = await cliente.patch(`/programas/${id}/estado`, { estado })
  return data
}

export async function eliminarPrograma(id) {
  const { data } = await cliente.delete(`/programas/${id}`)
  return data
}

export async function subirImagenPrograma({ id, archivo }) {
  const formulario = new FormData()
  formulario.append('imagen', archivo)
  const { data } = await cliente.post(`/programas/${id}/imagen`, formulario)
  return data
}

export async function quitarImagenPrograma(id) {
  const { data } = await cliente.delete(`/programas/${id}/imagen`)
  return data
}

export async function guardarModulo({ id, programaId, ...datos }) {
  const { data } = id ? await cliente.put(`/modulos/${id}`, datos) : await cliente.post(`/programas/${programaId}/modulos`, datos)
  return data
}

export async function eliminarModulo(id) {
  const { data } = await cliente.delete(`/modulos/${id}`)
  return data
}

export async function ordenarModulos({ programaId, ids }) {
  const { data } = await cliente.put(`/programas/${programaId}/modulos/orden`, { ids })
  return data
}

// El contenido se envía como formulario porque puede llevar un archivo (PDF o MP4)
export async function guardarContenido({ id, moduloId, datos, archivo, onProgreso }) {
  const formulario = new FormData()
  Object.entries(datos).forEach(([clave, valor]) => formulario.append(clave, valor ?? ''))
  if (archivo) formulario.append('archivo', archivo)
  const opciones = {
    onUploadProgress: (e) => e.total && onProgreso?.(Math.round((e.loaded / e.total) * 100)),
  }
  const { data } = id
    ? await cliente.put(`/contenidos/${id}`, formulario, opciones)
    : await cliente.post(`/modulos/${moduloId}/contenidos`, formulario, opciones)
  return data
}

export async function eliminarContenido(id) {
  const { data } = await cliente.delete(`/contenidos/${id}`)
  return data
}

export async function ordenarContenidos({ moduloId, ids }) {
  const { data } = await cliente.put(`/modulos/${moduloId}/contenidos/orden`, { ids })
  return data
}
