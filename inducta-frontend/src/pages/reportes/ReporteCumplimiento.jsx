import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { FileSpreadsheet, FileText, FilterX } from 'lucide-react'
import Alerta from '../../components/Alerta'
import BarraAvance from '../../components/BarraAvance'
import Boton from '../../components/Boton'
import Buscador from '../../components/Buscador'
import CampoSelect from '../../components/CampoSelect'
import CampoTexto from '../../components/CampoTexto'
import EtiquetaAsignacion from '../../components/EtiquetaAsignacion'
import Paginacion from '../../components/Paginacion'
import Tabla from '../../components/Tabla'
import useRetraso from '../../hooks/useRetraso'
import { descargarReporte, obtenerCumplimiento } from '../../api/reportes'
import { listarAreas } from '../../api/admin'
import { listarProgramas } from '../../api/programas'
import { formatearFecha, textoVencimiento } from '../../utils/fechas'

const POR_PAGINA = 15
const VACIOS = { areaId: '', programaId: '', estado: '', desde: '', hasta: '', buscar: '' }

// Colores de estado iguales a los de las etiquetas; cada segmento va con su nombre y cantidad
const ESTADOS = [
  { id: 'completada', texto: 'Completadas', color: 'bg-exito' },
  { id: 'en_curso', texto: 'En curso', color: 'bg-alerta' },
  { id: 'pendiente', texto: 'Pendientes', color: 'bg-secundario' },
  { id: 'vencida', texto: 'Vencidas', color: 'bg-error' },
]

const encabezados = [
  { texto: 'Colaborador' },
  { texto: 'Programa', clases: 'hidden md:table-cell' },
  { texto: 'Avance', clases: 'hidden sm:table-cell w-32' },
  { texto: 'Nota', clases: 'hidden sm:table-cell text-center' },
  { texto: 'Fecha límite', clases: 'hidden lg:table-cell' },
  { texto: 'Estado' },
]

