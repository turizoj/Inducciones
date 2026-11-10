import cliente from './cliente'

// Asignaciones (HU-08): administrador y jefe de área
export async function listarAsignaciones(filtros) {
  const { data } = await cliente.get('/asignaciones', { params: filtros })
  return data
}

export async function opcionesAsignacion() {
  const { data } = await cliente.get('/asignaciones/opciones')
  return data
}

export async function crearAsignacion(datos) {
  const { data } = await cliente.post('/asignaciones', datos)
  return data
}

export async function cambiarFechaAsignacion({ id, fechaLimite }) {
  const { data } = await cliente.patch(`/asignaciones/${id}/fecha`, { fechaLimite })
  return data
}

export async function eliminarAsignacion(id) {
  const { data } = await cliente.delete(`/asignaciones/${id}`)
  return data
}

// Mis inducciones y avance (HU-09, HU-10): colaborador
export async function listarMisInducciones() {
  const { data } = await cliente.get('/mis-inducciones')
  return data
}

export async function obtenerMiInduccion(id) {
  const { data } = await cliente.get(`/mis-inducciones/${id}`)
  return data
}

export async function marcarContenidoVisto({ asignacionId, contenidoId }) {
  const { data } = await cliente.post(`/progreso/${contenidoId}`, { asignacionId })
  return data
}

// Notificaciones (RF-24): todos los roles
export async function listarNotificaciones() {
  const { data } = await cliente.get('/notificaciones')
  return data
}

export async function marcarNotificacionLeida(id) {
  const { data } = await cliente.patch(`/notificaciones/${id}/leida`)
  return data
}

export async function marcarTodasLeidas() {
  const { data } = await cliente.patch('/notificaciones/leidas')
  return data
}
