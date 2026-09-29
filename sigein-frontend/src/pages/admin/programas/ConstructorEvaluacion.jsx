import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft, ArrowUp, CircleCheck, LoaderCircle, Plus, Save, Trash2, X } from 'lucide-react'
import Alerta from '../../../components/Alerta'
import Boton from '../../../components/Boton'
import BotonIcono from '../../../components/BotonIcono'
import CampoSelect from '../../../components/CampoSelect'
import CampoTexto from '../../../components/CampoTexto'
import DialogoConfirmar from '../../../components/DialogoConfirmar'
import useAviso from '../../../hooks/useAviso'
import useConfirmacion from '../../../hooks/useConfirmacion'
import { eliminarEvaluacion, guardarEvaluacion, obtenerEvaluacion } from '../../../api/evaluaciones'
import { mensajeDeError } from '../../../api/cliente'

const TIPOS = {
  unica: 'Selección única',
  multiple: 'Selección múltiple',
  verdadero_falso: 'Verdadero o falso',
}

let siguienteClave = 1
const clave = () => `n${siguienteClave++}`

const opcionesVerdaderoFalso = () => [
  { clave: clave(), texto: 'Verdadero', esCorrecta: false },
  { clave: clave(), texto: 'Falso', esCorrecta: false },
]

const preguntaNueva = () => ({
  clave: clave(),
  enunciado: '',
  tipo: 'unica',
  opciones: [
    { clave: clave(), texto: '', esCorrecta: false },
    { clave: clave(), texto: '', esCorrecta: false },
  ],
})

// Pasa la evaluación guardada al estado del formulario (con claves para las listas)
function aFormulario(evaluacion) {
  return {
    notaMinima: String(evaluacion?.notaMinima ?? 3.5),
    intentosMax: String(evaluacion?.intentosMax ?? 3),
    tiempoLimiteMin: evaluacion?.tiempoLimiteMin ? String(evaluacion.tiempoLimiteMin) : '',
    preguntas: evaluacion
      ? evaluacion.preguntas.map((p) => ({ ...p, clave: clave(), opciones: p.opciones.map((o) => ({ ...o, clave: clave() })) }))
      : [preguntaNueva()],
  }
}

// Mismas reglas que valida la API (HU-07)
function validar(f) {
  const errores = { preguntas: {} }
  const nota = Number(f.notaMinima)
  if (f.notaMinima === '' || Number.isNaN(nota) || nota < 0 || nota > 5) errores.notaMinima = 'La nota mínima va de 0 a 5'
  else if (Math.abs(nota * 10 - Math.round(nota * 10)) > 1e-9) errores.notaMinima = 'Use máximo un decimal'
  if (f.tiempoLimiteMin !== '') {
    const t = Number(f.tiempoLimiteMin)
    if (!Number.isInteger(t) || t < 1 || t > 180) errores.tiempoLimiteMin = 'Entre 1 y 180 minutos, o vacío para sin límite'
  }
  if (f.preguntas.length === 0) errores.general = 'Agregue al menos una pregunta'
  f.preguntas.forEach((p, i) => {
    const e = []
    if (p.enunciado.trim().length < 3) e.push('Escriba la pregunta')
    if (p.opciones.some((o) => !o.texto.trim())) e.push('Todas las opciones deben tener texto')
    const correctas = p.opciones.filter((o) => o.esCorrecta).length
    if (p.tipo !== 'verdadero_falso' && p.opciones.length < 2) e.push('Agregue al menos 2 opciones')
    if (p.tipo === 'multiple' && correctas < 1) e.push('Marque al menos una opción correcta')
    if (p.tipo !== 'multiple' && correctas !== 1) e.push('Marque cuál es la respuesta correcta')
    if (e.length) errores.preguntas[i] = e
  })
  const hayErrores = errores.notaMinima || errores.tiempoLimiteMin || errores.general || Object.keys(errores.preguntas).length
  return hayErrores ? errores : null
}

