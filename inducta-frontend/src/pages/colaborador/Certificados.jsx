import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Award, Check, Download, ExternalLink, Link2, LoaderCircle } from 'lucide-react'
import Alerta from '../../components/Alerta'
import Boton from '../../components/Boton'
import useAuth from '../../hooks/useAuth'
import { descargarCertificado, listarCertificados } from '../../api/evaluaciones'
import { mensajeDeError } from '../../api/cliente'
import { formatearFecha } from '../../utils/fechas'

// HU-12: certificados del colaborador (wireframe 19.2.8)
export default function Certificados() {
  const { data: certificados = [], isLoading, error } = useQuery({ queryKey: ['certificados'], queryFn: listarCertificados })

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Mis certificados</h1>
      <p className="mt-1 text-sm text-slate-500">Constancias de las inducciones que ha completado. Cada una tiene un código que cualquiera puede verificar.</p>

      {isLoading ? (
        <div className="flex justify-center py-16" role="status">
          <LoaderCircle className="size-8 animate-spin text-primario" aria-hidden="true" />
          <span className="sr-only">Cargando…</span>
        </div>
      ) : error ? (
        <div className="mt-6">
          <Alerta>{mensajeDeError(error)}</Alerta>
        </div>
      ) : certificados.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <Award className="size-10 text-slate-300" aria-hidden="true" />
          <p className="mt-4 font-semibold text-slate-700">Aún no tiene certificados</p>
          <p className="mt-1 max-w-sm text-sm text-slate-500">
            Cuando complete una inducción y apruebe sus evaluaciones, su certificado aparecerá aquí.
          </p>
          <Link to="/mis-inducciones" className="mt-4 text-sm font-medium text-secundario hover:underline">
            Ir a mis inducciones
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {certificados.map((c) => (
            <li key={c.id}>
              <TarjetaCertificado certificado={c} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TarjetaCertificado({ certificado: c }) {
  const { usuario } = useAuth()
  const [copiado, setCopiado] = useState(false)
  const descargar = useMutation({ mutationFn: descargarCertificado })

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(c.urlVerificacion)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      window.prompt('Copie el enlace de verificación:', c.urlVerificacion)
    }
  }

  return (
    <article className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
      {/* Vista previa del certificado */}
      <div className="border-b border-slate-200 bg-slate-50 p-4">
        <div className="rounded-lg border-2 border-primario bg-white px-4 py-5 text-center shadow-[inset_0_0_0_4px_white,inset_0_0_0_5px_rgb(46_117_182/0.4)]">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-secundario">Certificado de inducción</p>
          <p className="mt-2 text-xs text-slate-500">Se certifica que</p>
          <p className="text-lg font-bold text-slate-900">
            {usuario.nombres} {usuario.apellidos}
          </p>
          <p className="mt-1 text-xs text-slate-500">completó el programa</p>
          <p className="font-semibold text-primario">«{c.programa.titulo}»</p>
          <p className="mt-1 text-xs text-slate-500">
            {c.programa.duracionHoras} hora(s) · {formatearFecha(c.fechaEmision)}
          </p>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs text-slate-500">Código de verificación</p>
        <p className="font-mono text-sm font-semibold text-slate-900">{c.codigo}</p>
        {descargar.error && (
          <div className="mt-3">
            <Alerta>No fue posible generar el PDF. Intente de nuevo en unos minutos.</Alerta>
          </div>
        )}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Boton cargando={descargar.isPending} onClick={() => descargar.mutate({ id: c.id, codigo: c.codigo })}>
            <Download className="size-4" aria-hidden="true" /> Descargar PDF
          </Boton>
          <Boton variante="secundario" onClick={copiarEnlace}>
            {copiado ? <Check className="size-4 text-exito" aria-hidden="true" /> : <Link2 className="size-4" aria-hidden="true" />}
            {copiado ? 'Enlace copiado' : 'Copiar enlace para compartir'}
          </Boton>
          <a
            href={c.urlVerificacion}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-2 py-2.5 text-sm font-medium text-secundario hover:underline"
          >
            Ver verificación <ExternalLink className="size-3.5" aria-hidden="true" />
            <span className="sr-only">(se abre en otra pestaña)</span>
          </a>
        </div>
      </div>
    </article>
  )
}