// HU-13 (jefe de área) y HU-14 (administrador): reporte de cumplimiento con filtros combinables
export default function ReporteCumplimiento({ esJefe = false }) {
  const [filtros, setFiltros] = useState(VACIOS)
  const [pagina, setPagina] = useState(1)
  const buscar = useRetraso(filtros.buscar)
  const consulta = { ...filtros, buscar }
  const fechasInvalidas = filtros.desde && filtros.hasta && filtros.desde > filtros.hasta

  const { data, isLoading, error } = useQuery({
    queryKey: ['cumplimiento', consulta],
    queryFn: () => obtenerCumplimiento(consulta),
    placeholderData: keepPreviousData,
    enabled: !fechasInvalidas,
  })
  const { data: areas = [] } = useQuery({ queryKey: ['areas', {}], queryFn: () => listarAreas({}), enabled: !esJefe })
  const { data: programas = [] } = useQuery({ queryKey: ['programas', {}], queryFn: () => listarProgramas({}), enabled: !esJefe })
  const exportar = useMutation({ mutationFn: descargarReporte })

  function filtrar(campo, valor) {
    setFiltros((f) => ({ ...f, [campo]: valor }))
    setPagina(1)
  }

  const hayFiltros = Object.values(filtros).some(Boolean)
  const filas = data?.filas ?? []
  const totalPaginas = Math.max(1, Math.ceil(filas.length / POR_PAGINA))
  const visibles = filas.slice((pagina - 1) * POR_PAGINA, pagina * POR_PAGINA)
  const r = data?.resumen

  return (
    <div className="space-y-5">
      {/* Filtros: todos se pueden combinar (HU-14 criterio 1) */}
      <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-label="Filtros del reporte">
        <div className={`grid gap-3 sm:grid-cols-2 ${esJefe ? 'lg:grid-cols-[minmax(0,1fr)_12rem]' : 'lg:grid-cols-5'}`}>
          {esJefe ? (
            <Buscador valor={filtros.buscar} onCambiar={(v) => filtrar('buscar', v)} placeholder="Buscar colaborador por nombre o documento…" />
          ) : (
            <>
              <CampoSelect etiqueta="Área" value={filtros.areaId} onChange={(e) => filtrar('areaId', e.target.value)}>
                <option value="">Todas</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nombre}
                  </option>
                ))}
              </CampoSelect>
              <CampoSelect etiqueta="Programa" value={filtros.programaId} onChange={(e) => filtrar('programaId', e.target.value)}>
                <option value="">Todos</option>
                {programas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.titulo}
                  </option>
                ))}
              </CampoSelect>
            </>
          )}
          <CampoSelect etiqueta={esJefe ? undefined : 'Estado'} aria-label="Estado" value={filtros.estado} onChange={(e) => filtrar('estado', e.target.value)}>
            <option value="">{esJefe ? 'Todos los estados' : 'Todos'}</option>
            <option value="pendiente">Pendientes</option>
            <option value="en_curso">En curso</option>
            <option value="completada">Completadas</option>
            <option value="vencida">Vencidas</option>
          </CampoSelect>
          {!esJefe && (
            <>
              <CampoTexto etiqueta="Asignadas desde" type="date" value={filtros.desde} onChange={(e) => filtrar('desde', e.target.value)} />
              <CampoTexto
                etiqueta="Asignadas hasta"
                type="date"
                value={filtros.hasta}
                onChange={(e) => filtrar('hasta', e.target.value)}
                error={fechasInvalidas ? 'Debe ser posterior a «desde»' : undefined}
              />
            </>
          )}
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {hayFiltros && (
              <button
                onClick={() => {
                  setFiltros(VACIOS)
                  setPagina(1)
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primario"
              >
                <FilterX className="size-4" aria-hidden="true" /> Quitar filtros
              </button>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Boton
              variante="secundario"
              disabled={fechasInvalidas}
              cargando={exportar.isPending && exportar.variables?.formato === 'excel'}
              onClick={() => exportar.mutate({ formato: 'excel', filtros: consulta })}
            >
              <FileSpreadsheet className="size-4 text-exito" aria-hidden="true" /> Exportar a Excel
            </Boton>
            <Boton
              variante="secundario"
              disabled={fechasInvalidas}
              cargando={exportar.isPending && exportar.variables?.formato === 'pdf'}
              onClick={() => exportar.mutate({ formato: 'pdf', filtros: consulta })}
            >
              <FileText className="size-4 text-error" aria-hidden="true" /> Exportar a PDF
            </Boton>
          </div>
        </div>
        {exportar.error && (
          <div className="mt-3">
            <Alerta>No fue posible generar el archivo. Intente de nuevo.</Alerta>
          </div>
        )}
      </section>

      {r && (
        <>
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { texto: 'Asignaciones', valor: r.total },
              { texto: 'Cumplimiento', valor: r.cumplimiento === null ? '—' : `${r.cumplimiento} %`, ayuda: 'Completadas sobre el total' },
              { texto: 'Vencidas', valor: r.vencida, alerta: r.vencida > 0 },
              { texto: 'Aprobación de evaluaciones', valor: r.tasaAprobacion === null ? '—' : `${r.tasaAprobacion} %`, ayuda: 'Intentos aprobados sobre presentados' },
            ].map((c) => (
              <li key={c.texto} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <p className="text-sm text-slate-500">{c.texto}</p>
                <p className={`mt-1 text-2xl font-bold tabular-nums ${c.alerta ? 'text-error' : 'text-slate-900'}`}>{c.valor}</p>
                {c.ayuda && <p className="text-xs text-slate-400">{c.ayuda}</p>}
              </li>
            ))}
          </ul>
          {r.total > 0 && <Distribucion resumen={r} />}
        </>
      )}

      {fechasInvalidas && <Alerta>La fecha «desde» no puede ser posterior a «hasta».</Alerta>}
      {data?.truncado && <Alerta>Se muestran las primeras {filas.length} asignaciones. Use los filtros para acotar el reporte.</Alerta>}

      <div className="space-y-3">
        <Tabla
          encabezados={encabezados}
          cargando={isLoading}
          error={error}
          vacio={filas.length === 0}
          mensajeVacio={hayFiltros ? 'No hay asignaciones con esos filtros.' : esJefe ? 'Su equipo aún no tiene inducciones asignadas.' : 'Aún no hay asignaciones.'}
        >
          {visibles.map((f) => (
            <tr key={f.id} className={f.estado === 'vencida' ? 'bg-error/[0.03]' : 'hover:bg-slate-50/60'}>
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">{f.colaborador}</p>
                <p className="text-xs text-slate-500">{f.cargo ? `${f.cargo} · ${f.area}` : f.documento}</p>
                <p className="mt-0.5 text-xs text-slate-600 md:hidden">{f.programa}</p>
                <p className="mt-0.5 text-xs text-slate-500 sm:hidden">
                  Avance {Math.round(f.porcentajeAvance)} %{f.nota !== null && ` · Nota ${f.nota.toFixed(1)}`}
                </p>
              </td>
              <td className="hidden px-4 py-3 text-slate-700 md:table-cell">{f.programa}</td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <BarraAvance porcentaje={f.porcentajeAvance} completada={f.estado === 'completada'} etiqueta={`Avance de ${f.colaborador}`} compacta />
              </td>
              <td className="hidden px-4 py-3 text-center font-medium tabular-nums text-slate-700 sm:table-cell">
                {f.nota === null ? <span className="text-slate-400">—</span> : f.nota.toFixed(1)}
              </td>
              <td className="hidden px-4 py-3 lg:table-cell">
                <p className="text-slate-700">{formatearFecha(f.fechaLimite)}</p>
                {f.estado !== 'completada' && (
                  <p className={`text-xs ${f.estado === 'vencida' ? 'font-medium text-error' : 'text-slate-500'}`}>{textoVencimiento(f.fechaLimite)}</p>
                )}
              </td>
              <td className="px-4 py-3">
                <EtiquetaAsignacion estado={f.estado} />
              </td>
            </tr>
          ))}
        </Tabla>
        {filas.length > POR_PAGINA && <Paginacion pagina={pagina} totalPaginas={totalPaginas} total={filas.length} onCambiar={setPagina} />}
      </div>
    </div>
  )
}

// Barra apilada con la proporción de cada estado; la leyenda lleva nombre y cantidad (no solo el color)
function Distribucion({ resumen }) {
  return (
    <section className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200" aria-label="Distribución por estado">
      <p className="text-sm font-semibold text-slate-800">Distribución por estado</p>
      <div className="mt-3 flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {ESTADOS.filter((e) => resumen[e.id] > 0).map((e) => (
          <div
            key={e.id}
            className={`${e.color} first:rounded-l-full last:rounded-r-full`}
            style={{ width: `${(resumen[e.id] / resumen.total) * 100}%` }}
            title={`${e.texto}: ${resumen[e.id]}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {ESTADOS.map((e) => (
          <li key={e.id} className="flex items-center gap-1.5 text-slate-600">
            <span className={`size-2.5 rounded-full ${e.color}`} aria-hidden="true" />
            {e.texto}: <strong className="font-semibold tabular-nums text-slate-900">{resumen[e.id]}</strong>
          </li>
        ))}
      </ul>
    </section>
  )
}
