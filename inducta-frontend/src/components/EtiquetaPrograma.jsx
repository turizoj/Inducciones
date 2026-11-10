// Etiqueta de color para el estado de un programa (HU-05)
const estilos = {
  borrador: { texto: 'Borrador', clases: 'bg-alerta/10 text-alerta', punto: 'bg-alerta' },
  publicado: { texto: 'Publicado', clases: 'bg-exito/10 text-exito', punto: 'bg-exito' },
  archivado: { texto: 'Archivado', clases: 'bg-slate-100 text-slate-500', punto: 'bg-slate-400' },
}

export default function EtiquetaPrograma({ estado }) {
  const { texto, clases, punto } = estilos[estado]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${clases}`}>
      <span className={`size-1.5 rounded-full ${punto}`} aria-hidden="true" />
      {texto}
    </span>
  )
}
