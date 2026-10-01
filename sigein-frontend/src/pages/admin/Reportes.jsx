import ReporteCumplimiento from '../reportes/ReporteCumplimiento'

// HU-14: reportes de cumplimiento por área, programa y fecha, exportables a Excel y PDF
export default function Reportes() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Reportes de cumplimiento</h1>
      <p className="mt-1 text-sm text-slate-500">
        Combine los filtros y exporte el resultado a Excel o PDF como evidencia para las auditorías del SG-SST.
      </p>
      <div className="mt-6">
        <ReporteCumplimiento />
      </div>
    </div>
  )
}
