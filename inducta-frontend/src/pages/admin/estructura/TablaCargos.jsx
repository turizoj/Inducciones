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
import { cambiarEstadoCargo, eliminarCargo, listarAreas, listarCargos } from '../../../api/admin'
import FormularioCargo from './FormularioCargo'

const encabezados = [
  { texto: 'Cargo' },
  { texto: 'Área', clases: 'hidden sm:table-cell' },
  { texto: 'Usuarios', clases: 'text-center' },
  { texto: 'Estado', clases: 'hidden sm:table-cell' },
  { texto: 'Acciones', clases: 'text-right' },
]

export default function TablaCargos({ mostrarAviso }) {
  const queryClient = useQueryClient()
  const [buscar, setBuscar] = useState('')
  const [areaId, setAreaId] = useState('')
  const [estado, setEstado] = useState('')
  const filtros = { buscar: useRetraso(buscar), areaId, estado }
  const { data: cargos = [], isLoading, error } = useQuery({
    queryKey: ['cargos', filtros],
    queryFn: () => listarCargos(filtros),
    placeholderData: keepPreviousData,
  })
  const { data: areas = [] } = useQuery({ queryKey: ['areas', {}], queryFn: () => listarAreas({}) })
  const [formulario, setFormulario] = useState(null)
  const { pedir, dialogo } = useConfirmacion()

  function cambiarEstado(cargo) {
    const nuevo = cargo.estado === 'activo' ? 'inactivo' : 'activo'
    pedir({
      titulo: nuevo === 'activo' ? 'Activar cargo' : 'Inactivar cargo',
      mensaje:
        nuevo === 'activo'
          ? `¿Desea activar el cargo "${cargo.nombre}"?`
          : `¿Desea inactivar el cargo "${cargo.nombre}"? No se podrá asignar a usuarios nuevos.`,
      textoConfirmar: nuevo === 'activo' ? 'Activar' : 'Inactivar',
      peligro: nuevo === 'inactivo',
      ejecutar: async () => {
        await cambiarEstadoCargo({ id: cargo.id, estado: nuevo })
        await queryClient.invalidateQueries()
        mostrarAviso(`Cargo "${cargo.nombre}" ${nuevo === 'activo' ? 'activado' : 'inactivado'}.`)
      },
    })
  }

  function eliminar(cargo) {
    pedir({
      titulo: 'Eliminar cargo',
      mensaje: `¿Desea eliminar el cargo "${cargo.nombre}" del área "${cargo.area.nombre}"? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      ejecutar: async () => {
        await eliminarCargo(cargo.id)
        await queryClient.invalidateQueries()
        mostrarAviso(`Cargo "${cargo.nombre}" eliminado.`)
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <Buscador valor={buscar} onCambiar={setBuscar} placeholder="Buscar cargo…" />
        </div>
        <div className="grid grid-cols-2 gap-3 lg:flex">
          <div className="lg:w-48">
            <CampoSelect aria-label="Filtrar por área" value={areaId} onChange={(e) => setAreaId(e.target.value)}>
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </CampoSelect>
          </div>
          <div className="lg:w-44">
            <CampoSelect aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </CampoSelect>
          </div>
        </div>
        <Boton onClick={() => setFormulario({})}>
          <Plus className="size-4" aria-hidden="true" /> Nuevo cargo
        </Boton>
      </div>

      <Tabla encabezados={encabezados} cargando={isLoading} error={error} vacio={cargos.length === 0} mensajeVacio="No se encontraron cargos.">
        {cargos.map((cargo) => (
          <tr key={cargo.id} className="hover:bg-slate-50/60">
            <td className="px-4 py-3">
              <p className="font-medium text-slate-900">{cargo.nombre}</p>
              <p className="text-xs text-slate-500 sm:hidden">{cargo.area.nombre}</p>
              <div className="mt-1 sm:hidden">
                <EtiquetaEstado estado={cargo.estado} />
              </div>
            </td>
            <td className="hidden px-4 py-3 text-slate-600 sm:table-cell">
              {cargo.area.nombre}
              {cargo.area.estado === 'inactivo' && <span className="ml-1 text-xs text-slate-400">(área inactiva)</span>}
            </td>
            <td className="px-4 py-3 text-center text-slate-600">{cargo.totalUsuarios}</td>
            <td className="hidden px-4 py-3 sm:table-cell">
              <EtiquetaEstado estado={cargo.estado} />
            </td>
            <td className="px-4 py-3">
              <div className="flex justify-end gap-1">
                <BotonIcono icono={Pencil} texto="Editar" onClick={() => setFormulario(cargo)} />
                <BotonIcono icono={Power} texto={cargo.estado === 'activo' ? 'Inactivar' : 'Activar'} onClick={() => cambiarEstado(cargo)} />
                <BotonIcono
                  icono={Trash2}
                  texto={cargo.totalUsuarios > 0 ? 'Tiene usuarios: solo se puede inactivar' : 'Eliminar'}
                  peligro
                  disabled={cargo.totalUsuarios > 0}
                  onClick={() => eliminar(cargo)}
                />
              </div>
            </td>
          </tr>
        ))}
      </Tabla>

      {formulario && (
        <FormularioCargo
          cargo={formulario.id ? formulario : null}
          areas={areas}
          areaInicial={areaId}
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
