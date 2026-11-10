import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Paginacion({ pagina, totalPaginas, total, onCambiar }) {
  const boton =
    'inline-flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'
  return (
    <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
      <span>
        {total} registro{total === 1 ? '' : 's'}
      </span>
      <div className="flex items-center gap-2">
        <button className={boton} onClick={() => onCambiar(pagina - 1)} disabled={pagina <= 1} aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </button>
        <span>
          Página {pagina} de {totalPaginas}
        </span>
        <button className={boton} onClick={() => onCambiar(pagina + 1)} disabled={pagina >= totalPaginas} aria-label="Página siguiente">
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  )
}
