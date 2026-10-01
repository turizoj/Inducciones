import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import ReporteCumplimiento from '../reportes/ReporteCumplimiento'

// HU-13: el jefe de área consulta el avance de las inducciones de su equipo
export default function ProgresoEquipo() {
  const { usuario } = useAuth()
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Progreso de mi equipo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hola, {usuario.nombres}. Aquí ve el avance de los colaboradores de su área para apoyar a quien vaya retrasado.
          </p>
        </div>
        <Link
          to="/jefe/asignaciones"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-secundario focus:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2"
        >
          <ClipboardList className="size-4" aria-hidden="true" /> Asignar inducción
        </Link>
      </div>
      <div className="mt-6">
        <ReporteCumplimiento esJefe />
      </div>
    </div>
  )
}
