import { BookOpen } from 'lucide-react'
import useAuth from '../../hooks/useAuth'

// HU-09: las tarjetas con el avance se conectan a la API en el Sprint 4
export default function MisInducciones() {
  const { usuario } = useAuth()
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Hola, {usuario.nombres} 👋</h1>
      <p className="mt-1 text-sm text-slate-500">Estas son las inducciones que tienes asignadas.</p>

      <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <BookOpen className="size-10 text-slate-300" aria-hidden="true" />
        <p className="mt-4 font-semibold text-slate-700">Aún no tienes inducciones asignadas</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Cuando Talento Humano te asigne un programa, aparecerá aquí con su fecha límite y tu avance.
        </p>
      </div>
    </div>
  )
}
