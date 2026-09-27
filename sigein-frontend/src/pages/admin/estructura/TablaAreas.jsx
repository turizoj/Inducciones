import { useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Power, Trash2 } from 'lucide-react'
import Boton from '../../../components/Boton'
import BotonIcono from '../../../components/BotonIcono'
import Buscador from '../../../components/Buscador'
import CampoSelect from '../../../components/CampoSelect'
import DialogoConfirmar from '../../../components/DialogoConfirmar'
import EtiquetaEstado from '../../../components/EtiquetaEstado'
import Tabla from '../../../components/Tabla'
import useConfirmacion from '../../../hooks/useConfirmacion'
import useRetraso from '../../../hooks/useRetraso'
import { cambiarEstadoArea, eliminarArea, listarAreas } from '../../../api/admin'
import FormularioArea from './FormularioArea'

const encabezados = [
  { texto: 'Área' },
  { texto: 'Jefe', clases: 'hidden md:table-cell' },
  { texto: 'Cargos', clases: 'hidden sm:table-cell text-center' },
  { texto: 'Usuarios', clases: 'text-center' },
  { texto: 'Estado', clases: 'hidden sm:table-cell' },
  { texto: 'Acciones', clases: 'text-right' },
]

export default function TablaAreas({ mostrarAviso }) {
  const queryClient = useQueryClient()
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState('')
  const filtros = { buscar: useRetraso(buscar), estado }
  const { data: areas = [], isLoading, error } = useQuery({
    queryKey: ['areas', filtros],
    queryFn: () => listarAreas(filtros),
    placeholderData: keepPreviousData,
  })
  const [formulario, setFormulario] = useState(null)
  const { pedir, dialogo } = useConfirmacion()

  function cambiarEstado(area) {
    const nuevo = area.estado === 'activo' ? 'inactivo' : 'activo'
    pedir({
      titulo: nuevo === 'activo' ? 'Activar área' : 'Inactivar área',
      mensaje:
        nuevo === 'activo'
          ? `¿Desea activar el área "${area.nombre}"?`
          : `¿Desea inactivar el área "${area.nombre}"? Sus cargos no se podrán asignar a usuarios nuevos.`,
      textoConfirmar: nuevo === 'activo' ? 'Activar' : 'Inactivar',
      peligro: nuevo === 'inactivo',
      ejecutar: async () => {
        await cambiarEstadoArea({ id: area.id, estado: nuevo })
        await queryClient.invalidateQueries()
        mostrarAviso(`Área "${area.nombre}" ${nuevo === 'activo' ? 'activada' : 'inactivada'}.`)
      },
    })
  }

  function eliminar(area) {
    pedir({
      titulo: 'Eliminar área',
      mensaje: `¿Desea eliminar el área "${area.nombre}"${area.totalCargos ? ` y sus ${area.totalCargos} cargo(s)` : ''}? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      ejecutar: async () => {
        await eliminarArea(area.id)
        await queryClient.invalidateQueries()
        mostrarAviso(`Área "${area.nombre}" eliminada.`)
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Buscador valor={buscar} onCambiar={setBuscar} placeholder="Buscar área…" />
        </div>
        <div className="sm:w-44">
          <CampoSelect aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="activo">Activas</option>
            <option value="inactivo">Inactivas</option>
          </CampoSelect>
        </div>
        <Boton onClick={() => setFormulario({})}>
          <Plus className="size-4" aria-hidden="true" /> Nueva área
        </Boton>
      </div>

      <Tabla encabezados={encabezados} cargando={isLoading} error={error} vacio={areas.length === 0} mensajeVacio="No se encontraron áreas.">
        {areas.map((area) => (
          <tr key={area.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{area.nombre}</p>
              {area.descripcion && <p className="text-xs text-slate-500">{area.descripcion}</p>}
              <div className="mt-1 sm:hidden">
                <EtiquetaEstado estado={area.estado} />
              </div>
            </td>
            <td className="hidden px-4 py-3 text-slate-600 md:table-cell">
              {area.jefe ? `${area.jefe.nombres} ${area.jefe.apellidos}` : <span className="text-slate-400">Sin asignar</span>}
            </td>
            <td className="hidden px-4 py-3 text-center text-slate-600 sm:table-cell">{area.totalCargos}</td>
            <td className="px-4 py-3 text-center text-slate-600">{area.totalUsuarios}</td>
            <td className="hidden px-4 py-3 sm:table-cell">
              <EtiquetaEstado estado={area.estado} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <BotonIcono icono={Pencil} texto="Editar" onClick={() => setFormulario(area)} />
                <BotonIcono icono={Power} texto={area.estado === 'activo' ? 'Inactivar' : 'Activar'} onClick={() => cambiarEstado(area)} />
                <BotonIcono
                  icono={Trash2}
                  texto={area.totalUsuarios > 0 ? 'Tiene usuarios: solo se puede inactivar' : 'Eliminar'}
                  peligro
                  disabled={area.totalUsuarios > 0}
                  onClick={() => eliminar(area)}
                />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {formulario && (
        <FormularioArea
          area={formulario.id ? formulario : null}
          onCerrar={() => setFormulario(null)}
          onGuardado={(mensaje) => {
            setFormulario(null)
            mostrarAviso(mensaje)
          }}
        />
      )}
      <DialogoConfirmar {...dialogo} />
    </div>
  )
}
