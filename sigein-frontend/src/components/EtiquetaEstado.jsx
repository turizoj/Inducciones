// Etiqueta de color para el estado activo / inactivo
export default function EtiquetaEstado({ estado }) {
  const activo = estado === 'activo'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${activo ? 'bg-exito/10 text-exito' : 'bg-slate-100 text-slate-500'}`}
    >
      <span className={`size-1.5 rounded-full ${activo ? 'bg-exito' : 'bg-slate-400'}`} aria-hidden="true" />
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}
