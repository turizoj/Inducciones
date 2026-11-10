import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../../components/Modal'
import CampoTexto from '../../components/CampoTexto'
import Boton from '../../components/Boton'
import Alerta from '../../components/Alerta'
import { cambiarFechaAsignacion } from '../../api/asignaciones'
import { mensajeDeError } from '../../api/cliente'
import { fechaTexto } from '../../utils/fechas'

// Ampliar o cambiar la fecha límite de una asignación (por ejemplo, una vencida)
export default function CambiarFecha({ asignacion, onCerrar, onGuardado }) {
  const queryClient = useQueryClient()
  const minimo = fechaTexto()
  const actual = asignacion.fechaLimite.slice(0, 10)
  const [fecha, setFecha] = useState(actual < minimo ? fechaTexto(15) : actual)
  const [error, setError] = useState('')

  const mutacion = useMutation({
    mutationFn: cambiarFechaAsignacion,
    onSuccess: async () => {
      await queryClient.invalidateQueries()
      onGuardado()
    },
  })

  function enviar(e) {
    e.preventDefault()
    if (!fecha || fecha < minimo) return setError('La fecha límite no puede ser anterior a hoy')
    mutacion.mutate({ id: asignacion.id, fechaLimite: fecha })
  }

  return (
    <Modal abierto titulo="Cambiar fecha límite" onCerrar={onCerrar} ancho="max-w-md">
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}
        <p className="text-sm text-slate-600">
          <strong className="text-slate-800">{asignacion.usuario.nombre}</strong> · {asignacion.programa.titulo}
        </p>
        <CampoTexto
          etiqueta="Nueva fecha límite"
          type="date"
          min={minimo}
          value={fecha}
          onChange={(e) => {
            setFecha(e.target.value)
            setError('')
          }}
          error={error}
        />
        {asignacion.estado === 'vencida' && (
          <p className="text-xs text-slate-500">Al guardar una fecha vigente, la inducción deja de aparecer como vencida.</p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            Guardar fecha
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
