export const ROLES = {
  ADMIN: 'Administrador',
  JEFE: 'Jefe de área',
  COLABORADOR: 'Colaborador',
}

// Panel al que se redirige a cada rol después de iniciar sesión (HU-01)
export function rutaInicioPorRol(rol) {
  if (rol === ROLES.ADMIN) return '/admin'
  if (rol === ROLES.JEFE) return '/jefe'
  return '/mis-inducciones'
}
