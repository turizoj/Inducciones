import { GraduationCap } from 'lucide-react'

export default function Logo({ claro = false }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`grid size-9 place-items-center rounded-lg ${claro ? 'bg-white/15' : 'bg-primario'}`}>
        <GraduationCap className="size-5 text-white" aria-hidden="true" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${claro ? 'text-white' : 'text-primario'}`}>SIGEIN</span>
    </div>
  )
}
