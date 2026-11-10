import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Alerta from '../../../components/Alerta'
import Boton from '../../../components/Boton'
import BotonIcono from '../../../components/BotonIcono'
import Buscador from '../../../components/Buscador'
import CampoSelect from '../../../components/CampoSelect'
import DialogoConfirmar from '../../../components/DialogoConfirmar'
import EtiquetaPrograma from '../../../components/EtiquetaPrograma'
import MiniaturaPrograma from '../../../components/MiniaturaPrograma'
import Tabla from '../../../components/Tabla'
import useAviso from '../../../hooks/useAviso'
import useConfirmacion from '../../../hooks/useConfirmacion'
import useRetraso from '../../../hooks/useRetraso'
import { eliminarPrograma, listarProgramas } from '../../../api/programas'
import FormularioPrograma from './FormularioPrograma'

const encabezados = [
  { texto: 'Programa' },
  { texto: 'Módulos', clases: 'hidden md:table-cell text-center' },
  { texto: 'Duración', clases: 'hidden md:table-cell text-center' },
  { texto: 'Estado', clases: 'hidden sm:table-cell' },
  { texto: 'Acciones', clases: 'text-right' },
]

// HU-05: listado de programas de inducción (wireframe 19.2.3)
export default function Programas() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [aviso, mostrarAviso] = useAviso()
  const [buscar, setBuscar] = useState('')
  const [estado, setEstado] = useState('')
  const filtros = { buscar: useRetraso(buscar), estado }
  const { data: programas = [], isLoading, error } = useQuery({
    queryKey: ['programas', filtros],
    queryFn: () => listarProgramas(filtros),
    placeholderData: keepPreviousData,
  })
  const [creando, setCreando] = useState(false)
  const { pedir, dialogo } = useConfirmacion()

  function eliminar(programa) {
    pedir({
      titulo: 'Eliminar programa',
      mensaje: `¿Desea eliminar "${programa.titulo}" con sus ${programa.totalModulos} módulo(s) y ${programa.totalContenidos} contenido(s)? Esta acción no se puede deshacer.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
      ejecutar: async () => {
        await eliminarPrograma(programa.id)
        await queryClient.invalidateQueries()
        mostrarAviso(`Programa "${programa.titulo}" eliminado.`)
      },
    })
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Programas de inducción</h1>
          <p className="mt-1 text-sm text-slate-500">Organice la información que recibirán los colaboradores en módulos y contenidos.</p>
        </div>
        <Boton onClick={() => setCreando(true)}>
          <Plus className="size-4" aria-hidden="true" /> Nuevo programa
        </Boton>
      </div>

      {aviso && (
        <div className="mt-4">
          <Alerta tipo="exito">{aviso}</Alerta>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <Buscador valor={buscar} onCambiar={setBuscar} placeholder="Buscar programa…" />
        </div>
        <div className="sm:w-48">
          <CampoSelect aria-label="Filtrar por estado" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            <option value="borrador">Borrador</option>
            <option value="publicado">Publicado</option>
            <option value="archivado">Archivado</option>
          </CampoSelect>
        </div>
      </div>

      <div className="mt-4">
        <Tabla
          encabezados={encabezados}
          cargando={isLoading}
          error={error}
          vacio={programas.length === 0}
          mensajeVacio={buscar || estado ? 'No se encontraron programas con esos filtros.' : 'Aún no hay programas. Cree el primero con "Nuevo programa".'}
        >
          {programas.map((p) => (
            <tr key={p.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <Link to={`/admin/programas/${p.id}`} className="group flex items-center gap-3">
                  <MiniaturaPrograma programa={p} />
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 group-hover:text-secundario group-hover:underline">{p.titulo}</p>
                    {p.descripcion && <p className="line-clamp-1 text-xs text-slate-500">{p.descripcion}</p>}
                    <p className="mt-0.5 text-xs text-slate-500 md:hidden">
                      {p.totalModulos} módulo(s) · {p.duracionHoras} h
                    </p>
                    <div className="mt-1 sm:hidden">
                      <EtiquetaPrograma estado={p.estado} />
                    </div>
                  </div>
                </Link>
              </td>
              <td className="hidden px-4 py-3 text-center text-slate-600 md:table-cell">
                {p.totalModulos}
                <span className="block text-xs text-slate-400">{p.totalContenidos} contenido(s)</span>
              </td>
              <td className="hidden px-4 py-3 text-center text-slate-600 md:table-cell">{p.duracionHoras} h</td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <EtiquetaPrograma estado={p.estado} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <BotonIcono icono={Pencil} texto="Editar módulos y contenidos" onClick={() => navigate(`/admin/programas/${p.id}`)} />
                  <BotonIcono
                    icono={Trash2}
                    texto={p.totalAsignaciones > 0 ? 'Ya fue asignado: solo se puede archivar' : 'Eliminar'}
                    peligro
                    disabled={p.totalAsignaciones > 0}
                    onClick={() => eliminar(p)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </Tabla>
      </div>

      {creando && (
        <FormularioPrograma
          onCerrar={() => setCreando(false)}
          onGuardado={(nuevo) => navigate(`/admin/programas/${nuevo.id}`, { state: { aviso: `Programa "${nuevo.titulo}" creado. Ahora agregue sus módulos.` } })}
        />
      )}
      <DialogoConfirmar {...dialogo} />
    </div>
  )
}
