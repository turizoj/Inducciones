import cliente from './cliente'

// Constructor de evaluaciones (HU-07): administrador
export async function obtenerEvaluacion(moduloId) {
  const { data } = await cliente.get(`/modulos/${moduloId}/evaluacion`)
  return data
}

export async function guardarEvaluacion({ moduloId, ...datos }) {
  const { data } = await cliente.put(`/modulos/${moduloId}/evaluacion`, datos)
  return data
}

export async function eliminarEvaluacion(moduloId) {
  const { data } = await cliente.delete(`/modulos/${moduloId}/evaluacion`)
  return data
}

// Presentar evaluación (HU-11): colaborador
export async function informacionEvaluacion({ evaluacionId, asignacionId }) {
  const { data } = await cliente.get(`/evaluaciones/${evaluacionId}`, { params: { asignacionId } })
  return data
}

export async function iniciarIntento({ evaluacionId, asignacionId }) {
  const { data } = await cliente.post(`/evaluaciones/${evaluacionId}/intentos`, { asignacionId })
  return data
}

export async function enviarRespuestas({ intentoId, respuestas }) {
  const { data } = await cliente.post(`/evaluaciones/intentos/${intentoId}/respuestas`, { respuestas })
  return data
}

// Certificados (HU-12)
export async function listarCertificados() {
  const { data } = await cliente.get('/certificados')
  return data
}

// Descarga el PDF con la sesión del colaborador y lo guarda en el equipo
export async function descargarCertificado({ id, codigo }) {
  const { data } = await cliente.get(`/certificados/${id}/pdf`, { responseType: 'blob' })
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(data)
  enlace.download = `certificado-${codigo}.pdf`
  enlace.click()
  setTimeout(() => URL.revokeObjectURL(enlace.href), 1000)
}

// Verificación pública (RF-20): no necesita sesión
export async function verificarCertificado(codigo) {
  const { data } = await cliente.get(`/certificados/${encodeURIComponent(codigo)}/verificar`)
  return data
}
