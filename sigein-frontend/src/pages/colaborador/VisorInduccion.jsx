import { useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  ClipboardCheck,
  Lock,
  LoaderCircle,
  PartyPopper,
  PlayCircle,
} from 'lucide-react'
import Alerta from '../../components/Alerta'
import BarraAvance from '../../components/BarraAvance'
import Boton from '../../components/Boton'
import { marcarContenidoVisto, obtenerMiInduccion } from '../../api/asignaciones'
import { mensajeDeError } from '../../api/cliente'
import { describirContenido } from '../../utils/contenidos'
import { formatearFecha } from '../../utils/fechas'
import VistaContenido from './VistaContenido'

// HU-10 / CU-10: visor de contenidos (wireframe 19.2.6)
export default function VisorInduccion() {
  const id = Number(useParams().id)
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const principal = useRef(null)
  const clave = ['mi-induccion', id]
  const { data: induccion, isLoading, error } = useQuery({ queryKey: clave, queryFn: () => obtenerMiInduccion(id) })

  const marcar = useMutation({
    mutationFn: marcarContenidoVisto,
    onSuccess: (actualizada, { contenidoId }) => {
      queryClient.setQueryData(clave, actualizada)
      queryClient.invalidateQueries({ queryKey: ['mis-inducciones'] })
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
      // Pasa al contenido siguiente; si era el último, se queda y muestra la felicitación
      const lista = actualizada.modulos.flatMap((m) => m.contenidos)
      const siguiente = lista[lista.findIndex((c) => c.id === contenidoId) + 1]
      if (siguiente) setParams({ contenido: siguiente.id })
    },
  })

  const contenidoPedido = Number(params.get('contenido'))
  // Al cambiar de contenido se sube al inicio del contenido (no al abrir la página)
  const contenidoAnterior = useRef(contenidoPedido)
  useEffect(() => {
    if (contenidoAnterior.current === contenidoPedido) return
    contenidoAnterior.current = contenidoPedido
    principal.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [contenidoPedido])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20" role="status">
        <LoaderCircle className="size-8 animate-spin text-primario" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    )
  }
  if (error) return <Alerta>{mensajeDeError(error)}</Alerta>

  const contenidos = induccion.modulos.flatMap((m) => m.contenidos.map((c) => ({ ...c, modulo: m })))
  // "Retomar donde lo dejé": sin contenido en la dirección, se abre el primero sin ver
  const actual =
    contenidos.find((c) => c.id === contenidoPedido) ??
    contenidos.find((c) => c.id === induccion.siguienteContenidoId) ??
    contenidos[0]
  const posicion = contenidos.indexOf(actual)
  const anterior = contenidos[posicion - 1]
  const siguiente = contenidos[posicion + 1]
  const bloqueado = actual?.modulo.estado === 'bloqueado'
  const completada = induccion.estado === 'completada'
  const ir = (c) => setParams({ contenido: c.id })

  return (
    <div>
      <Link to="/mis-inducciones" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primario">
        <ArrowLeft className="size-4" aria-hidden="true" /> Mis inducciones
      </Link>

      <header className="mt-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-bold text-slate-900 sm:text-xl">{induccion.programa.titulo}</h1>
          <p className={`text-xs ${induccion.estado === 'vencida' ? 'font-semibold text-error' : 'text-slate-500'}`}>
            Fecha límite: {formatearFecha(induccion.fechaLimite)}
          </p>
        </div>
        <div className="mt-3">
          <BarraAvance porcentaje={induccion.porcentajeAvance} completada={completada} etiqueta="Avance del programa" />
        </div>
      </header>

      <div className="mt-4 space-y-3">
        {completada && (
          <div className="flex items-start gap-3 rounded-xl border border-exito/30 bg-exito/5 p-4">
            <PartyPopper className="size-6 shrink-0 text-exito" aria-hidden="true" />
            <div>
              <p className="font-semibold text-exito">¡Felicitaciones! Completó esta inducción.</p>
              <p className="text-sm text-slate-600">Puede repasar los contenidos cuando quiera. El certificado estará disponible próximamente.</p>
            </div>
          </div>
        )}
        {induccion.estado === 'vencida' && (
          <Alerta>Esta inducción venció el {formatearFecha(induccion.fechaLimite)}. Aún puede terminarla; avise a su jefe.</Alerta>
        )}
        {marcar.error && <Alerta>{mensajeDeError(marcar.error)}</Alerta>}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* En celular el índice se muestra plegado para dejar espacio al contenido */}
        <details className="group rounded-xl bg-white shadow-sm ring-1 ring-slate-200 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
            Contenido del programa
            <span className="text-xs font-normal text-slate-500 group-open:hidden">Ver índice</span>
            <span className="hidden text-xs font-normal text-slate-500 group-open:inline">Ocultar</span>
          </summary>
          <div className="border-t border-slate-100 p-3">
            <Indice modulos={induccion.modulos} actualId={actual?.id} onElegir={ir} />
          </div>
        </details>
        <aside className="hidden self-start rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-20 lg:block" aria-label="Índice del programa">
          <Indice modulos={induccion.modulos} actualId={actual?.id} onElegir={ir} />
        </aside>

        <main ref={principal} className="min-w-0 scroll-mt-20 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          {!actual ? (
            <p className="text-sm text-slate-500">Este programa aún no tiene contenidos.</p>
          ) : bloqueado ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Lock className="size-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3 font-semibold text-slate-700">Este módulo está bloqueado</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Para verlo, primero complete el módulo anterior.</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {actual.modulo.titulo} · {describirContenido(actual).detalle.split(' · ')[0]}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{actual.titulo}</h2>
              <div className="mt-5" key={actual.id}>
                <VistaContenido contenido={actual} />
              </div>
            </>
          )}

          {actual && (
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Boton variante="secundario" disabled={!anterior} onClick={() => ir(anterior)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Anterior
              </Boton>
              {!bloqueado && !actual.visto ? (
                <Boton cargando={marcar.isPending} onClick={() => marcar.mutate({ asignacionId: id, contenidoId: actual.id })}>
                  <Check className="size-4" aria-hidden="true" /> Marcar como visto y continuar
                </Boton>
              ) : (
                <Boton variante={siguiente ? 'primario' : 'secundario'} disabled={!siguiente} onClick={() => ir(siguiente)}>
                  {actual.visto && (
                    <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium opacity-80">
                      <CircleCheck className="size-3.5" aria-hidden="true" /> Visto ·
                    </span>
                  )}
                  Siguiente <ArrowRight className="size-4" aria-hidden="true" />
                </Boton>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

const iconosModulo = {
  completado: { icono: CircleCheck, clases: 'text-exito', texto: 'completado' },
  en_curso: { icono: PlayCircle, clases: 'text-secundario', texto: 'en curso' },
  bloqueado: { icono: Lock, clases: 'text-slate-400', texto: 'bloqueado' },
}

// Índice lateral: módulos con su estado y contenidos con su marca de visto
function Indice({ modulos, actualId, onElegir }) {
  return (
    <ol className="space-y-3">
      {modulos.map((m, i) => {
        const { icono: Icono, clases, texto } = iconosModulo[m.estado]
        const bloqueado = m.estado === 'bloqueado'
        return (
          <li key={m.id}>
            <p className="flex items-start gap-2 px-1 text-sm font-semibold text-slate-800">
              <Icono className={`mt-0.5 size-4 shrink-0 ${clases}`} aria-hidden="true" />
              <span>
                Módulo {i + 1}: {m.titulo}
                <span className="sr-only"> ({texto})</span>
              </span>
            </p>
            <ul className="mt-1 space-y-0.5">
              {m.contenidos.map((c) => {
                const activo = c.id === actualId
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => onElegir(c)}
                      disabled={bloqueado}
                      aria-current={activo ? 'step' : undefined}
                      title={bloqueado ? 'Complete el módulo anterior para desbloquearlo' : undefined}
                      className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-7 pr-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-slate-400 ${activo ? 'bg-primario/10 font-medium text-primario' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      <span className="min-w-0 flex-1 truncate">{c.titulo}</span>
                      {c.visto && (
                        <>
                          <Check className="size-3.5 shrink-0 text-exito" aria-hidden="true" />
                          <span className="sr-only">(visto)</span>
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
              {m.evaluacion && (
                <li className="flex items-center gap-2 py-1.5 pl-7 pr-2 text-sm text-slate-400">
                  <ClipboardCheck className="size-3.5" aria-hidden="true" /> Evaluación del módulo
                </li>
              )}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
