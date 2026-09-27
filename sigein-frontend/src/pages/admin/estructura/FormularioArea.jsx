import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from '../../../components/Modal'
import CampoTexto from '../../../components/CampoTexto'
import CampoSelect from '../../../components/CampoSelect'
import Boton from '../../../components/Boton'
import Alerta from '../../../components/Alerta'
import CargandoModal from '../../../components/CargandoModal'
import { guardarArea, listarRoles, listarUsuarios } from '../../../api/admin'
import { mensajeDeError } from '../../../api/cliente'
import { ROLES } from '../../../utils/roles'

const esquema = z.object({
  nombre: z.string().trim().min(2, 'Escriba el nombre del área').max(80, 'Máximo 80 caracteres'),
  descripcion: z.string().trim().max(255, 'Máximo 255 caracteres'),
  jefeId: z.string(),
})

// Crear o editar un área. Si "area" viene vacío, se crea una nueva
export default function FormularioArea({ area, onCerrar, onGuardado }) {
  const titulo = area ? 'Editar área' : 'Nueva área'
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: listarRoles, staleTime: Infinity })
  const rolJefe = roles?.find((r) => r.nombre === ROLES.JEFE)
  const filtroJefes = { rolId: rolJefe?.id, estado: 'activo', porPagina: 50 }
  const { data: jefes } = useQuery({
    queryKey: ['usuarios', filtroJefes],
    queryFn: () => listarUsuarios(filtroJefes),
    enabled: Boolean(rolJefe),
  })

  // El formulario se muestra cuando ya están las opciones, para que el jefe actual quede seleccionado
  if (!jefes) return <CargandoModal titulo={titulo} onCerrar={onCerrar} />

  // Si el jefe actual ya no está activo, se muestra igual para no perderlo al guardar
  const opcionesJefe = [...jefes.datos]
  if (area?.jefe && !opcionesJefe.some((j) => j.id === area.jefe.id)) opcionesJefe.push(area.jefe)

  return <Formulario area={area} titulo={titulo} opcionesJefe={opcionesJefe} onCerrar={onCerrar} onGuardado={onGuardado} />
}

function Formulario({ area, titulo, opcionesJefe, onCerrar, onGuardado }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(esquema),
    defaultValues: {
      nombre: area?.nombre ?? '',
      descripcion: area?.descripcion ?? '',
      jefeId: area?.jefeId ? String(area.jefeId) : '',
    },
  })

  const mutacion = useMutation({
    mutationFn: guardarArea,
    onSuccess: async (guardada) => {
      await queryClient.invalidateQueries()
      onGuardado(area ? `Área "${guardada.nombre}" actualizada.` : `Área "${guardada.nombre}" creada.`)
    },
  })

  return (
    <Modal abierto titulo={titulo} onCerrar={onCerrar}>
      <form onSubmit={handleSubmit((datos) => mutacion.mutate({ id: area?.id, ...datos }))} className="space-y-4" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}
        <CampoTexto etiqueta="Nombre del área" placeholder="Ej.: Operaciones" error={errors.nombre?.message} {...register('nombre')} />
        <CampoTexto etiqueta="Descripción (opcional)" error={errors.descripcion?.message} {...register('descripcion')} />
        <div>
          <CampoSelect etiqueta="Jefe del área (opcional)" error={errors.jefeId?.message} {...register('jefeId')}>
            <option value="">Sin asignar</option>
            {opcionesJefe.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nombres} {j.apellidos}
              </option>
            ))}
          </CampoSelect>
          <p className="mt-1 text-xs text-slate-500">Solo aparecen los usuarios activos con rol "{ROLES.JEFE}".</p>
        </div>
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            {area ? 'Guardar cambios' : 'Crear área'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
