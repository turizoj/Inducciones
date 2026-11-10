import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, CircleAlert, CircleCheck, Search, User, Users } from 'lucide-react'
import Modal from '../../components/Modal'
import CampoSelect from '../../components/CampoSelect'
import CampoTexto from '../../components/CampoTexto'
import CargandoModal from '../../components/CargandoModal'
import Boton from '../../components/Boton'
import Alerta from '../../components/Alerta'
import useAuth from '../../hooks/useAuth'
import { crearAsignacion, opcionesAsignacion } from '../../api/asignaciones'
import { mensajeDeError } from '../../api/cliente'
import { fechaTexto } from '../../utils/fechas'
import { normalizar } from '../../utils/textos'
import { ROLES } from '../../utils/roles'

const MODOS = [
  { id: 'individual', texto: 'Personas', icono: User },
  { id: 'area', texto: 'Un área', icono: Building2 },
  { id: 'cargo', texto: 'Un cargo', icono: Users },
]

// CU-08: nueva asignación (individual, por área o por cargo) con fecha límite
export default function FormularioAsignacion({ onCerrar }) {
  const { data: opciones, error } = useQuery({ queryKey: ['opciones-asignacion'], queryFn: opcionesAsignacion })
  if (error) {
    return (
      <Modal abierto titulo="Nueva asignación" onCerrar={onCerrar}>
        <Alerta>{mensajeDeError(error)}</Alerta>
      </Modal>
    )
  }
  if (!opciones) return <CargandoModal titulo="Nueva asignación" onCerrar={onCerrar} />
  return <Formulario opciones={opciones} onCerrar={onCerrar} />
}

