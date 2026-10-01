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
import ConstructorEvaluacion from '../pages/admin/programas/ConstructorEvaluacion'
import MisInducciones from '../pages/colaborador/MisInducciones'
import VisorInduccion from '../pages/colaborador/VisorInduccion'
import Certificados from '../pages/colaborador/Certificados'
import VerificarCertificado from '../pages/publico/VerificarCertificado'
import Asignaciones from '../pages/asignaciones/Asignaciones'
import Reportes from '../pages/admin/Reportes'
import ProgresoEquipo from '../pages/jefe/ProgresoEquipo'
import { ROLES } from '../utils/roles'

export default function AppRouter() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<RecuperarPassword />} />
      <Route path="/restablecer" element={<RestablecerPassword />} />
      <Route path="/verificar" element={<VerificarCertificado />} />
      <Route path="/verificar/:codigo" element={<VerificarCertificado />} />

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
          <Route path="/admin/programas/:id/modulos/:moduloId/evaluacion" element={<ConstructorEvaluacion />} />
          <Route path="/admin/asignaciones" element={<Asignaciones />} />
          <Route path="/admin/reportes" element={<Reportes />} />
        </Route>
      </Route>

      {/* Jefe de área */}
      <Route element={<RutaProtegida roles={[ROLES.JEFE]} />}>
        <Route element={<PanelLayout />}>
          <Route path="/jefe" element={<ProgresoEquipo />} />
          <Route path="/jefe/asignaciones" element={<Asignaciones />} />
        </Route>
      </Route>

      {/* Colaborador */}
      <Route element={<RutaProtegida roles={[ROLES.COLABORADOR]} />}>
        <Route element={<PanelLayout />}>
          <Route path="/mis-inducciones" element={<MisInducciones />} />
          <Route path="/mis-inducciones/:id" element={<VisorInduccion />} />
          <Route path="/certificados" element={<Certificados />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
