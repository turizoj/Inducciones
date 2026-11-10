import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { mensajeDeError } from '../api/cliente'

// Maneja el diálogo de confirmación: pedir({ titulo, mensaje, textoConfirmar, peligro, ejecutar })
// y pasar "dialogo" al componente DialogoConfirmar
export default function useConfirmacion() {
  const [accion, setAccion] = useState(null)
  const mutacion = useMutation({
    mutationFn: () => accion.ejecutar(),
    onSuccess: () => setAccion(null),
  })

  function pedir(nueva) {
    mutacion.reset()
    setAccion(nueva)
  }

  return {
    pedir,
    dialogo: {
      titulo: accion?.titulo,
      mensaje: accion?.mensaje,
      textoConfirmar: accion?.textoConfirmar,
      peligro: accion?.peligro,
      abierto: Boolean(accion),
      cargando: mutacion.isPending,
      error: mutacion.error ? mensajeDeError(mutacion.error) : null,
      onConfirmar: () => mutacion.mutate(),
      onCerrar: () => setAccion(null),
    },
  }
}
