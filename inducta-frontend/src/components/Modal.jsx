import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Ventana emergente accesible (cierra con Esc y mantiene el foco dentro)
export default function Modal({ abierto, titulo, onCerrar, children, ancho = 'max-w-lg' }) {
  const ref = useRef(null)

  useEffect(() => {
    const dialogo = ref.current
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      className={`m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] ${ancho} overflow-y-auto rounded-2xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/40`}
    >
      {abierto && (
        <>
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
            <button onClick={onCerrar} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Cerrar">
              <X className="size-5" />
            </button>
          </div>
          <div className="px-5 py-5">{children}</div>
        </>
      )}
    </dialog>
  )
}
