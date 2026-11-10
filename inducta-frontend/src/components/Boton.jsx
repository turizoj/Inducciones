import { LoaderCircle } from 'lucide-react'

const variantes = {
  primario: 'bg-primario text-white hover:bg-secundario',
  secundario: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
  peligro: 'bg-error text-white hover:bg-error/90',
}

export default function Boton({ children, variante = 'primario', cargando = false, className = '', ...props }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secundario focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 ${variantes[variante]} ${className}`}
      disabled={cargando || props.disabled}
      {...props}
    >
      {cargando && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}
