import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import Boton from '../../components/Boton'
import Alerta from '../../components/Alerta'
import Logo from '../../components/Logo'
import useAuth from '../../hooks/useAuth'
import { mensajeDeError } from '../../api/cliente'
import { rutaInicioPorRol } from '../../utils/roles'

// RNF-13: aceptación de la política de tratamiento de datos personales (Ley 1581 de 2012) en el primer ingreso
export default function PoliticaDatos() {
  const { usuario, aceptarPoliticaDatos, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [acepta, setAcepta] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState('')

  if (usuario.aceptaDatosAt) return <Navigate to={rutaInicioPorRol(usuario.rol)} replace />

  async function aceptar() {
    setEnviando(true)
    setError('')
    try {
      await aceptarPoliticaDatos()
      navigate(rutaInicioPorRol(usuario.rol), { replace: true })
    } catch (err) {
      setError(mensajeDeError(err))
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10">
        <Logo />
        <div className="mt-8 flex items-center gap-3">
          <ShieldCheck className="size-7 text-primario" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-900">Tratamiento de datos personales</h1>
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Hola, {usuario.nombres}. Antes de continuar, lea y acepte la política de tratamiento de datos.
        </p>

        <div className="mt-6 max-h-72 space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-fondo p-4 text-sm leading-relaxed text-slate-600">
          <p>
            En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, la empresa informa que los datos personales
            registrados en SIGEIN (nombre, documento, correo, teléfono, área, cargo, avance, notas y certificados) se usan
            únicamente para gestionar su proceso de inducción y dejar evidencia de su cumplimiento ante los entes de control.
          </p>
          <p>
            Solo se recogen los datos necesarios para esa finalidad. Las contraseñas se guardan cifradas y cada usuario
            accede solo a la información que corresponde a su rol.
          </p>
          <p>
            Como titular, usted tiene derecho a conocer, actualizar y rectificar sus datos desde su perfil, y a presentar
            consultas o reclamos ante el área de Talento Humano.
          </p>
        </div>

        {error && (
          <div className="mt-4">
            <Alerta>{error}</Alerta>
          </div>
        )}

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-0.5 size-4 accent-primario"
          />
          He leído y acepto la política de tratamiento de datos personales.
        </label>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton variante="secundario" onClick={cerrarSesion}>
            Salir
          </Boton>
          <Boton onClick={aceptar} disabled={!acepta} cargando={enviando}>
            Aceptar y continuar
          </Boton>
        </div>
      </div>
    </div>
  )
}
