import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlignLeft, FileText, Link2, PlayCircle, Upload } from 'lucide-react'
import Modal from '../../../components/Modal'
import CampoTexto from '../../../components/CampoTexto'
import EditorTexto from '../../../components/EditorTexto'
import Boton from '../../../components/Boton'
import Alerta from '../../../components/Alerta'
import { guardarContenido } from '../../../api/programas'
import { mensajeDeError } from '../../../api/cliente'
import { LIMITES, MB, urlArchivo } from '../../../utils/archivos'

const TIPOS = [
  { id: 'video', texto: 'Video', icono: PlayCircle },
  { id: 'pdf', texto: 'PDF', icono: FileText },
  { id: 'texto', texto: 'Texto', icono: AlignLeft },
  { id: 'enlace', texto: 'Enlace', icono: Link2 },
]

// Deben coincidir con las reglas del backend (HU-06)
const VIDEO_PERMITIDO = /^https:\/\/(www\.|m\.|player\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i

const esArchivoPropio = (url) => Boolean(url?.startsWith('/uploads/'))

// HU-06: agregar o editar un contenido (video, PDF, texto o enlace)
export default function FormularioContenido({ moduloId, contenido, onCerrar, onGuardado }) {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState(contenido?.tipo ?? 'video')
  const [titulo, setTitulo] = useState(contenido?.titulo ?? '')
  const [url, setUrl] = useState(contenido && !esArchivoPropio(contenido.url) ? (contenido.url ?? '') : '')
  const [texto, setTexto] = useState(contenido?.texto ?? '')
  const [archivo, setArchivo] = useState(null)
  const [modoVideo, setModoVideo] = useState(contenido?.tipo === 'video' && esArchivoPropio(contenido.url) ? 'archivo' : 'enlace')
  const [errores, setErrores] = useState({})
  const [progreso, setProgreso] = useState(null)

  // Archivo que ya tiene el contenido y que se conserva si no se elige otro
  const archivoActual = contenido?.tipo === tipo && esArchivoPropio(contenido.url) ? contenido.url : null
  const llevaArchivo = tipo === 'pdf' || (tipo === 'video' && modoVideo === 'archivo')

  const mutacion = useMutation({
    mutationFn: guardarContenido,
    onSuccess: async (guardado) => {
      await queryClient.invalidateQueries()
      onGuardado(guardado)
    },
    onSettled: () => setProgreso(null),
  })

  function elegirArchivo(e) {
    setArchivo(e.target.files[0] ?? null)
    setErrores((x) => ({ ...x, archivo: undefined }))
  }

  function validar() {
    const e = {}
    if (titulo.trim().length < 2) e.titulo = 'Escriba el título del contenido'
    if (tipo === 'video' && modoVideo === 'enlace' && !VIDEO_PERMITIDO.test(url.trim())) {
      e.url = 'Pegue el enlace completo de YouTube o Vimeo (https://…)'
    }
    if (tipo === 'enlace' && !/^https?:\/\/\S+$/i.test(url.trim())) e.url = 'Escriba un enlace que empiece por http:// o https://'
    if (tipo === 'texto' && !texto) e.texto = 'Escriba el texto del contenido'
    if (llevaArchivo) {
      const esperado = tipo === 'pdf' ? { mime: 'application/pdf', nombre: 'PDF', limite: LIMITES.pdf } : { mime: 'video/mp4', nombre: 'MP4', limite: LIMITES.video }
      if (!archivo && !archivoActual) e.archivo = `Seleccione el archivo ${esperado.nombre}`
      else if (archivo && archivo.type !== esperado.mime) e.archivo = `El archivo debe ser ${esperado.nombre}`
      else if (archivo && archivo.size > esperado.limite) e.archivo = `El archivo supera el máximo de ${esperado.limite / MB} MB`
    }
    setErrores(e)
    return Object.keys(e).length === 0
  }

  function enviar(evento) {
    evento.preventDefault()
    if (!validar()) return
    mutacion.mutate({
      id: contenido?.id,
      moduloId,
      datos: {
        titulo: titulo.trim(),
        tipo,
        url: tipo === 'enlace' || (tipo === 'video' && modoVideo === 'enlace') ? url.trim() : '',
        texto: tipo === 'texto' ? texto : '',
      },
      archivo: llevaArchivo ? archivo : null,
      onProgreso: setProgreso,
    })
  }

  return (
    <Modal abierto titulo={contenido ? 'Editar contenido' : 'Nuevo contenido'} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">Tipo de contenido</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {TIPOS.map(({ id, texto: nombre, icono: Icono }) => (
              <label
                key={id}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-2 py-3 text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-secundario ${tipo === id ? 'border-primario bg-primario/5 text-primario' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <input
                  type="radio"
                  name="tipo"
                  value={id}
                  checked={tipo === id}
                  onChange={() => {
                    setTipo(id)
                    setArchivo(null)
                    setErrores({})
                  }}
                  className="sr-only"
                />
                <Icono className="size-5" aria-hidden="true" />
                {nombre}
              </label>
            ))}
          </div>
        </fieldset>

        <CampoTexto etiqueta="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} error={errores.titulo} maxLength={150} />

        {tipo === 'video' && (
          <fieldset className="space-y-3">
            <legend className="mb-1.5 text-sm font-medium text-slate-700">¿Cómo se carga el video?</legend>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              {[
                { id: 'enlace', texto: 'Enlace de YouTube o Vimeo (recomendado)' },
                { id: 'archivo', texto: `Archivo MP4 (máx. ${LIMITES.video / MB} MB)` },
              ].map((o) => (
                <label key={o.id} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="radio"
                    name="modoVideo"
                    checked={modoVideo === o.id}
                    onChange={() => {
                      setModoVideo(o.id)
                      setErrores({})
                    }}
                    className="size-4 accent-primario"
                  />
                  {o.texto}
                </label>
              ))}
            </div>
            {modoVideo === 'enlace' ? (
              <CampoTexto
                etiqueta="Enlace del video"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                error={errores.url}
              />
            ) : (
              <SelectorArchivo tipo="video" archivo={archivo} actual={archivoActual} error={errores.archivo} onElegir={elegirArchivo} />
            )}
          </fieldset>
        )}

        {tipo === 'pdf' && <SelectorArchivo tipo="pdf" archivo={archivo} actual={archivoActual} error={errores.archivo} onElegir={elegirArchivo} />}

        {tipo === 'texto' && <EditorTexto etiqueta="Texto" valor={texto} onCambiar={setTexto} error={errores.texto} />}

        {tipo === 'enlace' && (
          <CampoTexto
            etiqueta="Dirección del enlace (URL)"
            type="url"
            placeholder="https://…"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={errores.url}
          />
        )}

        {progreso !== null && (
          <div role="progressbar" aria-valuenow={progreso} aria-valuemin={0} aria-valuemax={100} aria-label="Subiendo archivo">
            <div className="mb-1 flex justify-between text-xs text-slate-500">
              <span>{progreso < 100 ? 'Subiendo archivo…' : 'Guardando…'}</span>
              <span className="tabular-nums">{progreso}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-secundario transition-all" style={{ width: `${progreso}%` }} />
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar} disabled={mutacion.isPending}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            {contenido ? 'Guardar cambios' : 'Agregar contenido'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

function SelectorArchivo({ tipo, archivo, actual, error, onElegir }) {
  const pdf = tipo === 'pdf'
  const limite = (pdf ? LIMITES.pdf : LIMITES.video) / MB
  return (
    <div>
      <label
        className={`flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors hover:border-secundario hover:bg-secundario/5 has-focus-visible:ring-2 has-focus-visible:ring-secundario ${error ? 'border-error' : 'border-slate-300'}`}
      >
        <Upload className="size-7 text-slate-400" aria-hidden="true" />
        <span className="mt-2 text-sm font-medium text-slate-700">
          {archivo ? archivo.name : actual ? 'Clic para reemplazar el archivo' : `Clic para elegir el ${pdf ? 'PDF' : 'video MP4'}`}
        </span>
        <span className="text-xs text-slate-500">
          {archivo ? `${(archivo.size / MB).toFixed(1)} MB` : `Máximo ${limite} MB`}
        </span>
        <input type="file" accept={pdf ? 'application/pdf,.pdf' : 'video/mp4,.mp4'} className="sr-only" onChange={onElegir} />
      </label>
      {actual && !archivo && (
        <p className="mt-1.5 text-xs text-slate-500">
          Se conserva el archivo actual.{' '}
          <a href={urlArchivo(actual)} target="_blank" rel="noopener noreferrer" className="font-medium text-secundario hover:underline">
            Ver archivo actual
          </a>
        </p>
      )}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  )
}
