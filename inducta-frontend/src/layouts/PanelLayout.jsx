import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Award,
  BarChart3,
  BookOpen,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Users,
  X,
} from 'lucide-react'
import Logo from '../components/Logo'
import Campana from '../components/Campana'
import useAuth from '../hooks/useAuth'
import { ROLES } from '../utils/roles'

// Opciones del menú lateral según el rol (sección 19.3, flujo de navegación)
const menuPorRol = {
  [ROLES.ADMIN]: [
    { a: '/admin', texto: 'Dashboard', icono: LayoutDashboard, exacto: true },
    { a: '/admin/usuarios', texto: 'Usuarios', icono: Users },
    { a: '/admin/areas', texto: 'Áreas y cargos', icono: Building2 },
    { a: '/admin/programas', texto: 'Programas', icono: BookOpen },
    { a: '/admin/asignaciones', texto: 'Asignaciones', icono: ClipboardList },
    { a: '/admin/reportes', texto: 'Reportes', icono: BarChart3 },
  ],
  [ROLES.JEFE]: [
    { a: '/jefe', texto: 'Progreso de mi equipo', icono: Users, exacto: true },
    { a: '/jefe/asignaciones', texto: 'Asignar inducción', icono: ClipboardList },
  ],
  [ROLES.COLABORADOR]: [
    { a: '/mis-inducciones', texto: 'Mis inducciones', icono: BookOpen },
    { a: '/certificados', texto: 'Certificados', icono: Award },
  ],
}

export default function PanelLayout() {
  const { usuario, cerrarSesion } = useAuth()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const opciones = menuPorRol[usuario.rol] || []
  const iniciales = `${usuario.nombres[0]}${usuario.apellidos[0]}`.toUpperCase()

  return (
    <div className="min-h-screen lg:pl-64">
      {/* Fondo oscuro detrás del menú en celular */}
      {menuAbierto && (
        <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setMenuAbierto(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-primario transition-transform lg:translate-x-0 ${menuAbierto ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <Logo claro />
          <button className="text-white/80 lg:hidden" onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {opciones.map(({ a, texto, icono: Icono, exacto }) => (
            <NavLink
              key={a}
              to={a}
              end={exacto}
              onClick={() => setMenuAbierto(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-white text-primario' : 'text-white/80 hover:bg-white/10 hover:text-white'}`
              }
            >
              <Icono className="size-4.5" aria-hidden="true" />
              {texto}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button
            onClick={cerrarSesion}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="size-4.5" aria-hidden="true" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
        <button className="text-slate-600 lg:hidden" onClick={() => setMenuAbierto(true)} aria-label="Abrir menú">
          <Menu className="size-6" />
        </button>
        <div className="ml-auto flex items-center gap-3">
          <Campana />
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-800">
              {usuario.nombres} {usuario.apellidos}
            </p>
            <p className="text-xs text-slate-500">{usuario.rol}</p>
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-secundario text-sm font-semibold text-white">
            {iniciales}
          </span>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  )
}
