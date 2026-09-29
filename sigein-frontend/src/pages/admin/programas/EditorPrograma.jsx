import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, ArrowLeft, Clock, ImagePlus, LoaderCircle, Pencil, RotateCcw, Send, Undo2, X } from 'lucide-react'
import Alerta from '../../../components/Alerta'
import Boton from '../../../components/Boton'
import DialogoConfirmar from '../../../components/DialogoConfirmar'
import EtiquetaPrograma from '../../../components/EtiquetaPrograma'
import MiniaturaPrograma from '../../../components/MiniaturaPrograma'
import useAviso from '../../../hooks/useAviso'
import useConfirmacion from '../../../hooks/useConfirmacion'
import { cambiarEstadoPrograma, obtenerPrograma, quitarImagenPrograma, subirImagenPrograma } from '../../../api/programas'
import { mensajeDeError } from '../../../api/cliente'
import { LIMITES, MB } from '../../../utils/archivos'
import FormularioPrograma from './FormularioPrograma'
import ListaModulos from './ListaModulos'
import PanelModulo from './PanelModulo'

// Cambios de estado posibles desde cada estado (HU-05)
const acciones = {
  borrador: [{ estado: 'publicado', texto: 'Publicar', icono: Send }],
  publicado: [
    { estado: 'borrador', texto: 'Volver a borrador', icono: Undo2, variante: 'secundario' },
    { estado: 'archivado', texto: 'Archivar', icono: Archive, variante: 'secundario' },
  ],
  archivado: [{ estado: 'borrador', texto: 'Restaurar', icono: RotateCcw, variante: 'secundario' }],
}

const confirmaciones = {
  publicado: (t) => ({
    titulo: 'Publicar programa',
    mensaje: `¿Desea publicar "${t}"? Quedará disponible para asignarlo a los colaboradores.`,
  }),
  archivado: (t) => ({
    titulo: 'Archivar programa',
    mensaje: `¿Desea archivar "${t}"? Un programa archivado no se puede asignar. Los colaboradores que ya lo tienen conservan su historial.`,
    peligro: true,
  }),
  borrador: (t) => ({
    titulo: 'Pasar a borrador',
    mensaje: `¿Desea pasar "${t}" a borrador? No se podrá asignar hasta que lo publique de nuevo.`,
  }),
}

const mensajesEstado = {
  publicado: 'Programa publicado. Ya se puede asignar a los colaboradores.',
  archivado: 'Programa archivado.',
  borrador: 'El programa quedó en borrador.',
}

