import { Navigate, Outlet, useLocation } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import PantallaCarga from '../components/PantallaCarga'
import { rutaInicioPorRol } from '../utils/roles'

// Deja pasar solo a usuarios autenticados y, si se indica, con uno de los roles permitidos (RF-04)
export default function RutaProtegida({ roles, exigirPolitica = true }) {
  const { usuario, cargando } = useAuth()
  const location = useLocation()

  if (cargando) return <PantallaCarga />
  if (!usuario) return <Navigate to="/login" replace state={{ desde: location.pathname }} />
  if (exigirPolitica && !usuario.aceptaDatosAt) return <Navigate to="/politica-datos" replace />
  if (roles && !roles.includes(usuario.rol)) return <Navigate to={rutaInicioPorRol(usuario.rol)} replace />

  return <Outlet />
}