function Formulario({ opciones, onCerrar }) {
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const [programaId, setProgramaId] = useState(opciones.programas.length === 1 ? String(opciones.programas[0].id) : '')
  const [modo, setModo] = useState('individual')
  const [seleccionados, setSeleccionados] = useState(new Set())
  const [buscar, setBuscar] = useState('')
  const [areaId, setAreaId] = useState('')
  const [cargoId, setCargoId] = useState('')
  const [fechaLimite, setFechaLimite] = useState(fechaTexto(30))
  const [errores, setErrores] = useState({})

  const mutacion = useMutation({
    mutationFn: crearAsignacion,
    onSuccess: () => queryClient.invalidateQueries(),
  })

  const visibles = useMemo(() => {
    const texto = normalizar(buscar)
    return opciones.colaboradores.filter((c) => normalizar(`${c.nombre} ${c.documento} ${c.cargo ?? ''} ${c.area ?? ''}`).includes(texto))
  }, [buscar, opciones.colaboradores])

  // Cargos agrupados por área para la lista desplegable
  const cargosPorArea = useMemo(() => {
    const grupos = new Map()
    opciones.cargos.forEach((c) => grupos.set(c.area, [...(grupos.get(c.area) ?? []), c]))
    return [...grupos.entries()]
  }, [opciones.cargos])

  if (mutacion.data) return <Resumen resultado={mutacion.data} onCerrar={onCerrar} />

  if (opciones.programas.length === 0) {
    return (
      <Modal abierto titulo="Nueva asignación" onCerrar={onCerrar}>
        <div className="space-y-4">
          <Alerta>No hay programas publicados para asignar.</Alerta>
          {usuario.rol === ROLES.ADMIN && (
            <p className="text-sm text-slate-600">
              Publique un programa en{' '}
              <Link to="/admin/programas" className="font-medium text-secundario hover:underline" onClick={onCerrar}>
                Programas
              </Link>{' '}
              y vuelva aquí.
            </p>
          )}
        </div>
      </Modal>
    )
  }

  function alternar(id) {
    setSeleccionados((s) => {
      const nuevo = new Set(s)
      if (nuevo.has(id)) nuevo.delete(id)
      else nuevo.add(id)
      return nuevo
    })
    setErrores((e) => ({ ...e, destinatarios: undefined }))
  }

  const todosVisibles = visibles.length > 0 && visibles.every((c) => seleccionados.has(c.id))
  function alternarVisibles() {
    setSeleccionados((s) => {
      const nuevo = new Set(s)
      visibles.forEach((c) => (todosVisibles ? nuevo.delete(c.id) : nuevo.add(c.id)))
      return nuevo
    })
  }

  function enviar(e) {
    e.preventDefault()
    const errs = {}
    if (!programaId) errs.programa = 'Seleccione el programa'
    if (modo === 'individual' && seleccionados.size === 0) errs.destinatarios = 'Seleccione al menos un colaborador'
    if (modo === 'area' && !areaId) errs.destinatarios = 'Seleccione el área'
    if (modo === 'cargo' && !cargoId) errs.destinatarios = 'Seleccione el cargo'
    if (!fechaLimite || fechaLimite < fechaTexto()) errs.fecha = 'La fecha límite no puede ser anterior a hoy'
    setErrores(errs)
    if (Object.keys(errs).length) return

    mutacion.mutate({
      programaId: Number(programaId),
      modo,
      fechaLimite,
      ...(modo === 'individual' && { usuarioIds: [...seleccionados] }),
      ...(modo === 'area' && { areaId: Number(areaId) }),
      ...(modo === 'cargo' && { cargoId: Number(cargoId) }),
    })
  }

  return (
    <Modal abierto titulo="Nueva asignación" onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={enviar} className="space-y-5" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}

        <CampoSelect etiqueta="Programa" value={programaId} onChange={(e) => setProgramaId(e.target.value)} error={errores.programa}>
          <option value="">Seleccione…</option>
          {opciones.programas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.titulo}
            </option>
          ))}
        </CampoSelect>

        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-slate-700">¿A quién se asigna?</legend>
          <div className="grid grid-cols-3 gap-2">
            {MODOS.map(({ id, texto, icono: Icono }) => (
              <label
                key={id}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border-2 px-2 py-2.5 text-center text-sm font-medium transition-colors has-focus-visible:ring-2 has-focus-visible:ring-secundario ${modo === id ? 'border-primario bg-primario/5 text-primario' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
              >
                <input
                  type="radio"
                  name="modo"
                  checked={modo === id}
                  onChange={() => {
                    setModo(id)
                    setErrores({})
                  }}
                  className="sr-only"
                />
                <Icono className="size-5" aria-hidden="true" />
                {texto}
              </label>
            ))}
          </div>
        </fieldset>

        {modo === 'individual' && (
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">Colaboradores</p>
              <span className="text-xs text-slate-500">{seleccionados.size} seleccionado(s)</span>
            </div>
            <div className={`overflow-hidden rounded-lg border ${errores.destinatarios ? 'border-error' : 'border-slate-300'}`}>
              <div className="relative border-b border-slate-200">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                <input
                  type="search"
                  value={buscar}
                  onChange={(e) => setBuscar(e.target.value)}
                  placeholder="Buscar por nombre, documento, cargo o área…"
                  aria-label="Buscar colaborador"
                  className="w-full py-2.5 pl-9 pr-3 text-sm outline-none"
                />
              </div>
              {visibles.length > 0 && (
                <label className="flex items-center gap-2.5 border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600">
                  <input type="checkbox" checked={todosVisibles} onChange={alternarVisibles} className="size-4 accent-primario" />
                  Seleccionar {buscar ? 'los resultados' : 'todos'} ({visibles.length})
                </label>
              )}
              <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto">
                {visibles.length === 0 && (
                  <li className="px-3 py-6 text-center text-sm text-slate-500">
                    {opciones.colaboradores.length === 0 ? 'No hay colaboradores activos disponibles.' : 'No hay coincidencias.'}
                  </li>
                )}
                {visibles.map((c) => (
                  <li key={c.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-slate-50">
                      <input type="checkbox" checked={seleccionados.has(c.id)} onChange={() => alternar(c.id)} className="size-4 accent-primario" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm text-slate-800">{c.nombre}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {c.documento}
                          {c.cargo && ` · ${c.cargo} (${c.area})`}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
            {errores.destinatarios && <p className="mt-1 text-xs text-error">{errores.destinatarios}</p>}
          </div>
        )}

        {modo === 'area' && (
          <CampoSelect etiqueta="Área" value={areaId} onChange={(e) => setAreaId(e.target.value)} error={errores.destinatarios}>
            <option value="">Seleccione…</option>
            {opciones.areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </CampoSelect>
        )}

        {modo === 'cargo' && (
          <CampoSelect etiqueta="Cargo" value={cargoId} onChange={(e) => setCargoId(e.target.value)} error={errores.destinatarios}>
            <option value="">Seleccione…</option>
            {cargosPorArea.map(([area, cargos]) => (
              <optgroup key={area} label={area}>
                {cargos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </optgroup>
            ))}
          </CampoSelect>
        )}

        {modo !== 'individual' && (
          <p className="-mt-2 text-xs text-slate-500">Se asigna a todos los colaboradores activos de {modo === 'area' ? 'esa área' : 'ese cargo'}.</p>
        )}

        <div className="sm:w-1/2">
          <CampoTexto
            etiqueta="Fecha límite"
            type="date"
            min={fechaTexto()}
            value={fechaLimite}
            onChange={(e) => setFechaLimite(e.target.value)}
            error={errores.fecha}
          />
        </div>

        <p className="rounded-lg bg-secundario/5 px-3 py-2.5 text-xs text-slate-600">
          Cada colaborador recibirá una notificación y un correo. Si alguien ya tiene este programa activo, se omite.
        </p>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            Asignar
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

// CU-08 paso 6a: resumen con las personas asignadas y las omitidas
function Resumen({ resultado, onCerrar }) {
  const { asignados, omitidos } = resultado
  return (
    <Modal abierto titulo="Resultado de la asignación" onCerrar={onCerrar}>
      <div className="space-y-4">
        {asignados.length > 0 ? (
          <Alerta tipo="exito">
            Se asignó el programa a {asignados.length} colaborador(es). Ya recibieron su notificación y su correo.
          </Alerta>
        ) : (
          <Alerta>No se creó ninguna asignación nueva.</Alerta>
        )}
        {asignados.length > 0 && (
          <ul className="max-h-40 space-y-1 overflow-y-auto text-sm text-slate-700">
            {asignados.map((nombre) => (
              <li key={nombre} className="flex items-center gap-2">
                <CircleCheck className="size-4 shrink-0 text-exito" aria-hidden="true" /> {nombre}
              </li>
            ))}
          </ul>
        )}
        {omitidos.length > 0 && (
          <div>
            <p className="mb-1 text-sm font-medium text-slate-700">Omitidos ({omitidos.length})</p>
            <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
              {omitidos.map((o) => (
                <li key={o.nombre} className="flex gap-2 text-slate-600">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-alerta" aria-hidden="true" />
                  <span>
                    <strong className="font-medium text-slate-800">{o.nombre}:</strong> {o.motivo}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end">
          <Boton onClick={onCerrar}>Listo</Boton>
        </div>
      </div>
    </Modal>
  )
}
