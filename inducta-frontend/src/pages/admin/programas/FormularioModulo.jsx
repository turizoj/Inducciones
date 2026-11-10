import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../../../components/Modal'
import CampoTexto from '../../../components/CampoTexto'
import CampoArea from '../../../components/CampoArea'
import Boton from '../../../components/Boton'
import Alerta from '../../../components/Alerta'
import { guardarModulo } from '../../../api/programas'
import { mensajeDeError } from '../../../api/cliente'

const esquema = z.object({
  titulo: z.string().trim().min(2, 'Escriba el título del módulo').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().trim().max(2000, 'Máximo 2.000 caracteres'),
})

// Crear o editar un módulo. Si "modulo" viene vacío, se agrega al final del programa
export default function FormularioModulo({ programaId, modulo, onCerrar, onGuardado }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { titulo: modulo?.titulo ?? '', descripcion: modulo?.descripcion ?? '' },
  })

  const mutacion = useMutation({
    mutationFn: guardarModulo,
    onSuccess: async (guardado) => {
      await queryClient.invalidateQueries()
      onGuardado(guardado)
    },
  })

  return (
    <Modal abierto titulo={modulo ? 'Editar módulo' : 'Nuevo módulo'} onCerrar={onCerrar}>
      <form onSubmit={handleSubmit((datos) => mutacion.mutate({ id: modulo?.id, programaId, ...datos }))} className="space-y-4" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}
        <CampoTexto etiqueta="Título del módulo" placeholder="Ej.: Conoce la empresa" error={errors.titulo?.message} {...register('titulo')} />
        <CampoArea etiqueta="Descripción (opcional)" error={errors.descripcion?.message} {...register('descripcion')} />
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            {modulo ? 'Guardar cambios' : 'Agregar módulo'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
