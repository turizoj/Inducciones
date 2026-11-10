import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout'
import CampoTexto from '../../components/CampoTexto'
import Boton from '../../components/Boton'
import Alerta from '../../components/Alerta'
import useAuth from '../../hooks/useAuth'
import { mensajeDeError } from '../../api/cliente'
import { rutaInicioPorRol } from '../../utils/roles'

const esquema = z.object({
  email: z.string().trim().min(1, 'Escriba su correo').email('Correo no válido'),
  password: z.string().min(1, 'Escriba su contraseña'),
})

// HU-01: iniciar sesión con correo y contraseña
export default function Login() {
  const { usuario, iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(esquema) })

  if (usuario) return <Navigate to={rutaInicioPorRol(usuario.rol)} replace />

  async function enviar(datos) {
    setError('')
    try {
      const u = await iniciarSesion(datos)
      navigate(location.state?.desde || rutaInicioPorRol(u.rol), { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-slate-900">Iniciar sesión</h1>
      <p className="mt-1 text-sm text-slate-500">Ingrese con el correo corporativo que le entregó Talento Humano.</p>

      <form onSubmit={handleSubmit(enviar)} className="mt-8 space-y-5" noValidate>
        {error && <Alerta>{error}</Alerta>}
        <CampoTexto
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          icono={Mail}
          error={errors.email?.message}
          {...register('email')}
        />
        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icono={Lock}
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="flex justify-end">
          <Link to="/recuperar" className="text-sm font-medium text-secundario hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Boton type="submit" cargando={isSubmitting} className="w-full">
          Iniciar sesión
        </Boton>
      </form>

      <p className="mt-8 border-t border-slate-200 pt-5 text-center text-sm text-slate-500">
        ¿Recibió un certificado?{' '}
        <Link to="/verificar" className="font-medium text-secundario hover:underline">
          Verifíquelo aquí
        </Link>
      </p>
    </AuthLayout>
  )
}
