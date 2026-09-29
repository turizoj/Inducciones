// Etiqueta de color para el estado de una inducción asignada (HU-09)
const estilos = {
  pendiente: { texto: 'Pendiente', clases: 'bg-secundario/10 text-secundario', punto: 'bg-secundario' },
  en_curso: { texto: 'En curso', clases: 'bg-alerta/10 text-alerta', punto: 'bg-alerta' },
  completada: { texto: 'Completada', clases: 'bg-exito/10 text-exito', punto: 'bg-exito' },
  vencida: { texto: 'Vencida', clases: 'bg-error/10 text-error', punto: 'bg-error' },
}

export default function EtiquetaAsignacion({ estado }) {
  const { texto, clases, punto } = estilos[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${clases}`}>
      <span className={`size-1.5 rounded-full ${punto}`} aria-hidden="true" />
      {texto}
    </span>
  )
}
