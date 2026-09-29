import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../../../components/Modal'
import CampoTexto from '../../../components/CampoTexto'
import CampoArea from '../../../components/CampoArea'
import Boton from '../../../components/Boton'
import Alerta from '../../../components/Alerta'
import { guardarPrograma } from '../../../api/programas'
import { mensajeDeError } from '../../../api/cliente'

const esquema = z.object({
  titulo: z.string().trim().min(3, 'Escriba el título del programa').max(150, 'Máximo 150 caracteres'),
  descripcion: z.string().trim().max(5000, 'Máximo 5.000 caracteres'),
  duracionHoras: z.coerce
    .number({ error: 'Escriba la duración en horas' })
    .int('Escriba un número entero de horas')
    .min(1, 'La duración mínima es 1 hora')
    .max(500, 'La duración máxima es 500 horas'),
  obligatorio: z.boolean(),
})

// HU-05: datos generales del programa. Si "programa" viene vacío, se crea uno nuevo en borrador
export default function FormularioPrograma({ programa, onCerrar, onGuardado }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: {
      titulo: programa?.titulo ?? '',
      descripcion: programa?.descripcion ?? '',
      duracionHoras: programa?.duracionHoras ?? '',
      obligatorio: programa?.obligatorio ?? true,
    },
  })

  const mutacion = useMutation({
    mutationFn: guardarPrograma,
    onSuccess: async (guardado) => {
      await queryClient.invalidateQueries()
      onGuardado(guardado)
    },
  })

  return (
    <Modal abierto titulo={programa ? 'Editar datos del programa' : 'Nuevo programa'} onCerrar={onCerrar}>
      <form onSubmit={handleSubmit((datos) => mutacion.mutate({ id: programa?.id, ...datos }))} className="space-y-4" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}
        <CampoTexto etiqueta="Título" placeholder="Ej.: Inducción general" error={errors.titulo?.message} {...register('titulo')} />
        <CampoArea
          etiqueta="Descripción (opcional)"
          placeholder="¿Qué aprenderá el colaborador en este programa?"
          error={errors.descripcion?.message}
          {...register('descripcion')}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            etiqueta="Duración (horas)"
            type="number"
            min="1"
            max="500"
            inputMode="numeric"
            error={errors.duracionHoras?.message}
            {...register('duracionHoras')}
          />
          <label className="flex items-center gap-2.5 self-end rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-700">
            <input type="checkbox" className="size-4 accent-primario" {...register('obligatorio')} />
            Programa obligatorio
          </label>
        </div>
        {!programa && (
          <p className="rounded-lg bg-secundario/5 px-3 py-2.5 text-xs text-slate-600">
            El programa se crea en estado <strong>Borrador</strong>. Después podrá agregar módulos y contenidos, y publicarlo.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            {programa ? 'Guardar cambios' : 'Crear y agregar módulos'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
