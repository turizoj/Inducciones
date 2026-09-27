import { Search } from 'lucide-react'

export default function Buscador({ valor, onCambiar, placeholder = 'Buscar…' }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-secundario focus:ring-2 focus:ring-secundario/20"
      />
    </div>
  )
}
