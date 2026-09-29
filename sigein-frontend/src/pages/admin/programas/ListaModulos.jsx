import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import Alerta from '../../../components/Alerta'
import Boton from '../../../components/Boton'
import ListaOrdenable from '../../../components/ListaOrdenable'
import { ordenarModulos } from '../../../api/programas'
import FormularioModulo from './FormularioModulo'

// Panel izquierdo del editor: módulos del programa, ordenables arrastrando (HU-06)
export default function ListaModulos({ programa, seleccionado, onSeleccionar, mostrarAviso }) {
  const queryClient = useQueryClient()
  const [creando, setCreando] = useState(false)
  const [error, setError] = useState('')
  const clave = ['programa', programa.id]

  // El nuevo orden se muestra de inmediato y luego se guarda; si falla, se recarga el orden real
  const ordenar = useMutation({
    mutationFn: ordenarModulos,
    onMutate: async ({ nuevos }) => {
      setError('')
      await queryClient.cancelQueries({ queryKey: clave })
      queryClient.setQueryData(clave, (p) => ({ ...p, modulos: nuevos }))
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clave }),
    onError: () => {
      setError('No se pudo guardar el nuevo orden. Intente de nuevo.')
      queryClient.invalidateQueries({ queryKey: clave })
    },
  })

  return (
    <section className="self-start rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-labelledby="titulo-modulos">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="titulo-modulos" className="font-semibold text-slate-900">
          Módulos
        </h2>
        <span className="text-xs text-slate-400">Arrastre para ordenar</span>
      </div>

      {error && (
        <div className="mb-3">
          <Alerta>{error}</Alerta>
        </div>
      )}

      {programa.modulos.length > 0 && (
        <ListaOrdenable
          elementos={programa.modulos}
          nombre="módulo"
          onOrdenar={(nuevos) => ordenar.mutate({ programaId: programa.id, ids: nuevos.map((m) => m.id), nuevos })}
        >
          {(m, asa, indice) => {
            const activo = m.id === seleccionado
            return (
              <div
                className={`flex items-center gap-1 rounded-xl border p-1.5 transition-colors ${activo ? 'border-secundario bg-secundario/5' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
              >
                {asa}
                <button onClick={() => onSeleccionar(m.id)} aria-current={activo ? 'true' : undefined} className="min-w-0 flex-1 py-1 pr-2 text-left">
                  <span className="block text-xs font-medium text-slate-400">Módulo {indice + 1}</span>
                  <span className={`block truncate text-sm font-medium ${activo ? 'text-primario' : 'text-slate-800'}`}>{m.titulo}</span>
                  <span className="block text-xs text-slate-500">
                    {m.contenidos.length === 0 ? (
                      <span className="text-alerta">Sin contenidos</span>
                    ) : (
                      `${m.contenidos.length} contenido(s)`
                    )}
                  </span>
                </button>
              </div>
            )
          }}
        </ListaOrdenable>
      )}

      <Boton variante="secundario" className="mt-3 w-full" onClick={() => setCreando(true)}>
        <Plus className="size-4" aria-hidden="true" /> Agregar módulo
      </Boton>

      {creando && (
        <FormularioModulo
          programaId={programa.id}
          onCerrar={() => setCreando(false)}
          onGuardado={(nuevo) => {
            setCreando(false)
            onSeleccionar(nuevo.id)
            mostrarAviso(`Módulo "${nuevo.titulo}" agregado. Ahora cargue sus contenidos.`)
          }}
        />
      )}
    </section>
  )
}
