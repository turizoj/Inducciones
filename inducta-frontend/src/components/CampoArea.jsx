import { forwardRef, useId } from 'react'

// Campo de texto de varias líneas, compatible con react-hook-form
const CampoArea = forwardRef(function CampoArea({ etiqueta, error, filas = 3, ...props }, ref) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      <textarea
        id={id}
        ref={ref}
        rows={filas}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-secundario focus:ring-2 focus:ring-secundario/20 ${error ? 'border-error' : 'border-slate-300'}`}
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
})

export default CampoArea
