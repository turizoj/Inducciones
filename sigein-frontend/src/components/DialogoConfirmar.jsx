import Modal from './Modal'
import Boton from './Boton'
import Alerta from './Alerta'

// Pide confirmación antes de una acción importante (inactivar, eliminar)
export default function DialogoConfirmar({ abierto, titulo, mensaje, textoConfirmar, peligro, cargando, error, onConfirmar, onCerrar }) {
  return (
    <Modal abierto={abierto} titulo={titulo} onCerrar={onCerrar} ancho="max-w-md">
      <div className="space-y-4">
        {error && <Alerta>{error}</Alerta>}
        <p className="text-sm text-slate-600">{mensaje}</p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Boton variante="secundario" onClick={onCerrar}>
            Cancelar
          </Boton>
          <Boton variante={peligro ? 'peligro' : 'primario'} cargando={cargando} onClick={onConfirmar}>
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </Modal>
  )
}
