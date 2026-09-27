import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import AuthLayout from '../../layouts/AuthLayout'
import CampoTexto from '../../components/CampoTexto'
import Boton from '../../components/Boton'
import Alerta from '../../components/Alerta'
import { solicitarRecuperacion } from '../../api/auth'
import { mensajeDeError } from '../../api/cliente'

const esquema = z.object({
  email: z.string().trim().min(1, 'Escriba su correo').email('Correo no válido'),
})

// HU-02: solicitar el enlace para recuperar la contraseña
export default function RecuperarPassword() {
  const [resultado, setResultado] = useState(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(esquema) })

  async function enviar(datos) {
    try {
      const { mensaje } = await solicitarRecuperacion(datos)
      setResultado({ tipo: 'exito', mensaje })
    } catch (err) {
      setResultado({ tipo: 'error', mensaje: mensajeDeError(err) })
    }
  }

  return (
    <AuthLayout>
      <Link to="/login" className="mb-6 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primario">
        <ArrowLeft className="size-4" aria-hidden="true" /> Volver al inicio de sesión
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
      <p className="mt-1 text-sm text-slate-500">
        Escriba su correo y le enviaremos un enlace para crear una nueva contraseña. El enlace vence en 30 minutos.
      </p>

      <form onSubmit={handleSubmit(enviar)} className="mt-8 space-y-5" noValidate>
        {resultado && <Alerta tipo={resultado.tipo}>{resultado.mensaje}</Alerta>}
        <CampoTexto
          etiqueta="Correo electrónico"
          type="email"
          autoComplete="email"
          placeholder="nombre@empresa.com"
          icono={Mail}
          error={errors.email?.message}
          {...register('email')}
        />
        <Boton type="submit" cargando={isSubmitting} className="w-full">
          Enviar enlace
        </Boton>
      </form>
    </AuthLayout>
  )
}
