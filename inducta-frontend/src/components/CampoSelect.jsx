import { forwardRef, useId } from 'react'

// Lista desplegable con etiqueta y mensaje de error, compatible con react-hook-form
const CampoSelect = forwardRef(function CampoSelect({ etiqueta, error, children, ...props }, ref) {
  const id = useId()
  return (
    <div>
      {etiqueta && (
        <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
          {etiqueta}
        </label>
      )}
      <select
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:border-secundario focus:ring-2 focus:ring-secundario/20 disabled:bg-slate-50 disabled:text-slate-400 ${error ? 'border-error' : 'border-slate-300'}`}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-error">
          {error}
        </p>
      )}
    </div>
  )
})

export default CampoSelect
