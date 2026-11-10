import { LoaderCircle } from 'lucide-react'
import { mensajeDeError } from '../api/cliente'

// Contenedor de tabla con los estados de carga, error y "sin resultados"
export default function Tabla({ encabezados, cargando, error, vacio, mensajeVacio = 'No hay registros.', children }) {
  let mensaje = null
  if (cargando) {
    mensaje = (
      <span className="inline-flex items-center gap-2">
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> Cargando…
      </span>
    )
  } else if (error) {
    mensaje = <span className="text-error">{mensajeDeError(error)}</span>
  } else if (vacio) {
    mensaje = mensajeVacio
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            {encabezados.map(({ texto, clases = '' }) => (
              <th key={texto} scope="col" className={`px-4 py-3 ${clases}`}>
                {texto}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {mensaje ? (
            <tr>
              <td colSpan={encabezados.length} className="px-4 py-10 text-center text-slate-500">
                {mensaje}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}
