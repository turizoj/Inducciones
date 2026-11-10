import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import Modal from '../../../components/Modal'
import CampoTexto from '../../../components/CampoTexto'
import CampoSelect from '../../../components/CampoSelect'
import Boton from '../../../components/Boton'
import Alerta from '../../../components/Alerta'
import { guardarCargo } from '../../../api/admin'
import { mensajeDeError } from '../../../api/cliente'

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Escriba el nombre del cargo').max(80, 'Máximo 80 caracteres'),
  areaId: z.string().min(1, 'Seleccione el área'),
})

// Crear o editar un cargo. HU-04: cada cargo pertenece a una sola área
export default function FormularioCargo({ cargo, areas, areaInicial, onCerrar, onGuardado }) {
  const queryClient = useQueryClient()
  // Solo se ofrecen áreas activas, más la actual del cargo si está inactiva
  const opciones = areas.filter((a) => a.estado === 'activo' || a.id === cargo?.areaId)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: { nombre: cargo?.nombre ?? '', areaId: String(cargo?.areaId ?? areaInicial ?? '') },
  })

  const mutacion = useMutation({
    mutationFn: guardarCargo,
    onSuccess: async (guardado) => {
      await queryClient.invalidateQueries()
      onGuardado(cargo ? `Cargo "${guardado.nombre}" actualizado.` : `Cargo "${guardado.nombre}" creado en ${guardado.area.nombre}.`)
    },
  })

  return (
    <Modal abierto titulo={cargo ? 'Editar cargo' : 'Nuevo cargo'} onCerrar={onCerrar}>
      <form onSubmit={handleSubmit((datos) => mutacion.mutate({ id: cargo?.id, ...datos }))} className="space-y-4" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}
        {opciones.length === 0 && <Alerta>Primero debe crear un área activa.</Alerta>}
        <CampoTexto etiqueta="Nombre del cargo" placeholder="Ej.: Operario de planta" error={errors.nombre?.message} {...register('nombre')} />
        <CampoSelect etiqueta="Área" error={errors.areaId?.message} {...register('areaId')}>
          <option value="">Seleccione…</option>
          {opciones.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nombre}
            </option>
          ))}
        </CampoSelect>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            {cargo ? 'Guardar cambios' : 'Crear cargo'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
