import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CircleAlert, CircleCheck, Download, FileSpreadsheet, FileText } from 'lucide-react'
import Modal from '../../../components/Modal'
import Boton from '../../../components/Boton'
import Alerta from '../../../components/Alerta'
import { importarUsuarios, listarCargos } from '../../../api/admin'
import { mensajeDeError } from '../../../api/cliente'

const COLUMNAS = ['documento', 'nombres', 'apellidos', 'email', 'telefono', 'fecha_ingreso', 'rol', 'area', 'cargo']

// Descarga una plantilla con punto y coma (así la abre bien Excel en español)
function descargarPlantilla(cargo) {
  const area = cargo?.area.nombre ?? 'Operaciones'
  const nombreCargo = cargo?.nombre ?? 'Operario'
  const filas = [
    COLUMNAS,
    ['1012345678', 'Ana María', 'Rojas Pérez', 'ana.rojas@empresa.com', '3001234567', '2026-10-01', 'Colaborador', area, nombreCargo],
  ]
  const texto = '﻿' + filas.map((f) => f.join(';')).join('\r\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }))
  enlace.download = 'plantilla_usuarios_sigein.csv'
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

// Excel puede guardar el CSV en UTF-8 o en el formato antiguo de Windows; se aceptan los dos
async function leerArchivo(archivo) {
  const bytes = await archivo.arrayBuffer()
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('windows-1252').decode(bytes)
  }
}

// HU-03: carga masiva de usuarios con resumen de filas cargadas y con error
export default function ImportarUsuarios({ onCerrar }) {
  const queryClient = useQueryClient()
  const [archivo, setArchivo] = useState(null)
  const { data: cargos = [] } = useQuery({ queryKey: ['cargos', { estado: 'activo' }], queryFn: () => listarCargos({ estado: 'activo' }) })

  const mutacion = useMutation({
    mutationFn: async (a) => importarUsuarios(await leerArchivo(a)),
    onSuccess: () => queryClient.invalidateQueries(),
  })
  const resultado = mutacion.data

  function elegir(e) {
    mutacion.reset()
    setArchivo(e.target.files[0] ?? null)
  }

  function otroArchivo() {
    mutacion.reset()
    setArchivo(null)
  }

  return (
    <Modal abierto titulo="Cargar usuarios desde CSV" onCerrar={onCerrar} ancho="max-w-2xl">
      {resultado ? (
        <Resumen resultado={resultado} onOtro={otroArchivo} onCerrar={onCerrar} />
      ) : (
        <div className="space-y-5">
          <ol className="space-y-2 text-sm text-slate-600">
            <li>
              <strong className="text-slate-800">1.</strong> Descargue la plantilla y ábrala en Excel.
            </li>
            <li>
              <strong className="text-slate-800">2.</strong> Escriba un usuario por fila. El área y el cargo deben existir en el sistema.
              La fecha puede ir como <code>2026-10-01</code> o <code>01/10/2026</code>.
            </li>
            <li>
              <strong className="text-slate-800">3.</strong> Guárdela como <em>CSV</em> y súbala aquí. Cada usuario recibirá un correo
              de bienvenida.
            </li>
          </ol>

          <Boton variante="secundario" type="button" onClick={() => descargarPlantilla(cargos[0])}>
            <Download className="size-4" aria-hidden="true" /> Descargar plantilla
          </Boton>

          <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center transition-colors hover:border-secundario hover:bg-secundario/5">
            {archivo ? (
              <>
                <FileText className="size-8 text-secundario" aria-hidden="true" />
                <span className="mt-2 break-all text-sm font-medium text-slate-800">{archivo.name}</span>
                <span className="text-xs text-slate-500">Clic para elegir otro archivo</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="size-8 text-slate-400" aria-hidden="true" />
                <span className="mt-2 text-sm font-medium text-slate-700">Clic para elegir el archivo CSV</span>
                <span className="text-xs text-slate-500">Máximo 1.000 filas</span>
              </>
            )}
            <input type="file" accept=".csv,text/csv" className="sr-only" onChange={elegir} />
          </label>

          {mutacion.error && <Alerta>{mensajeDeError(mutacion.error)}</Alerta>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Boton type="button" variante="secundario" onClick={onCerrar}>
              Cancelar
            </Boton>
            <Boton type="button" disabled={!archivo} cargando={mutacion.isPending} onClick={() => mutacion.mutate(archivo)}>
              Cargar usuarios
            </Boton>
          </div>
        </div>
      )}
    </Modal>
  )
}

function Resumen({ resultado, onOtro, onCerrar }) {
  const { totalFilas, cargados, errores } = resultado
  const cifras = [
    { texto: 'Filas en el archivo', valor: totalFilas, clases: 'text-slate-900' },
    { texto: 'Cargadas', valor: cargados, clases: 'text-exito' },
    { texto: 'Con error', valor: errores.length, clases: errores.length ? 'text-error' : 'text-slate-900' },
  ]

  return (
    <div className="space-y-5">
      {errores.length === 0 ? (
        <Alerta tipo="exito">Se cargaron todos los usuarios. Cada uno recibió su correo de bienvenida.</Alerta>
      ) : (
        <Alerta>
          {cargados ? `Se cargaron ${cargados} usuario(s). ` : 'No se cargó ningún usuario. '}
          Corrija las filas con error en el archivo y súbalo de nuevo (las filas ya cargadas aparecerán como repetidas).
        </Alerta>
      )}

      <div className="grid grid-cols-3 gap-3">
        {cifras.map(({ texto, valor, clases }) => (
          <div key={texto} className="rounded-xl bg-slate-50 p-3 text-center ring-1 ring-slate-200">
            <p className={`text-2xl font-bold ${clases}`}>{valor}</p>
            <p className="text-xs text-slate-500">{texto}</p>
          </div>
        ))}
      </div>

      {errores.length > 0 && (
        <div className="max-h-72 overflow-y-auto rounded-xl ring-1 ring-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-3 py-2">Fila</th>
                <th scope="col" className="px-3 py-2">Documento</th>
                <th scope="col" className="px-3 py-2">Problema</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {errores.map((e) => (
                <tr key={e.fila} className="align-top">
                  <td className="px-3 py-2 font-medium text-slate-700">{e.fila}</td>
                  <td className="px-3 py-2 text-slate-600">{e.documento || '—'}</td>
                  <td className="px-3 py-2">
                    <ul className="space-y-0.5">
                      {e.errores.map((m) => (
                        <li key={m} className="flex gap-1.5 text-error">
                          <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Boton type="button" variante="secundario" onClick={onOtro}>
          Cargar otro archivo
        </Boton>
        <Boton type="button" onClick={onCerrar}>
          <CircleCheck className="size-4" aria-hidden="true" /> Listo
        </Boton>
      </div>
    </div>
  )
}