// HU-05 y HU-06: editor del programa y sus módulos (wireframe 19.2.4)
export default function EditorPrograma() {
  const id = Number(useParams().id)
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [aviso, mostrarAviso] = useAviso()
  const { data: programa, isLoading, error } = useQuery({ queryKey: ['programa', id], queryFn: () => obtenerPrograma(id) })
  const [seleccionado, setSeleccionado] = useState(null)
  const [editandoDatos, setEditandoDatos] = useState(false)
  const { pedir, dialogo } = useConfirmacion()

  // Mensaje que llega al crear el programa desde el listado
  useEffect(() => {
    if (location.state?.aviso) {
      mostrarAviso(location.state.aviso)
      navigate(location.pathname, { replace: true, state: null })
    }
  }, [location, navigate, mostrarAviso])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20" role="status">
        <LoaderCircle className="size-8 animate-spin text-primario" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    )
  }
  if (error) return <Alerta>{mensajeDeError(error)}</Alerta>

  // Si el módulo elegido ya no existe (se eliminó), se muestra el primero
  const modulo = programa.modulos.find((m) => m.id === seleccionado) ?? programa.modulos[0]

  function cambiarEstado({ estado, texto }) {
    pedir({
      ...confirmaciones[estado](programa.titulo),
      textoConfirmar: texto,
      ejecutar: async () => {
        await cambiarEstadoPrograma({ id, estado })
        await queryClient.invalidateQueries()
        mostrarAviso(mensajesEstado[estado])
      },
    })
  }

  return (
    <div>
      <Link to="/admin/programas" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primario">
        <ArrowLeft className="size-4" aria-hidden="true" /> Programas
      </Link>

      <div className="mt-3 flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 lg:flex-row lg:items-start">
        <ImagenPrograma programa={programa} mostrarAviso={mostrarAviso} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{programa.titulo}</h1>
            <EtiquetaPrograma estado={programa.estado} />
          </div>
          {programa.descripcion && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{programa.descripcion}</p>}
          <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" aria-hidden="true" /> {programa.duracionHoras} hora(s)
            </span>
            <span>{programa.obligatorio ? 'Obligatorio' : 'Opcional'}</span>
            <span>{programa.modulos.length} módulo(s)</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <Boton variante="secundario" onClick={() => setEditandoDatos(true)}>
            <Pencil className="size-4" aria-hidden="true" /> Editar datos
          </Boton>
          {acciones[programa.estado].map((a) => (
            <Boton key={a.estado} variante={a.variante} onClick={() => cambiarEstado(a)}>
              <a.icono className="size-4" aria-hidden="true" /> {a.texto}
            </Boton>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
        {programa.estado === 'publicado' && (
          <p className="rounded-lg bg-secundario/5 px-3 py-2.5 text-sm text-slate-600">
            Este programa está publicado: los cambios que haga los verán de inmediato los colaboradores que lo tengan asignado.
          </p>
        )}
        {programa.estado === 'archivado' && (
          <p className="rounded-lg bg-slate-100 px-3 py-2.5 text-sm text-slate-600">Este programa está archivado y no se puede asignar.</p>
        )}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <ListaModulos programa={programa} seleccionado={modulo?.id} onSeleccionar={setSeleccionado} mostrarAviso={mostrarAviso} />
        {modulo ? (
          <PanelModulo key={modulo.id} programa={programa} modulo={modulo} mostrarAviso={mostrarAviso} />
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <div>
              <p className="font-semibold text-slate-700">Este programa aún no tiene módulos</p>
              <p className="mt-1 text-sm text-slate-500">Agregue el primero con el botón "Agregar módulo".</p>
            </div>
          </div>
        )}
      </div>

      {editandoDatos && (
        <FormularioPrograma
          programa={programa}
          onCerrar={() => setEditandoDatos(false)}
          onGuardado={() => {
            setEditandoDatos(false)
            mostrarAviso('Datos del programa actualizados.')
          }}
        />
      )}
      <DialogoConfirmar {...dialogo} />
    </div>
  )
}

// Imagen de portada del programa (HU-05): JPG, PNG o WEBP de máximo 2 MB
function ImagenPrograma({ programa, mostrarAviso }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const mutacion = useMutation({
    mutationFn: (archivo) => (archivo ? subirImagenPrograma({ id: programa.id, archivo }) : quitarImagenPrograma(programa.id)),
    onSuccess: async (_, archivo) => {
      await queryClient.invalidateQueries()
      mostrarAviso(archivo ? 'Imagen actualizada.' : 'Imagen quitada.')
    },
    onError: (err) => setError(mensajeDeError(err)),
  })

  function elegir(e) {
    const archivo = e.target.files[0]
    e.target.value = ''
    setError('')
    if (!archivo) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(archivo.type)) return setError('La imagen debe ser JPG, PNG o WEBP.')
    if (archivo.size > LIMITES.imagen) return setError(`La imagen supera ${LIMITES.imagen / MB} MB.`)
    mutacion.mutate(archivo)
  }

  return (
    <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-start">
      <div className="relative">
        <MiniaturaPrograma programa={programa} clases="size-24 lg:h-28 lg:w-44" />
        {mutacion.isPending && (
          <span className="absolute inset-0 grid place-items-center rounded-lg bg-white/70">
            <LoaderCircle className="size-6 animate-spin text-primario" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1 text-sm lg:flex-row lg:gap-3">
        <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-secundario hover:underline">
          <ImagePlus className="size-4" aria-hidden="true" />
          {programa.imagenUrl ? 'Cambiar imagen' : 'Agregar imagen'}
          <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={elegir} />
        </label>
        {programa.imagenUrl && (
          <button onClick={() => mutacion.mutate(null)} className="inline-flex items-center gap-1 text-slate-500 hover:text-error">
            <X className="size-4" aria-hidden="true" /> Quitar
          </button>
        )}
        {error && <p className="text-xs text-error">{error}</p>}
      </div>
    </div>
  )
}
