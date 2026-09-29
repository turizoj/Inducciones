import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, CalendarDays, Clock, LoaderCircle } from 'lucide-react'
import Alerta from '../../components/Alerta'
import BarraAvance from '../../components/BarraAvance'
import EtiquetaAsignacion from '../../components/EtiquetaAsignacion'
import MiniaturaPrograma from '../../components/MiniaturaPrograma'
import useAuth from '../../hooks/useAuth'
import { listarMisInducciones } from '../../api/asignaciones'
import { mensajeDeError } from '../../api/cliente'
import { formatearFecha, textoVencimiento } from '../../utils/fechas'

// HU-09: filtro por "En curso" y "Completadas"
const FILTROS = [
  { id: 'todas', texto: 'Todas', incluye: () => true },
  { id: 'en_curso', texto: 'En curso', incluye: (a) => a.estado !== 'completada' },
  { id: 'completadas', texto: 'Completadas', incluye: (a) => a.estado === 'completada' },
]

const textoBoton = { pendiente: 'Empezar', en_curso: 'Continuar', vencida: 'Continuar', completada: 'Repasar' }

// HU-09: inducciones asignadas con su avance y fecha límite (wireframe 19.2.5)
export default function MisInducciones() {
  const { usuario } = useAuth()
  const [filtro, setFiltro] = useState('todas')
  const { data: inducciones = [], isLoading, error } = useQuery({ queryKey: ['mis-inducciones'], queryFn: listarMisInducciones })
  const visibles = inducciones.filter(FILTROS.find((f) => f.id === filtro).incluye)
  const vencidas = inducciones.filter((a) => a.estado === 'vencida').length

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Hola, {usuario.nombres} 👋</h1>
      <p className="mt-1 text-sm text-slate-500">Estas son las inducciones que tienes asignadas.</p>

      {vencidas > 0 && (
        <div className="mt-4">
          <Alerta>
            Tienes {vencidas} inducción(es) vencida(s). Aún puedes terminarlas; hazlo lo antes posible.
          </Alerta>
        </div>
      )}

      <div className="mt-6 inline-flex rounded-lg bg-slate-100 p-1" role="group" aria-label="Filtrar inducciones">
        {FILTROS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            aria-pressed={filtro === f.id}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${filtro === f.id ? 'bg-white text-primario shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {f.texto}
            <span className="ml-1.5 text-xs text-slate-400">{inducciones.filter(f.incluye).length}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status">
          <LoaderCircle className="size-8 animate-spin text-primario" aria-hidden="true" />
          <span className="sr-only">Cargando…</span>
        </div>
      ) : error ? (
        <div className="mt-6">
          <Alerta>{mensajeDeError(error)}</Alerta>
        </div>
      ) : visibles.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <BookOpen className="size-10 text-slate-300" aria-hidden="true" />
          <p className="mt-4 font-semibold text-slate-700">
            {inducciones.length === 0 ? 'Aún no tienes inducciones asignadas' : 'No hay inducciones en este filtro'}
          </p>
          {inducciones.length === 0 && (
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              Cuando Talento Humano te asigne un programa, aparecerá aquí con su fecha límite y tu avance.
            </p>
          )}
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visibles.map((a) => (
            <li key={a.id}>
              <TarjetaInduccion induccion={a} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TarjetaInduccion({ induccion: a }) {
  const vencida = a.estado === 'vencida'
  const completada = a.estado === 'completada'
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ${vencida ? 'ring-2 ring-error/60' : 'ring-slate-200'}`}
    >
      <MiniaturaPrograma programa={a.programa} clases="h-32 w-full" />
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-slate-900">{a.programa.titulo}</h2>
          <EtiquetaAsignacion estado={a.estado} />
        </div>
        {a.programa.descripcion && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{a.programa.descripcion}</p>}
        <div className="mt-3 space-y-1 text-xs">
          <p className="flex items-center gap-1.5 text-slate-500">
            <Clock className="size-3.5" aria-hidden="true" /> {a.programa.duracionHoras} hora(s)
          </p>
          <p className={`flex items-center gap-1.5 ${vencida ? 'font-semibold text-error' : 'text-slate-500'}`}>
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Fecha límite: {formatearFecha(a.fechaLimite)}
            {!completada && ` · ${textoVencimiento(a.fechaLimite)}`}
          </p>
        </div>
        <div className="mt-4">
          <BarraAvance porcentaje={a.porcentajeAvance} completada={completada} etiqueta="Tu avance" />
        </div>
        <Link
          to={`/mis-inducciones/${a.id}`}
          className={`mt-4 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 ${completada ? 'border border-slate-300 text-slate-700 hover:bg-slate-50' : 'bg-primario text-white hover:bg-secundario'}`}
        >
          {textoBoton[a.estado]}
          <span className="sr-only"> {a.programa.titulo}</span>
        </Link>
      </div>
    </article>
  )
}
