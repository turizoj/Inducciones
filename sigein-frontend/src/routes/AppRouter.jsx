import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida from './RutaProtegida'
import PanelLayout from '../layouts/PanelLayout'
import Login from '../pages/auth/Login'
import RecuperarPassword from '../pages/auth/RecuperarPassword'
import RestablecerPassword from '../pages/auth/RestablecerPassword'
import PoliticaDatos from '../pages/auth/PoliticaDatos'
import Dashboard from '../pages/admin/Dashboard'
import Usuarios from '../pages/admin/usuarios/Usuarios'
import AreasCargos from '../pages/admin/estructura/AreasCargos'
import Programas from '../pages/admin/programas/Programas'
import EditorPrograma from '../pages/admin/programas/EditorPrograma'
import MisInducciones from '../pages/colaborador/MisInducciones'
import EnConstruccion from '../components/EnConstruccion'
import { ROLES } from '../utils/roles'

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecuperarPassword />} />
      <Route path="/restablecer" element={<RestablecerPassword />} />

      {/* Primer ingreso: aceptación de la política de datos */}
      <Route element={<RutaProtegida exigirPolitica={false} />}>
        <Route path="/politica-datos" element={<PoliticaDatos />} />
      </Route>

      {/* Administrador */}
      <Route element={<RutaProtegida roles={[ROLES.ADMIN]} />}>
        <Route element={<PanelLayout />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/usuarios" element={<Usuarios />} />
          <Route path="/admin/areas" element={<AreasCargos />} />
          <Route path="/admin/programas" element={<Programas />} />
          <Route path="/admin/programas/:id" element={<EditorPrograma />} />
          <Route path="/admin/asignaciones" element={<EnConstruccion titulo="Asignaciones" historia="HU-08" sprint="Sprint 4" />} />
          <Route path="/admin/reportes" element={<EnConstruccion titulo="Reportes" historia="HU-14" sprint="Sprint 6" />} />
        </Route>
      </Route>

      {/* Jefe de área */}
      <Route element={<RutaProtegida roles={[ROLES.JEFE]} />}>
        <Route element={<PanelLayout />}>
          <Route path="/jefe" element={<EnConstruccion titulo="Progreso de mi equipo" historia="HU-13" sprint="Sprint 6" />} />
          <Route path="/jefe/asignaciones" element={<EnConstruccion titulo="Asignar inducción" historia="HU-08" sprint="Sprint 4" />} />
        </Route>
      </Route>

      {/* Colaborador */}
      <Route element={<RutaProtegida roles={[ROLES.COLABORADOR]} />}>
        <Route element={<PanelLayout />}>
          <Route path="/mis-inducciones" element={<MisInducciones />} />
          <Route path="/certificados" element={<EnConstruccion titulo="Certificados" historia="HU-12" sprint="Sprint 5" />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
