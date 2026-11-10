import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RutaProtegida from './RutaProtegida'
import PanelLayout from '../layouts/PanelLayout'
import PantallaCarga from '../components/PantallaCarga'
import Login from '../pages/auth/Login'
import { ROLES } from '../utils/roles'

// Cada pantalla se descarga solo cuando se abre: el inicio de sesión carga más rápido
// y cada rol descarga únicamente lo que usa
const RecuperarPassword = lazy(() => import('../pages/auth/RecuperarPassword'))
const RestablecerPassword = lazy(() => import('../pages/auth/RestablecerPassword'))
const PoliticaDatos = lazy(() => import('../pages/auth/PoliticaDatos'))
const Dashboard = lazy(() => import('../pages/admin/Dashboard'))
const Usuarios = lazy(() => import('../pages/admin/usuarios/Usuarios'))
const AreasCargos = lazy(() => import('../pages/admin/estructura/AreasCargos'))
const Programas = lazy(() => import('../pages/admin/programas/Programas'))
const EditorPrograma = lazy(() => import('../pages/admin/programas/EditorPrograma'))
const ConstructorEvaluacion = lazy(() => import('../pages/admin/programas/ConstructorEvaluacion'))
const MisInducciones = lazy(() => import('../pages/colaborador/MisInducciones'))
const VisorInduccion = lazy(() => import('../pages/colaborador/VisorInduccion'))
const Certificados = lazy(() => import('../pages/colaborador/Certificados'))
const VerificarCertificado = lazy(() => import('../pages/publico/VerificarCertificado'))
const Asignaciones = lazy(() => import('../pages/asignaciones/Asignaciones'))
const Reportes = lazy(() => import('../pages/admin/Reportes'))
const ProgresoEquipo = lazy(() => import('../pages/jefe/ProgresoEquipo'))

export default function AppRouter() {
  return (
    <Suspense fallback={<PantallaCarga />}>
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
    </Suspense>
  )
}
