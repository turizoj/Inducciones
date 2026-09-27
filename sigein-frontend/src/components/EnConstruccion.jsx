import { Hammer } from 'lucide-react'

// Pantalla temporal para los módulos de los próximos sprints
export default function EnConstruccion({ titulo, historia, sprint }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">{titulo}</h1>
      <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <Hammer className="size-10 text-slate-300" aria-hidden="true" />
        <p className="mt-4 font-semibold text-slate-700">Módulo en construcción</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          Esta pantalla corresponde a la historia {historia} y se desarrolla en el {sprint}.
        </p>
      </div>
    </div>
  )
}
