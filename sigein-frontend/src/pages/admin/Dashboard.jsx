import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CircleAlert, CircleCheck, ClipboardCheck, Clock, UserPlus, Users } from 'lucide-react'
import Alerta from '../../components/Alerta'
import useAuth from '../../hooks/useAuth'
import { obtenerResumen } from '../../api/admin'
import { mensajeDeError } from '../../api/cliente'

// RF-23: indicadores del tablero
const indicadores = [
  { clave: 'colaboradoresActivos', texto: 'Colaboradores activos', icono: Users, color: 'text-secundario bg-secundario/10' },
  { clave: 'enCurso', texto: 'Inducciones en curso', icono: Clock, color: 'text-alerta bg-alerta/10' },
  { clave: 'completadas', texto: 'Inducciones completadas', icono: CircleCheck, color: 'text-exito bg-exito/10' },
  { clave: 'programasPublicados', texto: 'Programas publicados', icono: BookOpen, color: 'text-primario bg-primario/10' },
  // RF-23: porcentaje de intentos de evaluación aprobados
  { clave: 'tasaAprobacion', texto: 'Aprobación de evaluaciones', icono: ClipboardCheck, color: 'text-exito bg-exito/10', sufijo: ' %' },
]

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' })

export default function Dashboard() {
  const { usuario } = useAuth()
  const { data, isLoading, error } = useQuery({ queryKey: ['resumen'], queryFn: obtenerResumen })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Hola, {usuario.nombres}</h1>
      <p className="mt-1 text-sm text-slate-500">Resumen general de las inducciones de la empresa.</p>

      {error && (
        <div className="mt-6">
          <Alerta>{mensajeDeError(error)}</Alerta>
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {indicadores.map(({ clave, texto, icono: Icono, color, sufijo = '' }) => (
          <div key={clave} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <span className={`grid size-10 place-items-center rounded-lg ${color}`}>
              <Icono className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-3xl font-bold tabular-nums text-slate-900">
              {isLoading ? <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" /> : data?.indicadores[clave] == null ? '—' : `${data.indicadores[clave]}${sufijo}`}
            </p>
            <p className="text-sm text-slate-500">{texto}</p>
          </div>
        ))}
      </div>

      {data?.usuariosSinCargo > 0 && (
        <Link
          to="/admin/usuarios"
          className="mt-4 flex items-center gap-2 rounded-lg border border-alerta/30 bg-alerta/5 px-3 py-2.5 text-sm text-alerta hover:bg-alerta/10"
        >
          <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
          Hay {data.usuariosSinCargo} usuario(s) activo(s) sin cargo. No podrán recibir inducciones por área.
        </Link>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-5">
        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-3">
          <h2 className="font-semibold text-slate-900">Usuarios activos por área</h2>
          <UsuariosPorArea areas={data?.usuariosPorArea} cargando={isLoading} />
        </section>

        <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Últimos usuarios registrados</h2>
            <Link to="/admin/usuarios" className="text-sm font-medium text-secundario hover:underline">
              Ver todos
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {(data?.ultimosUsuarios ?? []).map((u) => (
              <li key={u.id} className="flex items-center gap-3 py-2.5">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secundario/10 text-secundario">
                  <UserPlus className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{u.nombre}</p>
                  <p className="truncate text-xs text-slate-500">
                    {u.rol}
                    {u.cargo && ` · ${u.cargo}`}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-slate-400">{formatoFecha.format(new Date(u.creado))}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

// Barras horizontales: una sola serie, así que un solo color y el valor escrito al lado
function UsuariosPorArea({ areas, cargando }) {
  if (cargando) return <div className="mt-4 h-32 animate-pulse rounded-lg bg-slate-50" />
  if (!areas?.length) {
    return (
      <p className="mt-4 text-sm text-slate-500">
        Aún no hay áreas activas.{' '}
        <Link to="/admin/areas" className="font-medium text-secundario hover:underline">
          Crear un área
        </Link>
      </p>
    )
  }

  const maximo = Math.max(1, ...areas.map((a) => a.total))
  return (
    <ul className="mt-4 space-y-3">
      {areas.map((a) => (
        <li key={a.id} title={`${a.nombre}: ${a.total} usuario(s) activo(s)`} className="group">
          <div className="mb-1 flex justify-between text-sm">
            <span className="truncate text-slate-600">{a.nombre}</span>
            <span className="font-medium tabular-nums text-slate-900">{a.total}</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-secundario transition-colors group-hover:bg-primario"
              style={{ width: `${(a.total / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
