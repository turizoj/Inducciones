import { CircleAlert, CircleCheck } from 'lucide-react'

const tipos = {
  error: { clases: 'border-error/30 bg-error/5 text-error', Icono: CircleAlert },
  exito: { clases: 'border-exito/30 bg-exito/5 text-exito', Icono: CircleCheck },
}

export default function Alerta({ tipo = 'error', children }) {
  const { clases, Icono } = tipos[tipo]
  return (
    <div role="alert" className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${clases}`}>
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}
