import { useEffect, useRef } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Award, Check, CircleCheck, ClipboardCheck, Lock, LoaderCircle, PartyPopper, PlayCircle } from 'lucide-react'
import Alerta from '../../components/Alerta'
import BarraAvance from '../../components/BarraAvance'
import Boton from '../../components/Boton'
import { marcarContenidoVisto, obtenerMiInduccion } from '../../api/asignaciones'
import { mensajeDeError } from '../../api/cliente'
import { describirContenido } from '../../utils/contenidos'
import { formatearFecha } from '../../utils/fechas'
import PresentarEvaluacion from './PresentarEvaluacion'
import VistaContenido from './VistaContenido'

// Lista ordenada de lo que se recorre: los contenidos de cada módulo y, al final, su evaluación
function recorrido(modulos) {
  return modulos.flatMap((m) => [
    ...m.contenidos.map((c) => ({ tipo: 'contenido', id: c.id, contenido: c, modulo: m, hecho: c.visto })),
    ...(m.evaluacion ? [{ tipo: 'evaluacion', id: m.evaluacion.id, evaluacion: m.evaluacion, modulo: m, hecho: m.evaluacion.aprobada }] : []),
  ])
}

const mismo = (a, b) => a && b && a.tipo === b.tipo && a.id === b.id

