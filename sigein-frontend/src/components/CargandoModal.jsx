import { LoaderCircle } from 'lucide-react'
import Modal from './Modal'

// Ventana emergente mientras se cargan las opciones de un formulario
export default function CargandoModal({ titulo, onCerrar }) {
  return (
    <Modal abierto titulo={titulo} onCerrar={onCerrar}>
      <div className="flex justify-center py-10" role="status">
        <LoaderCircle className="size-6 animate-spin text-primario" aria-hidden="true" />
        <span className="sr-only">Cargando…</span>
      </div>
    </Modal>
  )
}
