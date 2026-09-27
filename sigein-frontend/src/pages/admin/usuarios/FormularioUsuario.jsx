import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Modal from '../../../components/Modal'
import CampoTexto from '../../../components/CampoTexto'
import CampoSelect from '../../../components/CampoSelect'
import Boton from '../../../components/Boton'
import Alerta from '../../../components/Alerta'
import CargandoModal from '../../../components/CargandoModal'
import { guardarUsuario, listarAreas, listarCargos, listarRoles } from '../../../api/admin'
import { mensajeDeError } from '../../../api/cliente'
import { ROLES } from '../../../utils/roles'

// Mismas reglas que valida la API (HU-03)
function crearEsquema(idRolAdmin) {
  return z
    .object({
      documento: z
        .string()
        .trim()
        .regex(/^[A-Za-z0-9]{5,20}$/, 'Entre 5 y 20 letras o números, sin puntos ni espacios'),
      nombres: z.string().trim().min(2, 'Escriba los nombres').max(80, 'Máximo 80 caracteres'),
      apellidos: z.string().trim().min(2, 'Escriba los apellidos').max(80, 'Máximo 80 caracteres'),
      email: z.string().trim().min(1, 'Escriba el correo').email('Correo no válido'),
      telefono: z
        .string()
        .trim()
        .regex(/^(\+?[0-9 ]{7,20})?$/, 'Teléfono no válido'),
      fechaIngreso: z.string().min(1, 'Seleccione la fecha de ingreso'),
      rolId: z.string().min(1, 'Seleccione el rol'),
      areaId: z.string(),
      cargoId: z.string(),
    })
    .refine((d) => d.rolId === String(idRolAdmin) || d.cargoId, { message: 'Seleccione el cargo', path: ['cargoId'] })
}

// Fecha de hoy en formato AAAA-MM-DD según la hora local
function hoy() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function FormularioUsuario({ usuario, onCerrar, onGuardado }) {
  const titulo = usuario ? 'Editar usuario' : 'Nuevo usuario'
  const { data: roles } = useQuery({ queryKey: ['roles'], queryFn: listarRoles, staleTime: Infinity })
  const { data: areas } = useQuery({ queryKey: ['areas', {}], queryFn: () => listarAreas({}) })
  const { data: cargos } = useQuery({ queryKey: ['cargos', {}], queryFn: () => listarCargos({}) })

  // El formulario se muestra cuando ya están las opciones, para que queden seleccionadas al editar
  if (!roles || !areas || !cargos) return <CargandoModal titulo={titulo} onCerrar={onCerrar} />

  return (
    <Formulario usuario={usuario} titulo={titulo} roles={roles} areas={areas} cargos={cargos} onCerrar={onCerrar} onGuardado={onGuardado} />
  )
}

function Formulario({ usuario, titulo, roles, areas, cargos, onCerrar, onGuardado }) {
  const queryClient = useQueryClient()
  const idRolAdmin = roles.find((r) => r.nombre === ROLES.ADMIN)?.id

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(crearEsquema(idRolAdmin)),
    defaultValues: {
      documento: usuario?.documento ?? '',
      nombres: usuario?.nombres ?? '',
      apellidos: usuario?.apellidos ?? '',
      email: usuario?.email ?? '',
      telefono: usuario?.telefono ?? '',
      fechaIngreso: usuario?.fechaIngreso ?? hoy(),
      rolId: usuario ? String(usuario.rol.id) : '',
      areaId: usuario?.area ? String(usuario.area.id) : '',
      cargoId: usuario?.cargo ? String(usuario.cargo.id) : '',
    },
  })

  const esAdmin = useWatch({ control, name: 'rolId' }) === String(idRolAdmin)
  const areaId = useWatch({ control, name: 'areaId' })
  // Solo se ofrecen áreas y cargos activos, más los que el usuario ya tiene
  const opcionesArea = areas.filter((a) => a.estado === 'activo' || a.id === usuario?.area?.id)
  const opcionesCargo = cargos.filter(
    (c) => String(c.areaId) === areaId && ((c.estado === 'activo' && c.area.estado === 'activo') || c.id === usuario?.cargo?.id),
  )

  const mutacion = useMutation({
    mutationFn: guardarUsuario,
    onSuccess: async (guardado) => {
      await queryClient.invalidateQueries()
      onGuardado(
        usuario
          ? `Datos de ${guardado.nombres} ${guardado.apellidos} actualizados.`
          : `Usuario creado. Se envió un correo de bienvenida a ${guardado.email} para que cree su contraseña.`,
      )
    },
  })

  // El área solo sirve para filtrar los cargos; la API guarda el cargo
  function enviar(valores) {
    const datos = { ...valores }
    delete datos.areaId
    mutacion.mutate({ id: usuario?.id, ...datos })
  }

  return (
    <Modal abierto titulo={titulo} onCerrar={onCerrar} ancho="max-w-2xl">
      <form onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
        {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto etiqueta="Nombres" autoComplete="off" error={errors.nombres?.message} {...register('nombres')} />
          <CampoTexto etiqueta="Apellidos" autoComplete="off" error={errors.apellidos?.message} {...register('apellidos')} />
          <CampoTexto etiqueta="Documento" inputMode="numeric" error={errors.documento?.message} {...register('documento')} />
          <CampoTexto etiqueta="Correo electrónico" type="email" autoComplete="off" error={errors.email?.message} {...register('email')} />
          <CampoTexto etiqueta="Teléfono (opcional)" type="tel" error={errors.telefono?.message} {...register('telefono')} />
          <CampoTexto etiqueta="Fecha de ingreso" type="date" error={errors.fechaIngreso?.message} {...register('fechaIngreso')} />
          <CampoSelect etiqueta="Rol" error={errors.rolId?.message} {...register('rolId')}>
            <option value="">Seleccione…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.nombre}
              </option>
            ))}
          </CampoSelect>
          <div className="hidden sm:block" />
          <CampoSelect
            etiqueta={esAdmin ? 'Área (opcional)' : 'Área'}
            error={errors.areaId?.message}
            {...register('areaId', { onChange: () => setValue('cargoId', '') })}
          >
            <option value="">Seleccione…</option>
            {opcionesArea.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </CampoSelect>
          <CampoSelect etiqueta={esAdmin ? 'Cargo (opcional)' : 'Cargo'} error={errors.cargoId?.message} {...register('cargoId')}>
            <option value="">{areaId ? 'Seleccione…' : 'Primero elija el área'}</option>
            {opcionesCargo.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </CampoSelect>
        </div>
        {!usuario && (
          <p className="rounded-lg bg-secundario/5 px-3 py-2.5 text-xs text-slate-600">
            Al crear el usuario se le enviará un correo de bienvenida con un enlace para crear su contraseña.
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton type="submit" cargando={mutacion.isPending}>
            {usuario ? 'Guardar cambios' : 'Crear usuario'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}
