import { useState } from 'react'
import Alerta from '../../../components/Alerta'
import useAviso from '../../../hooks/useAviso'
import TablaAreas from './TablaAreas'
import TablaCargos from './TablaCargos'

const pestanas = [
  { id: 'areas', texto: 'Áreas' },
  { id: 'cargos', texto: 'Cargos' },
]

// HU-04: gestionar las áreas y los cargos de la empresa
export default function AreasCargos() {
  const [pestana, setPestana] = useState('areas')
  const [aviso, mostrarAviso] = useAviso()

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Áreas y cargos</h1>
      <p className="mt-1 text-sm text-slate-500">Estructura de la empresa. Cada cargo pertenece a una sola área.</p>

      <div className="mt-6 flex gap-1 border-b border-slate-200" role="tablist">
        {pestanas.map(({ id, texto }) => (
          <button
            key={id}
            role="tab"
            aria-selected={pestana === id}
            onClick={() => setPestana(id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${pestana === id ? 'border-primario text-primario' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {texto}
          </button>
        ))}
      </div>

      {aviso && (
        <div className="mt-4">
          <Alerta tipo="exito">{aviso}</Alerta>
        </div>
      )}

      <div className="mt-5">
        {pestana === 'areas' ? <TablaAreas mostrarAviso={mostrarAviso} /> : <TablaCargos mostrarAviso={mostrarAviso} />}
      </div>
    </div>
  )
}
