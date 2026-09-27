import { forwardRef, useId } from 'react'

// Campo de formulario con etiqueta y mensaje de error, compatible con react-hook-form
const CampoTexto = forwardRef(function CampoTexto({ etiqueta, error, icono: Icono, ...props }, ref) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <div className="relative">
        {Icono && (
          <Icono className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        )}
        <input
          id={id}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`w-full rounded-lg border bg-white py-2.5 pr-3 text-sm outline-none transition focus:border-secundario focus:ring-2 focus:ring-secundario/20 ${Icono ? 'pl-9' : 'pl-3'} ${error ? 'border-error' : 'border-slate-300'}`}
          {...props}
        />
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
})

export default CampoTexto
