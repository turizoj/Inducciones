import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { Lock } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout'
import CampoTexto from '../../components/CampoTexto'
import Boton from '../../components/Boton'
import Alerta from '../../components/Alerta'
import { restablecerPassword } from '../../api/auth'
import { mensajeDeError } from '../../api/cliente'

// HU-02: mínimo 8 caracteres, una mayúscula y un número
const esquema = z
  .object({
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe tener al menos un número'),
    confirmacion: z.string(),
  })
  .refine((d) => d.password === d.confirmacion, { message: 'Las contraseñas no coinciden', path: ['confirmacion'] })

export default function RestablecerPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  // HU-03: el correo de bienvenida usa esta misma pantalla para crear la primera contraseña
  const bienvenida = params.get('bienvenida') === '1'
  const [resultado, setResultado] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(esquema) })

  async function enviar({ password }) {
    try {
      const { mensaje } = await restablecerPassword({ token, password })
      setResultado({ tipo: 'exito', mensaje })
    } catch (err) {
      setResultado({ tipo: 'error', mensaje: mensajeDeError(err) })
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-slate-900">{bienvenida ? 'Crea tu contraseña' : 'Nueva contraseña'}</h1>
      <p className="mt-1 text-sm text-slate-500">Debe tener mínimo 8 caracteres, una mayúscula y un número.</p>

      {!token ? (
        <div className="mt-8">
          <Alerta>El enlace no es válido. Solicite uno nuevo.</Alerta>
        </div>
      ) : resultado?.tipo === 'exito' ? (
        <div className="mt-8 space-y-5">
          <Alerta tipo="exito">{resultado.mensaje}</Alerta>
          <Link to="/login" className="block text-center text-sm font-semibold text-secundario hover:underline">
            Ir a iniciar sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(enviar)} className="mt-8 space-y-5" noValidate>
          {resultado && <Alerta tipo={resultado.tipo}>{resultado.mensaje}</Alerta>}
          <CampoTexto
            etiqueta="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            icono={Lock}
            error={errors.password?.message}
            {...register('password')}
          />
          <CampoTexto
            etiqueta="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            icono={Lock}
            error={errors.confirmacion?.message}
            {...register('confirmacion')}
          />
          <Boton type="submit" cargando={isSubmitting} className="w-full">
            Guardar contraseña
          </Boton>
        </form>
      )}

      {!token && (
        <Link to="/recuperar" className="mt-5 block text-center text-sm font-semibold text-secundario hover:underline">
          Solicitar un nuevo enlace
        </Link>
      )}
    </AuthLayout>
  )
}
