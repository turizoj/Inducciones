import { LoaderCircle } from 'lucide-react'

export default function PantallaCarga() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status">
      <LoaderCircle className="size-8 animate-spin text-primario" aria-hidden="true" />
      <span className="sr-only">Cargando…</span>
    </div>
  )
}
