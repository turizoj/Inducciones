// Botón pequeño con ícono para las acciones de cada fila de una tabla
export default function BotonIcono({ icono: Icono, texto, peligro = false, ...props }) {
  return (
    <button
      title={texto}
      aria-label={texto}
      className={`inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${peligro ? 'text-error hover:bg-error/10' : 'text-slate-500 hover:bg-slate-100 hover:text-primario'}`}
      {...props}
    >
      <Icono className="size-4" aria-hidden="true" />
    </button>
  )
}
