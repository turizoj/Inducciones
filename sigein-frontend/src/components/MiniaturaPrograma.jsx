import { BookOpen } from 'lucide-react'
import { urlArchivo } from '../utils/archivos'

// Miniatura del programa: su imagen o un ícono si no tiene
export default function MiniaturaPrograma({ programa, clases = 'size-12' }) {
  return programa.imagenUrl ? (
    <img src={urlArchivo(programa.imagenUrl)} alt="" className={`${clases} shrink-0 rounded-lg object-cover`} />
  ) : (
    <span className={`${clases} grid shrink-0 place-items-center rounded-lg bg-primario/10 text-primario`}>
      <BookOpen className="size-1/3 min-h-5 min-w-5" aria-hidden="true" />
    </span>
  )
}
