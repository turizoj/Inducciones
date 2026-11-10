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

// Convierte un enlace de YouTube o Vimeo en la dirección de su reproductor para mostrarlo en la página.
// Devuelve null si no es de esas plataformas (por ejemplo, un MP4 propio).
export function urlEmbebida(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^(www\.|m\.)/, '')
    if (host === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`
    if (host === 'youtube.com') {
      const id = u.searchParams.get('v') || u.pathname.match(/^\/(embed|shorts|live)\/([^/?]+)/)?.[2]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }
    if (host === 'vimeo.com') {
      const id = u.pathname.match(/^\/(\d+)/)?.[1]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    if (host === 'player.vimeo.com') return url
  } catch {
    // No es una dirección válida
  }
  return null
}
