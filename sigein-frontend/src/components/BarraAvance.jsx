// Barra del porcentaje de avance de una inducción
// compacta: solo el porcentaje, para tablas donde el encabezado ya dice «Avance»
export default function BarraAvance({ porcentaje, completada = false, etiqueta = 'Avance', compacta = false }) {
  const valor = Math.round(porcentaje)
  return (
    <div className="min-w-0">
      <div className={`mb-1 flex text-xs ${compacta ? 'justify-end' : 'justify-between'}`}>
        {!compacta && <span className="text-slate-500">{etiqueta}</span>}
        <span className="font-semibold tabular-nums text-slate-800">{valor}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100" role="progressbar" aria-valuenow={valor} aria-valuemin={0} aria-valuemax={100} aria-label={etiqueta}>
        <div
          className={`h-2 rounded-full transition-all ${completada ? 'bg-exito' : 'bg-secundario'}`}
          style={{ width: `${Math.max(valor, valor > 0 ? 3 : 0)}%` }}
        />
      </div>
    </div>
  )
}