// HU-07: constructor de la evaluación de un módulo
export default function ConstructorEvaluacion() {
  const { id: programaId, moduloId } = useParams()
  const { data, isLoading, error } = useQuery({
    queryKey: ['evaluacion-admin', moduloId],
    queryFn: () => obtenerEvaluacion(moduloId),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20" role="status">
        <LoaderCircle className="size-8 animate-spin text-primario" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    )
  }
  if (error) return <Alerta>{mensajeDeError(error)}</Alerta>
  return <Formulario key={moduloId} datos={data} programaId={programaId} moduloId={moduloId} />
}

function Formulario({ datos, programaId, moduloId }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [aviso, mostrarAviso] = useAviso()
  const [formulario, setFormulario] = useState(() => aFormulario(datos.evaluacion))
  const [errores, setErrores] = useState(null)
  const { pedir, dialogo } = useConfirmacion()
  const bloqueada = Boolean(datos.evaluacion?.tieneIntentos)
  const volver = `/admin/programas/${programaId}`

  const guardar = useMutation({
    mutationFn: guardarEvaluacion,
    onSuccess: async (respuesta) => {
      await queryClient.invalidateQueries()
      setFormulario(aFormulario(respuesta.evaluacion))
      mostrarAviso(bloqueada ? 'Configuración guardada.' : 'Evaluación guardada.')
    },
  })

  const cambiar = (campo, valor) => setFormulario((f) => ({ ...f, [campo]: valor }))
  const cambiarPregunta = (i, cambios) =>
    setFormulario((f) => ({ ...f, preguntas: f.preguntas.map((p, j) => (j === i ? { ...p, ...cambios } : p)) }))

  function cambiarTipo(i, tipo) {
    const p = formulario.preguntas[i]
    let opciones = p.opciones
    if (tipo === 'verdadero_falso') opciones = opcionesVerdaderoFalso()
    else if (p.tipo === 'verdadero_falso') opciones = preguntaNueva().opciones
    else if (tipo === 'unica' && opciones.filter((o) => o.esCorrecta).length > 1)
      opciones = opciones.map((o) => ({ ...o, esCorrecta: false }))
    cambiarPregunta(i, { tipo, opciones })
  }

  function marcarCorrecta(i, k) {
    const p = formulario.preguntas[i]
    const opciones = p.opciones.map((o, j) =>
      p.tipo === 'multiple' ? (j === k ? { ...o, esCorrecta: !o.esCorrecta } : o) : { ...o, esCorrecta: j === k },
    )
    cambiarPregunta(i, { opciones })
  }

  function mover(i, paso) {
    setFormulario((f) => {
      const preguntas = [...f.preguntas]
      ;[preguntas[i], preguntas[i + paso]] = [preguntas[i + paso], preguntas[i]]
      return { ...f, preguntas }
    })
  }

  function enviar(e) {
    e.preventDefault()
    const encontrados = bloqueada ? null : validar(formulario)
    setErrores(encontrados)
    if (encontrados) return
    guardar.mutate({
      moduloId,
      notaMinima: Number(formulario.notaMinima),
      intentosMax: Number(formulario.intentosMax),
      tiempoLimiteMin: formulario.tiempoLimiteMin === '' ? null : Number(formulario.tiempoLimiteMin),
      preguntas: formulario.preguntas.map((p) => ({
        enunciado: p.enunciado.trim(),
        tipo: p.tipo,
        opciones: p.opciones.map((o) => ({ texto: o.texto.trim(), esCorrecta: o.esCorrecta })),
      })),
    })
  }

  function eliminar() {
    pedir({
      titulo: 'Eliminar evaluación',
      mensaje: `¿Desea eliminar la evaluación del módulo "${datos.modulo.titulo}"? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      ejecutar: async () => {
        await eliminarEvaluacion(moduloId)
        await queryClient.invalidateQueries()
        navigate(volver, { state: { moduloId: Number(moduloId), aviso: 'Evaluación eliminada.' } })
      },
    })
  }

  return (
    <>
      <form onSubmit={enviar} noValidate>
        <Link
          to={volver}
          state={{ moduloId: Number(moduloId) }}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primario"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> {datos.programa.titulo}
        </Link>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Evaluación del módulo</p>
            <h1 className="text-2xl font-bold text-slate-900">{datos.modulo.titulo}</h1>
          </div>
          <div className="flex gap-2">
            {datos.evaluacion && !bloqueada && (
              <Boton type="button" variante="secundario" onClick={eliminar}>
                <Trash2 className="size-4" aria-hidden="true" /> Eliminar
              </Boton>
            )}
            <Boton type="submit" cargando={guardar.isPending}>
              <Save className="size-4" aria-hidden="true" /> Guardar evaluación
            </Boton>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {aviso && <Alerta tipo="exito">{aviso}</Alerta>}
          {guardar.error && <Alerta>{mensajeDeError(guardar.error)}</Alerta>}
          {errores && <Alerta>Revise los campos marcados en rojo antes de guardar.</Alerta>}
          {bloqueada && (
            <p className="rounded-lg bg-alerta/10 px-3 py-2.5 text-sm text-slate-700">
              Esta evaluación ya fue presentada por colaboradores. Puede cambiar la nota mínima, los intentos y el tiempo, pero no
              las preguntas, para no alterar las notas registradas.
            </p>
          )}
        </div>

        <section className="mt-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200" aria-labelledby="titulo-configuracion">
          <h2 id="titulo-configuracion" className="font-semibold text-slate-900">
            Configuración
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <CampoTexto
              etiqueta="Nota mínima para aprobar (0 a 5)"
              type="number"
              step="0.1"
              min="0"
              max="5"
              value={formulario.notaMinima}
              onChange={(e) => cambiar('notaMinima', e.target.value)}
              error={errores?.notaMinima}
            />
            <CampoSelect
              etiqueta="Intentos permitidos"
              value={formulario.intentosMax}
              onChange={(e) => cambiar('intentosMax', e.target.value)}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} intento{n > 1 ? 's' : ''}
                </option>
              ))}
            </CampoSelect>
            <CampoTexto
              etiqueta="Tiempo límite en minutos (opcional)"
              type="number"
              min="1"
              max="180"
              placeholder="Sin límite"
              value={formulario.tiempoLimiteMin}
              onChange={(e) => cambiar('tiempoLimiteMin', e.target.value)}
              error={errores?.tiempoLimiteMin}
            />
          </div>
        </section>

        <section className="mt-4 space-y-4" aria-labelledby="titulo-preguntas">
          <div className="flex items-center justify-between">
            <h2 id="titulo-preguntas" className="font-semibold text-slate-900">
              Preguntas ({formulario.preguntas.length})
            </h2>
            {errores?.general && <p className="text-sm text-error">{errores.general}</p>}
          </div>

          {formulario.preguntas.map((p, i) => (
            <fieldset
              key={p.clave}
              disabled={bloqueada}
              className={`rounded-xl bg-white p-5 shadow-sm ring-1 ${errores?.preguntas[i] ? 'ring-2 ring-error/50' : 'ring-slate-200'}`}
            >
              <legend className="sr-only">Pregunta {i + 1}</legend>
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primario text-xs font-bold text-white">
                  {i + 1}
                </span>
                {!bloqueada && (
                  <div className="flex">
                    <BotonIcono
                      icono={ArrowUp}
                      texto="Subir pregunta"
                      disabled={i === 0}
                      onClick={() => mover(i, -1)}
                      type="button"
                    />
                    <BotonIcono
                      icono={ArrowDown}
                      texto="Bajar pregunta"
                      disabled={i === formulario.preguntas.length - 1}
                      onClick={() => mover(i, 1)}
                      type="button"
                    />
                    <BotonIcono
                      icono={Trash2}
                      texto="Eliminar pregunta"
                      peligro
                      type="button"
                      onClick={() => setFormulario((f) => ({ ...f, preguntas: f.preguntas.filter((_, j) => j !== i) }))}
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                <CampoTexto
                  etiqueta={`Pregunta ${i + 1}`}
                  value={p.enunciado}
                  onChange={(e) => cambiarPregunta(i, { enunciado: e.target.value })}
                  placeholder="Escriba la pregunta"
                />
                <CampoSelect etiqueta="Tipo" value={p.tipo} onChange={(e) => cambiarTipo(i, e.target.value)}>
                  {Object.entries(TIPOS).map(([valor, texto]) => (
                    <option key={valor} value={valor}>
                      {texto}
                    </option>
                  ))}
                </CampoSelect>
              </div>

              <p className="mb-2 mt-4 text-sm font-medium text-slate-700">
                Opciones{' '}
                <span className="font-normal text-slate-500">
                  — marque {p.tipo === 'multiple' ? 'las correctas' : 'la correcta'}
                </span>
              </p>
              <ul className="space-y-2">
                {p.opciones.map((o, k) => (
                  <li key={o.clave} className="flex items-center gap-2">
                    <label
                      className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-secundario ${o.esCorrecta ? 'border-exito bg-exito/10 text-exito' : 'border-slate-300 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <input
                        type={p.tipo === 'multiple' ? 'checkbox' : 'radio'}
                        name={`correcta-${p.clave}`}
                        checked={o.esCorrecta}
                        onChange={() => marcarCorrecta(i, k)}
                        className="sr-only"
                      />
                      <CircleCheck className="size-4" aria-hidden="true" />
                      <span className="hidden sm:inline">Correcta</span>
                      <span className="sr-only sm:hidden">Marcar la opción {k + 1} como correcta</span>
                    </label>
                    <input
                      value={o.texto}
                      onChange={(e) =>
                        cambiarPregunta(i, {
                          opciones: p.opciones.map((x, j) => (j === k ? { ...x, texto: e.target.value } : x)),
                        })
                      }
                      readOnly={p.tipo === 'verdadero_falso'}
                      aria-label={`Opción ${k + 1} de la pregunta ${i + 1}`}
                      placeholder={`Opción ${k + 1}`}
                      maxLength={255}
                      className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-secundario focus:ring-2 focus:ring-secundario/20 read-only:bg-slate-50"
                    />
                    {p.tipo !== 'verdadero_falso' && !bloqueada && (
                      <BotonIcono
                        icono={X}
                        texto="Quitar opción"
                        type="button"
                        disabled={p.opciones.length <= 2}
                        onClick={() => cambiarPregunta(i, { opciones: p.opciones.filter((_, j) => j !== k) })}
                      />
                    )}
                  </li>
                ))}
              </ul>
              {p.tipo !== 'verdadero_falso' && !bloqueada && p.opciones.length < 10 && (
                <button
                  type="button"
                  onClick={() =>
                    cambiarPregunta(i, { opciones: [...p.opciones, { clave: clave(), texto: '', esCorrecta: false }] })
                  }
                  className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-secundario hover:underline"
                >
                  <Plus className="size-4" aria-hidden="true" /> Agregar opción
                </button>
              )}
              {errores?.preguntas[i] && (
                <ul className="mt-3 space-y-0.5 text-xs text-error">
                  {errores.preguntas[i].map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </fieldset>
          ))}

          {!bloqueada && formulario.preguntas.length < 50 && (
            <Boton
              type="button"
              variante="secundario"
              className="w-full"
              onClick={() => setFormulario((f) => ({ ...f, preguntas: [...f.preguntas, preguntaNueva()] }))}
            >
              <Plus className="size-4" aria-hidden="true" /> Agregar pregunta
            </Boton>
          )}
        </section>
      </form>
      <DialogoConfirmar {...dialogo} />
    </>
  )
}
