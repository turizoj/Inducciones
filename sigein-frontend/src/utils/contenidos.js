import { AlignLeft, FileText, Link2, PlayCircle } from 'lucide-react'

// Ícono y descripción corta de cada tipo de contenido (RF-10)
export function describirContenido(c) {
  if (c.tipo === 'texto') return { icono: AlignLeft, detalle: 'Texto', color: 'bg-slate-100 text-slate-600' }
  if (c.tipo === 'pdf') return { icono: FileText, detalle: 'Documento PDF', color: 'bg-error/10 text-error' }
  if (c.tipo === 'enlace') {
    let sitio = c.url
    try {
      sitio = new URL(c.url).hostname.replace(/^www\./, '')
    } catch {
      // Si el enlace no es una URL válida se muestra tal cual
    }
    return { icono: Link2, detalle: `Enlace · ${sitio}`, color: 'bg-secundario/10 text-secundario' }
  }
  const origen = /youtu/i.test(c.url) ? 'YouTube' : /vimeo/i.test(c.url) ? 'Vimeo' : 'archivo MP4'
  return { icono: PlayCircle, detalle: `Video · ${origen}`, color: 'bg-alerta/10 text-alerta' }
}
