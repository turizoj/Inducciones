import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, CircleAlert, CircleCheck, CircleX, ClipboardCheck, LoaderCircle, Send, Timer } from 'lucide-react'
import Alerta from '../../components/Alerta'
import Boton from '../../components/Boton'
import DialogoConfirmar from '../../components/DialogoConfirmar'
import { enviarRespuestas, informacionEvaluacion, iniciarIntento } from '../../api/evaluaciones'
import { mensajeDeError } from '../../api/cliente'

const formatoNota = (n) => Number(n).toFixed(1)

// Las respuestas se guardan en el navegador mientras se presenta, por si se recarga la página
const claveGuardado = (intentoId) => `sigein-intento-${intentoId}`
function leerGuardadas(intentoId) {
  try {
    return JSON.parse(sessionStorage.getItem(claveGuardado(intentoId))) ?? {}
  } catch {
    return {}
  }
}
function guardarLocal(intentoId, respuestas) {
  try {
    sessionStorage.setItem(claveGuardado(intentoId), JSON.stringify(respuestas))
  } catch {
    // Sin almacenamiento disponible: las respuestas siguen en memoria
  }
}
function borrarLocal(intentoId) {
  try {
    sessionStorage.removeItem(claveGuardado(intentoId))
  } catch {
    // Nada que borrar
  }
}

