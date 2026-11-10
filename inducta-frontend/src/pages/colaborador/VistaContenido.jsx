import { ExternalLink } from 'lucide-react'
import { urlArchivo } from '../../utils/archivos'
import { urlEmbebida } from '../../utils/contenidos'

const claseEnlace = 'inline-flex items-center gap-1.5 text-sm font-medium text-secundario hover:underline'

// CU-10 paso 4: muestra el video, PDF, texto o enlace. Si algo no carga, se ofrece abrirlo aparte (4a).
export default function VistaContenido({ contenido }) {
  const { tipo, titulo } = contenido
  const url = urlArchivo(contenido.url)

  if (tipo === 'texto') {
    // El HTML ya viene limpio desde el backend (sanitize-html)
    return <div className="contenido-html text-slate-700" dangerouslySetInnerHTML={{ __html: contenido.texto }} />
  }

  if (tipo === 'enlace') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">Este contenido es una página externa. Ábrala, revísela y vuelva aquí para marcarla como vista.</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primario px-4 py-2.5 text-sm font-semibold text-white hover:bg-secundario"
        >
          Abrir enlace <ExternalLink className="size-4" aria-hidden="true" />
          <span className="sr-only">(se abre en otra pestaña)</span>
        </a>
        <p className="mt-3 break-all text-xs text-slate-400">{contenido.url}</p>
      </div>
    )
  }

  if (tipo === 'pdf') {
    return (
      <div className="space-y-2">
        <iframe src={url} title={titulo} className="h-[70vh] w-full rounded-lg border border-slate-200 bg-slate-50" />
        <a href={url} target="_blank" rel="noopener noreferrer" className={claseEnlace}>
          ¿No se ve bien? Abrir el PDF en otra pestaña <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>
      </div>
    )
  }

  // Video: reproductor de YouTube / Vimeo o archivo MP4 propio
  const embebida = urlEmbebida(contenido.url)
  return (
    <div className="space-y-2">
      {embebida ? (
        <div className="aspect-video overflow-hidden rounded-lg bg-slate-900">
          <iframe
            src={embebida}
            title={titulo}
            className="size-full"
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <video src={url} controls className="w-full rounded-lg bg-slate-900" preload="metadata">
          Su navegador no puede reproducir este video.
        </video>
      )}
      <a href={contenido.url.startsWith('/uploads/') ? url : contenido.url} target="_blank" rel="noopener noreferrer" className={claseEnlace}>
        ¿No carga el video? Abrirlo en otra pestaña <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
    </div>
  )
}
