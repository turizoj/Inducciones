import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ClipboardCheck, Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import Alerta from '../../../components/Alerta'
import Boton from '../../../components/Boton'
import BotonIcono from '../../../components/BotonIcono'
import DialogoConfirmar from '../../../components/DialogoConfirmar'
import ListaOrdenable from '../../../components/ListaOrdenable'
import Modal from '../../../components/Modal'
import useConfirmacion from '../../../hooks/useConfirmacion'
import { eliminarContenido, eliminarModulo, ordenarContenidos } from '../../../api/programas'
import { urlArchivo } from '../../../utils/archivos'
import { describirContenido } from '../../../utils/contenidos'
import FormularioContenido from './FormularioContenido'
import FormularioModulo from './FormularioModulo'

// Panel derecho del editor: datos del módulo y sus contenidos (wireframe 19.2.4)
export default function PanelModulo({ programa, modulo, mostrarAviso }) {
  const queryClient = useQueryClient()
  const [editandoModulo, setEditandoModulo] = useState(false)
  const [formulario, setFormulario] = useState(null)
  const [viendoTexto, setViendoTexto] = useState(null)
  const [error, setError] = useState('')
  const { pedir, dialogo } = useConfirmacion()
  const clave = ['programa', programa.id]

  const ordenar = useMutation({
    mutationFn: ordenarContenidos,
    onMutate: async ({ nuevos }) => {
      setError('')
      await queryClient.cancelQueries({ queryKey: clave })
      queryClient.setQueryData(clave, (p) => ({
        ...p,
        modulos: p.modulos.map((m) => (m.id === modulo.id ? { ...m, contenidos: nuevos } : m)),
      }))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave }),
    onError: () => {
      setError('No se pudo guardar el nuevo orden. Intente de nuevo.')
      queryClient.invalidateQueries({ queryKey: clave })
    },
  })

  function borrarModulo() {
    pedir({
      titulo: 'Eliminar módulo',
      mensaje: `¿Desea eliminar el módulo "${modulo.titulo}"${modulo.contenidos.length ? ` y sus ${modulo.contenidos.length} contenido(s)` : ''}? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      ejecutar: async () => {
        await eliminarModulo(modulo.id)
        await queryClient.invalidateQueries()
        mostrarAviso(`Módulo "${modulo.titulo}" eliminado.`)
      },
    })
  }

  function borrarContenido(c) {
    pedir({
      titulo: 'Eliminar contenido',
      mensaje: `¿Desea eliminar "${c.titulo}"? ${c.url?.startsWith('/uploads/') ? 'También se borrará el archivo. ' : ''}Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      ejecutar: async () => {
        await eliminarContenido(c.id)
        await queryClient.invalidateQueries()
        mostrarAviso(`Contenido "${c.titulo}" eliminado.`)
      },
    })
  }

  return (
    <section className="min-w-0 space-y-4" aria-labelledby="titulo-modulo">
      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
              Módulo {programa.modulos.findIndex((m) => m.id === modulo.id) + 1}
            </p>
            <h2 id="titulo-modulo" className="text-lg font-semibold text-slate-900">
              {modulo.titulo}
            </h2>
            {modulo.descripcion && <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{modulo.descripcion}</p>}
          </div>
          <div className="flex shrink-0 gap-1">
            <BotonIcono icono={Pencil} texto="Editar módulo" onClick={() => setEditandoModulo(true)} />
            <BotonIcono icono={Trash2} texto="Eliminar módulo" peligro onClick={borrarModulo} />
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-slate-900">Contenidos</h3>
          <Boton onClick={() => setFormulario({})}>
            <Plus className="size-4" aria-hidden="true" /> Agregar contenido
          </Boton>
        </div>

        {error && (
          <div className="mb-3">
            <Alerta>{error}</Alerta>
          </div>
        )}

        {modulo.contenidos.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
            Este módulo aún no tiene contenidos. Agregue videos, documentos PDF, textos o enlaces.
          </p>
        ) : (
          <ListaOrdenable
            elementos={modulo.contenidos}
            nombre="contenido"
            onOrdenar={(nuevos) => ordenar.mutate({ moduloId: modulo.id, ids: nuevos.map((c) => c.id), nuevos })}
          >
            {(c, asa, indice) => {
              const { icono: Icono, detalle, color } = describirContenido(c)
              return (
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-2">
                  {asa}
                  <span className="w-5 shrink-0 text-center text-xs font-medium text-slate-400">{indice + 1}</span>
                  <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${color}`}>
                    <Icono className="size-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 break-words text-sm font-medium text-slate-800 sm:truncate">{c.titulo}</p>
                    <p className="truncate text-xs text-slate-500">{detalle}</p>
                  </div>
                  <div className="flex shrink-0">
                    {c.tipo === 'texto' ? (
                      <BotonIcono icono={Eye} texto="Ver" onClick={() => setViendoTexto(c)} />
                    ) : (
                      <a
                        href={urlArchivo(c.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Ver"
                        aria-label={`Ver ${c.titulo} (se abre en otra pestaña)`}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-primario"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                      </a>
                    )}
                    <BotonIcono icono={Pencil} texto="Editar" onClick={() => setFormulario(c)} />
                    <BotonIcono icono={Trash2} texto="Eliminar" peligro onClick={() => borrarContenido(c)} />
                  </div>
                </div>
              )
            }}
          </ListaOrdenable>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 sm:flex-row sm:items-center">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
          <ClipboardCheck className="size-5" aria-hidden="true" />
        </span>
        <div className="flex-1">
          <p className="font-semibold text-slate-700">Evaluación del módulo</p>
          <p className="text-sm text-slate-500">El constructor de evaluaciones (HU-07) se desarrolla en el Sprint 5.</p>
        </div>
        <Boton variante="secundario" disabled>
          Configurar evaluación
        </Boton>
      </div>

      {editandoModulo && (
        <FormularioModulo
          programaId={programa.id}
          modulo={modulo}
          onCerrar={() => setEditandoModulo(false)}
          onGuardado={() => {
            setEditandoModulo(false)
            mostrarAviso('Módulo actualizado.')
          }}
        />
      )}
      {formulario && (
        <FormularioContenido
          moduloId={modulo.id}
          contenido={formulario.id ? formulario : null}
          onCerrar={() => setFormulario(null)}
          onGuardado={(guardado) => {
            setFormulario(null)
            mostrarAviso(formulario.id ? `Contenido "${guardado.titulo}" actualizado.` : `Contenido "${guardado.titulo}" agregado.`)
          }}
        />
      )}
      {viendoTexto && (
        <Modal abierto titulo={viendoTexto.titulo} onCerrar={() => setViendoTexto(null)} ancho="max-w-2xl">
          {/* El HTML ya viene limpio desde el backend (sanitize-html) */}
          <div className="contenido-html text-sm text-slate-700" dangerouslySetInnerHTML={{ __html: viendoTexto.texto }} />
        </Modal>
      )}
      <DialogoConfirmar {...dialogo} />
    </section>
  )
}