// HU-11 / CU-11: presentar la evaluación de un módulo (wireframe 19.2.7)
export default function PresentarEvaluacion({ asignacionId, evaluacionId, onRepasar, onContinuar }) {
  const queryClient = useQueryClient()
  const clave = ['evaluacion', evaluacionId, asignacionId]
  const { data: info, isLoading, error } = useQuery({
    queryKey: clave,
    queryFn: () => informacionEvaluacion({ evaluacionId, asignacionId }),
  })
  const [intento, setIntento] = useState(null)
  const [resultado, setResultado] = useState(null)

  const iniciar = useMutation({
    mutationFn: iniciarIntento,
    onSuccess: (datos) => {
      setResultado(null)
      setIntento(datos)
    },
  })

  const alTerminar = useCallback(
    (res) => {
      setIntento(null)
      setResultado(res)
      queryClient.invalidateQueries({ queryKey: ['mi-induccion', asignacionId] })
      queryClient.invalidateQueries({ queryKey: ['mis-inducciones'] })
      queryClient.invalidateQueries({ queryKey: ['notificaciones'] })
      queryClient.invalidateQueries({ queryKey: ['evaluacion', evaluacionId, asignacionId] })
    },
    [queryClient, asignacionId, evaluacionId],
  )

  if (isLoading) {
    return (
      <div className="flex justify-center py-16" role="status">
        <LoaderCircle className="size-7 animate-spin text-primario" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    )
  }
  if (error) return <Alerta>{mensajeDeError(error)}</Alerta>
  if (intento) return <Cuestionario intento={intento} onTerminar={alTerminar} />
  if (resultado) {
    return (
      <Resultado
        resultado={resultado}
        onReintentar={() => setResultado(null)}
        onRepasar={onRepasar}
        onContinuar={onContinuar}
      />
    )
  }

  const { evaluacion } = info
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{info.modulo.titulo} · Evaluación</p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">Evaluación del módulo</h2>

      {info.aprobada && (
        <div className="mt-4">
          <Alerta tipo="exito">Ya aprobó esta evaluación. Puede continuar con el programa.</Alerta>
        </div>
      )}

      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {[
          ['Preguntas', evaluacion.totalPreguntas],
          ['Nota mínima para aprobar', `${formatoNota(evaluacion.notaMinima)} de 5,0`],
          ['Tiempo', evaluacion.tiempoLimiteMin ? `${evaluacion.tiempoLimiteMin} minutos` : 'Sin límite'],
          ['Intentos restantes', `${info.intentosRestantes} de ${evaluacion.intentosMax}`],
        ].map(([texto, valor]) => (
          <li key={texto} className="rounded-lg bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
            <p className="text-xs text-slate-500">{texto}</p>
            <p className="font-semibold text-slate-900">{valor}</p>
          </li>
        ))}
      </ul>

      {!info.aprobada && (
        <ul className="mt-5 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Lea cada pregunta con calma. Algunas tienen más de una respuesta correcta; allí se le indicará.</li>
          {evaluacion.tiempoLimiteMin && (
            <li>El tiempo empieza al presionar «Iniciar». Si se agota, se envían automáticamente las respuestas que tenga.</li>
          )}
          <li>Al terminar verá su nota. Si no aprueba y le quedan intentos, puede repasar e intentarlo de nuevo.</li>
        </ul>
      )}

      {info.intentos.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 text-sm font-medium text-slate-700">Sus intentos</p>
          <ul className="divide-y divide-slate-100 rounded-lg ring-1 ring-slate-200">
            {info.intentos.map((i) => (
              <li key={i.numero} className="flex items-center justify-between px-4 py-2 text-sm">
                <span className="text-slate-600">Intento {i.numero}</span>
                <span className={`font-semibold tabular-nums ${i.aprobado ? 'text-exito' : 'text-error'}`}>
                  {formatoNota(i.nota)} · {i.aprobado ? 'Aprobado' : 'No aprobado'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {iniciar.error && (
        <div className="mt-4">
          <Alerta>{mensajeDeError(iniciar.error)}</Alerta>
        </div>
      )}
      {!info.aprobada && (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:items-center">
          <Boton
            disabled={!info.puedePresentar && !info.intentoEnCurso}
            cargando={iniciar.isPending}
            onClick={() => iniciar.mutate({ evaluacionId, asignacionId })}
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            {info.intentoEnCurso ? 'Continuar el intento en curso' : 'Iniciar evaluación'}
          </Boton>
          {info.motivo && <p className="text-sm text-slate-500">{info.motivo}</p>}
        </div>
      )}
      {info.aprobada && (
        <div className="mt-6">
          <Boton onClick={onContinuar}>
            Continuar <ArrowRight className="size-4" aria-hidden="true" />
          </Boton>
        </div>
      )}
    </div>
  )
}

// Segundos que faltan para que se agote el tiempo (null si no tiene límite)
function useCuentaRegresiva(venceAt) {
  const calcular = useCallback(() => (venceAt ? Math.max(0, Math.round((new Date(venceAt) - Date.now()) / 1000)) : null), [venceAt])
  const [restantes, setRestantes] = useState(calcular)
  useEffect(() => {
    if (!venceAt) return
    const t = setInterval(() => setRestantes(calcular()), 1000)
    return () => clearInterval(t)
  }, [venceAt, calcular])
  return restantes
}

function Cuestionario({ intento, onTerminar }) {
  const { preguntas } = intento
  const [indice, setIndice] = useState(0)
  const [respuestas, setRespuestas] = useState(() => leerGuardadas(intento.intentoId))
  const [confirmando, setConfirmando] = useState(false)
  const restantes = useCuentaRegresiva(intento.venceAt)
  const enviado = useRef(false)

  const enviar = useMutation({
    mutationFn: enviarRespuestas,
    onSuccess: (res) => {
      borrarLocal(intento.intentoId)
      onTerminar(res)
    },
    onError: () => {
      enviado.current = false
    },
  })

  const mandar = useCallback(() => {
    if (enviado.current) return
    enviado.current = true
    setConfirmando(false)
    enviar.mutate({
      intentoId: intento.intentoId,
      respuestas: preguntas.map((p) => ({ preguntaId: p.id, opcionIds: respuestas[p.id] ?? [] })),
    })
  }, [enviar, intento.intentoId, preguntas, respuestas])

  // CU-11 flujo 4a: al llegar a cero se envían automáticamente las respuestas registradas
  useEffect(() => {
    if (restantes === 0) mandar()
  }, [restantes, mandar])

  function elegir(pregunta, opcionId) {
    setRespuestas((r) => {
      const actuales = r[pregunta.id] ?? []
      const nuevas =
        pregunta.tipo === 'multiple'
          ? actuales.includes(opcionId)
            ? actuales.filter((id) => id !== opcionId)
            : [...actuales, opcionId]
          : [opcionId]
      const todas = { ...r, [pregunta.id]: nuevas }
      guardarLocal(intento.intentoId, todas)
      return todas
    })
  }

  const pregunta = preguntas[indice]
  const respondidas = preguntas.filter((p) => respuestas[p.id]?.length).length
  const sinResponder = preguntas.length - respondidas
  const poco = restantes !== null && restantes <= 60
  const reloj = restantes !== null && `${Math.floor(restantes / 60)}:${String(restantes % 60).padStart(2, '0')}`
  const marcadas = respuestas[pregunta.id] ?? []

  return (
    <div>
      <div className="sticky top-16 z-10 -mx-4 -mt-4 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-slate-800">
            Pregunta {indice + 1} de {preguntas.length}
          </p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Intento {intento.numeroIntento} de {intento.intentosMax} · Nota mínima {formatoNota(intento.notaMinima)}
          </p>
          {reloj && (
            <p
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold tabular-nums ${poco ? 'bg-error/10 text-error' : 'bg-slate-100 text-slate-700'}`}
              role="timer"
              aria-live={poco ? 'assertive' : 'off'}
              aria-label={`Tiempo restante ${reloj}`}
            >
              <Timer className="size-4" aria-hidden="true" /> {reloj}
            </p>
          )}
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-secundario transition-all" style={{ width: `${(respondidas / preguntas.length) * 100}%` }} />
        </div>
      </div>

      {enviar.error && (
        <div className="mt-4">
          <Alerta>{mensajeDeError(enviar.error)} Intente enviar de nuevo.</Alerta>
        </div>
      )}

      <fieldset className="mt-6" key={pregunta.id}>
        <legend className="text-lg font-semibold text-slate-900">{pregunta.enunciado}</legend>
        <p className="mt-1 text-sm text-slate-500">
          {pregunta.tipo === 'multiple' ? 'Seleccione todas las respuestas correctas.' : 'Seleccione una respuesta.'}
        </p>
        <div className="mt-4 space-y-2.5">
          {pregunta.opciones.map((o) => {
            const activa = marcadas.includes(o.id)
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-slate-800 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-secundario ${activa ? 'border-primario bg-primario/5' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
              >
                <input
                  type={pregunta.tipo === 'multiple' ? 'checkbox' : 'radio'}
                  name={`pregunta-${pregunta.id}`}
                  checked={activa}
                  onChange={() => elegir(pregunta, o.id)}
                  className="size-5 shrink-0 accent-primario"
                />
                <span>{o.texto}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      <nav className="mt-6 flex flex-wrap justify-center gap-1.5" aria-label="Ir a una pregunta">
        {preguntas.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndice(i)}
            aria-current={i === indice ? 'step' : undefined}
            aria-label={`Pregunta ${i + 1}${respuestas[p.id]?.length ? ', respondida' : ', sin responder'}`}
            className={`grid size-8 place-items-center rounded-full text-xs font-semibold transition-colors ${i === indice ? 'bg-primario text-white' : respuestas[p.id]?.length ? 'bg-secundario/15 text-primario' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {i + 1}
          </button>
        ))}
      </nav>

      <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
        <Boton variante="secundario" disabled={indice === 0} onClick={() => setIndice(indice - 1)}>
          <ArrowLeft className="size-4" aria-hidden="true" /> Anterior
        </Boton>
        {indice < preguntas.length - 1 ? (
          <Boton onClick={() => setIndice(indice + 1)}>
            Siguiente <ArrowRight className="size-4" aria-hidden="true" />
          </Boton>
        ) : (
          <Boton cargando={enviar.isPending} onClick={() => (sinResponder ? setConfirmando(true) : mandar())}>
            <Send className="size-4" aria-hidden="true" /> Enviar evaluación
          </Boton>
        )}
      </div>

      <DialogoConfirmar
        abierto={confirmando}
        titulo="Enviar evaluación"
        mensaje={`Tiene ${sinResponder} pregunta(s) sin responder. Si envía ahora, contarán como incorrectas. ¿Desea enviar de todas formas?`}
        textoConfirmar="Enviar"
        cargando={enviar.isPending}
        onConfirmar={mandar}
        onCerrar={() => setConfirmando(false)}
      />
    </div>
  )
}

// CU-11 paso 6: nota y resultado
function Resultado({ resultado, onReintentar, onRepasar, onContinuar }) {
  const { nota, aprobado, notaMinima, correctas, total, intentosRestantes, fueraDeTiempo, programaCompletado } = resultado
  return (
    <div className="flex flex-col items-center py-6 text-center" role="status">
      {aprobado ? (
        <CircleCheck className="size-14 text-exito" aria-hidden="true" />
      ) : (
        <CircleX className="size-14 text-error" aria-hidden="true" />
      )}
      <p className="mt-3 text-sm font-medium text-slate-500">Su nota</p>
      <p className={`text-5xl font-bold tabular-nums ${aprobado ? 'text-exito' : 'text-error'}`}>
        {formatoNota(nota)}
        <span className="text-2xl text-slate-400"> / 5,0</span>
      </p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{aprobado ? '¡Aprobó la evaluación!' : 'No alcanzó la nota mínima'}</p>
      <p className="mt-1 text-sm text-slate-600">
        Respondió bien {correctas} de {total} pregunta(s). La nota mínima es {formatoNota(notaMinima)}.
      </p>
      {fueraDeTiempo && (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-error">
          <CircleAlert className="size-4" aria-hidden="true" /> Las respuestas llegaron después del tiempo límite.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        {aprobado ? (
          <Boton onClick={onContinuar}>
            {programaCompletado ? 'Ver mi logro' : 'Continuar con el siguiente módulo'} <ArrowRight className="size-4" aria-hidden="true" />
          </Boton>
        ) : intentosRestantes > 0 ? (
          <>
            <Boton variante="secundario" onClick={onRepasar}>
              Repasar los contenidos
            </Boton>
            <Boton onClick={onReintentar}>Intentar de nuevo ({intentosRestantes} restante{intentosRestantes > 1 ? 's' : ''})</Boton>
          </>
        ) : (
          <p className="max-w-md text-sm text-slate-600">
            Ya no le quedan intentos. Su jefe de área fue notificado y se comunicará con usted.
          </p>
        )}
      </div>
    </div>
  )
}