// HU-10 / CU-10: visor de contenidos (wireframe 19.2.6), con la evaluación de cada módulo (HU-11)
export default function VisorInduccion() {
  const id = Number(useParams().id)
  const [params, setParams] = useSearchParams()
  const queryClient = useQueryClient()
  const principal = useRef(null)
  const clave = ['mi-induccion', id]
  const { data: induccion, isLoading, error } = useQuery({ queryKey: clave, queryFn: () => obtenerMiInduccion(id) })

  const ir = (item) => setParams(item.tipo === 'evaluacion' ? { evaluacion: item.id } : { contenido: item.id })

  const marcar = useMutation({
    mutationFn: marcarContenidoVisto,
    onSuccess: (actualizada, { contenidoId }) => {
      queryClient.setQueryData(clave, actualizada)
      queryClient.invalidateQueries({ queryKey: ['mis-inducciones'] })
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
      // Pasa a lo siguiente (otro contenido o la evaluación); si era lo último, se queda y muestra la felicitación
      const lista = recorrido(actualizada.modulos)
      const siguiente = lista[lista.findIndex((x) => mismo(x, { tipo: 'contenido', id: contenidoId })) + 1]
      if (siguiente) ir(siguiente)
    },
  })

  const pedido = params.get('evaluacion')
    ? { tipo: 'evaluacion', id: Number(params.get('evaluacion')) }
    : params.get('contenido')
      ? { tipo: 'contenido', id: Number(params.get('contenido')) }
      : null
  // Al cambiar de contenido se sube al inicio del contenido (no al abrir la página)
  const clavePedido = pedido ? `${pedido.tipo}-${pedido.id}` : ''
  const pedidoAnterior = useRef(clavePedido)
  useEffect(() => {
    if (pedidoAnterior.current === clavePedido) return
    pedidoAnterior.current = clavePedido
    principal.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [clavePedido])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20" role="status">
        <LoaderCircle className="size-8 animate-spin text-primario" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    )
  }
  if (error) return <Alerta>{mensajeDeError(error)}</Alerta>

  const lista = recorrido(induccion.modulos)
  // "Retomar donde lo dejé": sin nada en la dirección, se abre lo primero pendiente
  const actual = lista.find((x) => mismo(x, pedido)) ?? lista.find((x) => mismo(x, induccion.siguiente)) ?? lista[0]
  const posicion = lista.indexOf(actual)
  const anterior = lista[posicion - 1]
  const siguiente = lista[posicion + 1]
  const bloqueado = actual?.modulo.estado === 'bloqueado'
  const completada = induccion.estado === 'completada'
  const primeroDelModulo = actual && lista.find((x) => x.modulo.id === actual.modulo.id)

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
          <div className="flex flex-col gap-3 rounded-xl border border-exito/30 bg-exito/5 p-4 sm:flex-row sm:items-center">
            <PartyPopper className="size-6 shrink-0 text-exito" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold text-exito">¡Felicitaciones! Completó esta inducción.</p>
              <p className="text-sm text-slate-600">Su certificado ya está disponible. Puede repasar los contenidos cuando quiera.</p>
            </div>
            <Link
              to="/certificados"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-exito px-4 py-2.5 text-sm font-semibold text-white hover:bg-exito/90"
            >
              <Award className="size-4" aria-hidden="true" /> Ver mi certificado
            </Link>
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
            <Indice modulos={induccion.modulos} actual={actual} onElegir={ir} />
          </div>
        </details>
        <aside
          className="hidden self-start rounded-xl bg-white p-3 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-20 lg:block"
          aria-label="Índice del programa"
        >
          <Indice modulos={induccion.modulos} actual={actual} onElegir={ir} />
        </aside>

        <main ref={principal} className="min-w-0 scroll-mt-20 rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6">
          {!actual ? (
            <p className="text-sm text-slate-500">Este programa aún no tiene contenidos.</p>
          ) : bloqueado ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Lock className="size-10 text-slate-300" aria-hidden="true" />
              <p className="mt-3 font-semibold text-slate-700">Este módulo está bloqueado</p>
              <p className="mt-1 max-w-sm text-sm text-slate-500">Para verlo, primero complete el módulo anterior y apruebe su evaluación.</p>
            </div>
          ) : actual.tipo === 'evaluacion' ? (
            <PresentarEvaluacion
              key={actual.id}
              asignacionId={id}
              evaluacionId={actual.id}
              onRepasar={() => ir(primeroDelModulo)}
              onContinuar={() => (siguiente ? ir(siguiente) : window.scrollTo({ top: 0, behavior: 'smooth' }))}
            />
          ) : (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {actual.modulo.titulo} · {describirContenido(actual.contenido).detalle.split(' · ')[0]}
              </p>
              <h2 className="mt-1 text-xl font-bold text-slate-900">{actual.contenido.titulo}</h2>
              <div className="mt-5" key={actual.id}>
                <VistaContenido contenido={actual.contenido} />
              </div>
            </>
          )}

          {actual && actual.tipo === 'contenido' && (
            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <Boton variante="secundario" disabled={!anterior} onClick={() => ir(anterior)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Anterior
              </Boton>
              {!bloqueado && !actual.hecho ? (
                <Boton cargando={marcar.isPending} onClick={() => marcar.mutate({ asignacionId: id, contenidoId: actual.id })}>
                  <Check className="size-4" aria-hidden="true" /> Marcar como visto y continuar
                </Boton>
              ) : (
                <Boton variante={siguiente ? 'primario' : 'secundario'} disabled={!siguiente} onClick={() => ir(siguiente)}>
                  {actual.hecho && (
                    <span className="mr-1 inline-flex items-center gap-1 text-xs font-medium opacity-80">
                      <CircleCheck className="size-3.5" aria-hidden="true" /> Visto ·
                    </span>
                  )}
                  {siguiente?.tipo === 'evaluacion' ? 'Ir a la evaluación' : 'Siguiente'} <ArrowRight className="size-4" aria-hidden="true" />
                </Boton>
              )}
            </div>
          )}
          {actual && actual.tipo === 'evaluacion' && anterior && (
            <div className="mt-6 border-t border-slate-100 pt-4">
              <Boton variante="secundario" onClick={() => ir(anterior)}>
                <ArrowLeft className="size-4" aria-hidden="true" /> Anterior
              </Boton>
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

// Índice lateral: módulos con su estado, contenidos vistos y evaluación aprobada
function Indice({ modulos, actual, onElegir }) {
  return (
    <ol className="space-y-3">
      {modulos.map((m, i) => {
        const { icono: Icono, clases, texto } = iconosModulo[m.estado]
        const bloqueado = m.estado === 'bloqueado'
        const items = recorrido([m])
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
              {items.map((item) => {
                const activo = mismo(item, actual)
                const esEvaluacion = item.tipo === 'evaluacion'
                return (
                  <li key={`${item.tipo}-${item.id}`}>
                    <button
                      onClick={() => onElegir(item)}
                      disabled={bloqueado}
                      aria-current={activo ? 'step' : undefined}
                      title={bloqueado ? 'Complete el módulo anterior para desbloquearlo' : undefined}
                      className={`flex w-full items-center gap-2 rounded-lg py-1.5 pl-7 pr-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:text-slate-400 ${activo ? 'bg-primario/10 font-medium text-primario' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                      {esEvaluacion && <ClipboardCheck className="size-3.5 shrink-0" aria-hidden="true" />}
                      <span className="min-w-0 flex-1 truncate">{esEvaluacion ? 'Evaluación del módulo' : item.contenido.titulo}</span>
                      {item.hecho && (
                        <>
                          <Check className="size-3.5 shrink-0 text-exito" aria-hidden="true" />
                          <span className="sr-only">{esEvaluacion ? '(aprobada)' : '(visto)'}</span>
                        </>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </li>
        )
      })}
    </ol>
  )
}
