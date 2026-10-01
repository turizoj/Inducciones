import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BadgeCheck, CircleX, LoaderCircle, Search } from 'lucide-react'
import Logo from '../../components/Logo'
import Boton from '../../components/Boton'
import { verificarCertificado } from '../../api/evaluaciones'
import { mensajeDeError } from '../../api/cliente'
import { formatearFecha } from '../../utils/fechas'

// RF-20 / HU-12: página pública para verificar un certificado por su código (no pide sesión)
export default function VerificarCertificado() {
  const { codigo } = useParams()
  const navigate = useNavigate()
  const [texto, setTexto] = useState(codigo ?? '')
  const { data, isLoading, error } = useQuery({
    queryKey: ['verificar', codigo],
    queryFn: () => verificarCertificado(codigo),
    enabled: Boolean(codigo),
    retry: false,
  })

  function buscar(e) {
    e.preventDefault()
    const limpio = texto.trim().toUpperCase()
    if (limpio) navigate(`/verificar/${limpio}`)
  }

  return (
    <div className="min-h-screen bg-fondo px-4 py-10">
      <div className="mx-auto max-w-xl">
        <Link to="/login" aria-label="Ir al inicio de SIGEIN">
          <Logo />
        </Link>
        <h1 className="mt-8 text-2xl font-bold text-slate-900">Verificación de certificados</h1>
        <p className="mt-1 text-sm text-slate-500">Escriba el código que aparece en el certificado o escanee su código QR.</p>

        <form onSubmit={buscar} className="mt-6 flex flex-col gap-2 sm:flex-row" role="search">
          <label htmlFor="codigo" className="sr-only">
            Código de verificación
          </label>
          <input
            id="codigo"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="SIG-2026-XXXXXXXX"
            autoComplete="off"
            spellCheck="false"
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-mono text-sm uppercase outline-none focus:border-secundario focus:ring-2 focus:ring-secundario/20"
          />
          <Boton type="submit">
            <Search className="size-4" aria-hidden="true" /> Verificar
          </Boton>
        </form>

        <div className="mt-6" aria-live="polite">
          {isLoading && (
            <div className="flex justify-center py-10" role="status">
              <LoaderCircle className="size-7 animate-spin text-primario" aria-hidden="true" />
              <span className="sr-only">Verificando…</span>
            </div>
          )}
          {error && (
            <div className="flex items-start gap-3 rounded-xl border border-error/30 bg-error/5 p-5">
              <CircleX className="size-7 shrink-0 text-error" aria-hidden="true" />
              <div>
                <p className="font-semibold text-error">Certificado no encontrado</p>
                <p className="mt-1 text-sm text-slate-600">
                  {error.response?.status === 404
                    ? `No existe un certificado con el código ${codigo}. Revise que esté bien escrito.`
                    : mensajeDeError(error)}
                </p>
              </div>
            </div>
          )}
          {data && (
            <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-exito/40">
              <div className="flex items-center gap-3 bg-exito/10 px-5 py-4">
                <BadgeCheck className="size-8 shrink-0 text-exito" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-exito">Certificado válido</p>
                  <p className="text-xs text-slate-600">
                    {data.empresa === 'SIGEIN' ? 'Emitido a través de SIGEIN' : `Emitido por ${data.empresa} a través de SIGEIN`}
                  </p>
                </div>
              </div>
              <dl className="divide-y divide-slate-100 px-5">
                {[
                  ['Nombre', data.nombre],
                  ['Documento', data.documento],
                  ['Programa', data.programa],
                  ['Intensidad', `${data.horas} hora(s)`],
                  ['Fecha de emisión', formatearFecha(data.fechaEmision)],
                  ['Código', data.codigo],
                ].map(([t, v]) => (
                  <div key={t} className="grid grid-cols-3 gap-3 py-3 text-sm">
                    <dt className="text-slate-500">{t}</dt>
                    <dd className="col-span-2 break-words font-medium text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
