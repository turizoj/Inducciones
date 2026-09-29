import { useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, Plus, Trash2 } from 'lucide-react'
import Alerta from '../../components/Alerta'
import BarraAvance from '../../components/BarraAvance'
import Boton from '../../components/Boton'
import BotonIcono from '../../components/BotonIcono'
import Buscador from '../../components/Buscador'
import CampoSelect from '../../components/CampoSelect'
import DialogoConfirmar from '../../components/DialogoConfirmar'
import EtiquetaAsignacion from '../../components/EtiquetaAsignacion'
import Paginacion from '../../components/Paginacion'
import Tabla from '../../components/Tabla'
import useAuth from '../../hooks/useAuth'
import useAviso from '../../hooks/useAviso'
import useConfirmacion from '../../hooks/useConfirmacion'
import useRetraso from '../../hooks/useRetraso'
import { eliminarAsignacion, listarAsignaciones, opcionesAsignacion } from '../../api/asignaciones'
import { formatearFecha, textoVencimiento } from '../../utils/fechas'
import { ROLES } from '../../utils/roles'
import CambiarFecha from './CambiarFecha'
import FormularioAsignacion from './FormularioAsignacion'

const encabezados = [
  { texto: 'Colaborador' },
  { texto: 'Programa', clases: 'hidden md:table-cell' },
  { texto: 'Avance', clases: 'hidden sm:table-cell w-36' },
  { texto: 'Fecha límite', clases: 'hidden lg:table-cell' },
  { texto: 'Estado', clases: 'hidden sm:table-cell' },
  { texto: 'Acciones', clases: 'text-right' },
]

