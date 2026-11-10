import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { listarNotificaciones, marcarNotificacionLeida, marcarTodasLeidas } from '../api/asignaciones'

const formatoFecha = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

// HU-15 / RF-24: la campana muestra el número de notificaciones sin leer
export default function Campana() {
  const queryClient = useQueryClient()
  const [abierta, setAbierta] = useState(false)
  const contenedor = useRef(null)
  const { data } = useQuery({ queryKey: ['notificaciones'], queryFn: listarNotificaciones, refetchInterval: 60000 })
  const leer = useMutation({
    mutationFn: (id) => (id ? marcarNotificacionLeida(id) : marcarTodasLeidas()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notificaciones'] }),
  })

  // Se cierra al hacer clic afuera o con Escape
  useEffect(() => {
    if (!abierta) return
    const cerrarAfuera = (e) => !contenedor.current?.contains(e.target) && setAbierta(false)
    const cerrarEscape = (e) => e.key === 'Escape' && setAbierta(false)
    document.addEventListener('mousedown', cerrarAfuera)
    document.addEventListener('keydown', cerrarEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarAfuera)
      document.removeEventListener('keydown', cerrarEscape)
    }
  }, [abierta])

  const sinLeer = data?.sinLeer ?? 0
  const notificaciones = data?.notificaciones ?? []

  return (
    <div ref={contenedor} className="relative">
      <button
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        aria-label={sinLeer ? `Notificaciones: ${sinLeer} sin leer` : 'Notificaciones'}
        className="relative grid size-10 place-items-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-primario"
      >
        <Bell className="size-5" aria-hidden="true" />
        {sinLeer > 0 && (
          <span className="absolute right-1 top-1 grid min-w-4.5 place-items-center rounded-full bg-error px-1 text-[0.65rem] font-bold leading-4.5 text-white">
            {sinLeer > 9 ? '9+' : sinLeer}
          </span>
        )}
      </button>

      {abierta && (
        <div className="fixed inset-x-4 top-16 z-40 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-200 sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-96">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="font-semibold text-slate-900">Notificaciones</p>
            {sinLeer > 0 && (
              <button onClick={() => leer.mutate(null)} className="inline-flex items-center gap-1 text-xs font-medium text-secundario hover:underline">
                <CheckCheck className="size-3.5" aria-hidden="true" /> Marcar todas como leídas
              </button>
            )}
          </div>
          {notificaciones.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-slate-500">No tiene notificaciones.</p>
          ) : (
            <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
              {notificaciones.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => !n.leida && leer.mutate(n.id)}
                    className={`flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${n.leida ? '' : 'bg-secundario/5'}`}
                  >
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.leida ? 'bg-transparent' : 'bg-secundario'}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className={`block text-sm ${n.leida ? 'text-slate-700' : 'font-semibold text-slate-900'}`}>{n.titulo}</span>
                      <span className="block text-xs text-slate-500">{n.mensaje}</span>
                      <span className="mt-0.5 block text-[0.7rem] text-slate-400">
                        {formatoFecha.format(new Date(n.createdAt))}
                        {!n.leida && <span className="sr-only"> (sin leer)</span>}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