// HU-08: asignaciones de programas. El jefe de área solo ve a los colaboradores de su área.
export default function Asignaciones() {
  const { usuario } = useAuth()
  const esJefe = usuario.rol === ROLES.JEFE
  const queryClient = useQueryClient()
  const [aviso, mostrarAviso] = useAviso()
  const [filtrosForm, setFiltrosForm] = useState({ buscar: '', programaId: '', estado: '' })
  const [pagina, setPagina] = useState(1)
  const filtros = { ...filtrosForm, buscar: useRetraso(filtrosForm.buscar), pagina }

  const { data, isLoading, error } = useQuery({
    queryKey: ['asignaciones', filtros],
    queryFn: () => listarAsignaciones(filtros),
    placeholderData: keepPreviousData,
  })
  const { data: opciones } = useQuery({ queryKey: ['opciones-asignacion'], queryFn: opcionesAsignacion })
  const [creando, setCreando] = useState(false)
  const [cambiandoFecha, setCambiandoFecha] = useState(null)
  const { pedir, dialogo } = useConfirmacion()

  function filtrar(campo, valor) {
    setFiltrosForm((f) => ({ ...f, [campo]: valor }))
    setPagina(1)
  }

  function quitar(a) {
    pedir({
      titulo: 'Quitar asignación',
      mensaje: `¿Desea quitar "${a.programa.titulo}" a ${a.usuario.nombre}? Úselo solo si se asignó por error.`,
      textoConfirmar: 'Quitar',
      peligro: true,
      ejecutar: async () => {
        await eliminarAsignacion(a.id)
        await queryClient.invalidateQueries()
        mostrarAviso(`Se quitó la asignación a ${a.usuario.nombre}.`)
      },
    })
  }

  const asignaciones = data?.datos ?? []

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{esJefe ? 'Asignar inducción' : 'Asignaciones'}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {esJefe
              ? 'Asigne programas a los colaboradores de su área y siga su avance.'
              : 'Asigne programas a colaboradores, áreas o cargos, con fecha límite.'}
          </p>
        </div>
        <Boton onClick={() => setCreando(true)}>
          <Plus className="size-4" aria-hidden="true" /> Nueva asignación
        </Boton>
      </div>

      {aviso && (
        <div className="mt-4">
          <Alerta tipo="exito">{aviso}</Alerta>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <Buscador valor={filtrosForm.buscar} onCambiar={(v) => filtrar('buscar', v)} placeholder="Buscar colaborador por nombre o documento…" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex">
          <div className="lg:w-56">
            <CampoSelect aria-label="Filtrar por programa" value={filtrosForm.programaId} onChange={(e) => filtrar('programaId', e.target.value)}>
              <option value="">Todos los programas</option>
              {(opciones?.programas ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titulo}
                </option>
              ))}
            </CampoSelect>
          </div>
          <div className="lg:w-44">
            <CampoSelect aria-label="Filtrar por estado" value={filtrosForm.estado} onChange={(e) => filtrar('estado', e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendientes</option>
              <option value="en_curso">En curso</option>
              <option value="completada">Completadas</option>
              <option value="vencida">Vencidas</option>
            </CampoSelect>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Tabla
          encabezados={encabezados}
          cargando={isLoading}
          error={error}
          vacio={asignaciones.length === 0}
          mensajeVacio={
            filtrosForm.buscar || filtrosForm.programaId || filtrosForm.estado
              ? 'No hay asignaciones con esos filtros.'
              : 'Aún no hay asignaciones. Cree la primera con "Nueva asignación".'
          }
        >
          {asignaciones.map((a) => {
            const vencida = a.estado === 'vencida'
            return (
              <tr key={a.id} className={vencida ? 'bg-error/[0.03]' : 'hover:bg-slate-50/60'}>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{a.usuario.nombre}</p>
                  <p className="text-xs text-slate-500">{a.usuario.cargo ? `${a.usuario.cargo} · ${a.usuario.area}` : a.usuario.documento}</p>
                  <p className="mt-0.5 text-xs text-slate-600 md:hidden">{a.programa.titulo}</p>
                  <div className="mt-1.5 space-y-1.5 sm:hidden">
                    <EtiquetaAsignacion estado={a.estado} />
                    <BarraAvance porcentaje={a.porcentajeAvance} completada={a.estado === 'completada'} etiqueta={`Avance de ${a.usuario.nombre}`} compacta />
                  </div>
                  <p className={`mt-0.5 text-xs lg:hidden ${vencida ? 'font-medium text-error' : 'text-slate-500'}`}>
                    Límite: {formatearFecha(a.fechaLimite)}
                  </p>
                </td>
                <td className="hidden px-4 py-3 text-slate-700 md:table-cell">{a.programa.titulo}</td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <BarraAvance porcentaje={a.porcentajeAvance} completada={a.estado === 'completada'} etiqueta={`Avance de ${a.usuario.nombre}`} compacta />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <p className="text-slate-700">{formatearFecha(a.fechaLimite)}</p>
                  {a.estado !== 'completada' && (
                    <p className={`text-xs ${vencida ? 'font-medium text-error' : 'text-slate-500'}`}>{textoVencimiento(a.fechaLimite)}</p>
                  )}
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <EtiquetaAsignacion estado={a.estado} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <BotonIcono
                      icono={CalendarClock}
                      texto={a.estado === 'completada' ? 'Ya fue completada' : 'Cambiar fecha límite'}
                      disabled={a.estado === 'completada'}
                      onClick={() => setCambiandoFecha(a)}
                    />
                    <BotonIcono
                      icono={Trash2}
                      texto={a.porcentajeAvance > 0 ? 'Ya tiene avance: no se puede quitar' : 'Quitar asignación'}
                      peligro
                      disabled={a.porcentajeAvance > 0}
                      onClick={() => quitar(a)}
                    />
                  </div>
                </td>
              </tr>
            )
          })}
        </Tabla>
        {data && data.total > 0 && (
          <Paginacion pagina={data.pagina} totalPaginas={data.totalPaginas} total={data.total} onCambiar={setPagina} />
        )}
      </div>

      {creando && <FormularioAsignacion onCerrar={() => setCreando(false)} />}
      {cambiandoFecha && (
        <CambiarFecha
          asignacion={cambiandoFecha}
          onCerrar={() => setCambiandoFecha(null)}
          onGuardado={() => {
            setCambiandoFecha(null)
            mostrarAviso(`Fecha límite de ${cambiandoFecha.usuario.nombre} actualizada.`)
          }}
        />
      )}
      <DialogoConfirmar {...dialogo} />
    </div>
  )
}
