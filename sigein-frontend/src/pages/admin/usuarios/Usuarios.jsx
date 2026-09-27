import { useState } from 'react'
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Power, Upload } from 'lucide-react'
import Alerta from '../../../components/Alerta'
import Boton from '../../../components/Boton'
import BotonIcono from '../../../components/BotonIcono'
import Buscador from '../../../components/Buscador'
import CampoSelect from '../../../components/CampoSelect'
import DialogoConfirmar from '../../../components/DialogoConfirmar'
import EtiquetaEstado from '../../../components/EtiquetaEstado'
import Paginacion from '../../../components/Paginacion'
import Tabla from '../../../components/Tabla'
import useAuth from '../../../hooks/useAuth'
import useAviso from '../../../hooks/useAviso'
import useConfirmacion from '../../../hooks/useConfirmacion'
import useRetraso from '../../../hooks/useRetraso'
import { cambiarEstadoUsuario, listarAreas, listarRoles, listarUsuarios } from '../../../api/admin'
import FormularioUsuario from './FormularioUsuario'
import ImportarUsuarios from './ImportarUsuarios'

const encabezados = [
  { texto: 'Usuario' },
  { texto: 'Documento', clases: 'hidden md:table-cell' },
  { texto: 'Rol', clases: 'hidden lg:table-cell' },
  { texto: 'Área / cargo', clases: 'hidden lg:table-cell' },
  { texto: 'Estado', clases: 'hidden sm:table-cell' },
  { texto: 'Acciones', clases: 'text-right' },
]

// HU-03: crear, editar, inactivar y buscar usuarios, y cargarlos desde un CSV
export default function Usuarios() {
  const { usuario: yo } = useAuth()
  const queryClient = useQueryClient()
  const [aviso, mostrarAviso] = useAviso()
  const [filtrosForm, setFiltrosForm] = useState({ buscar: '', rolId: '', areaId: '', estado: '' })
  const [pagina, setPagina] = useState(1)
  const buscar = useRetraso(filtrosForm.buscar)
  const filtros = { ...filtrosForm, buscar, pagina }

  const { data, isLoading, error } = useQuery({
    queryKey: ['usuarios', filtros],
    queryFn: () => listarUsuarios(filtros),
    placeholderData: keepPreviousData,
  })
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: listarRoles, staleTime: Infinity })
  const { data: areas = [] } = useQuery({ queryKey: ['areas', {}], queryFn: () => listarAreas({}) })

  const [formulario, setFormulario] = useState(null)
  const [importando, setImportando] = useState(false)
  const { pedir, dialogo } = useConfirmacion()

  // Al cambiar un filtro se vuelve a la primera página
  function filtrar(campo, valor) {
    setFiltrosForm((f) => ({ ...f, [campo]: valor }))
    setPagina(1)
  }

  function cambiarEstado(u) {
    const nuevo = u.estado === 'activo' ? 'inactivo' : 'activo'
    const nombre = `${u.nombres} ${u.apellidos}`
    pedir({
      titulo: nuevo === 'activo' ? 'Activar usuario' : 'Inactivar usuario',
      mensaje:
        nuevo === 'activo'
          ? `¿Desea activar a ${nombre}? Podrá volver a iniciar sesión.`
          : `¿Desea inactivar a ${nombre}? No podrá iniciar sesión, pero se conserva su historial.`,
      textoConfirmar: nuevo === 'activo' ? 'Activar' : 'Inactivar',
      peligro: nuevo === 'inactivo',
      ejecutar: async () => {
        await cambiarEstadoUsuario({ id: u.id, estado: nuevo })
        await queryClient.invalidateQueries()
        mostrarAviso(`${nombre} quedó ${nuevo}.`)
      },
    })
  }

  const usuarios = data?.datos ?? []

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Usuarios</h1>
          <p className="mt-1 text-sm text-slate-500">Personal de la empresa que recibe o gestiona inducciones.</p>
        </div>
        <div className="flex gap-2">
          <Boton variante="secundario" onClick={() => setImportando(true)} className="flex-1 sm:flex-none">
            <Upload className="size-4" aria-hidden="true" /> Cargar CSV
          </Boton>
          <Boton onClick={() => setFormulario({})} className="flex-1 sm:flex-none">
            <Plus className="size-4" aria-hidden="true" /> Nuevo usuario
          </Boton>
        </div>
      </div>

      {aviso && (
        <div className="mt-4">
          <Alerta tipo="exito">{aviso}</Alerta>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 lg:flex-row">
        <div className="flex-1">
          <Buscador
            valor={filtrosForm.buscar}
            onCambiar={(v) => filtrar('buscar', v)}
            placeholder="Buscar por nombre, documento o correo…"
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:flex">
          <div className="lg:w-40">
            <CampoSelect aria-label="Filtrar por rol" value={filtrosForm.rolId} onChange={(e) => filtrar('rolId', e.target.value)}>
              <option value="">Todos los roles</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre}
                </option>
              ))}
            </CampoSelect>
          </div>
          <div className="lg:w-44">
            <CampoSelect aria-label="Filtrar por área" value={filtrosForm.areaId} onChange={(e) => filtrar('areaId', e.target.value)}>
              <option value="">Todas las áreas</option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </CampoSelect>
          </div>
          <div className="lg:w-40">
            <CampoSelect aria-label="Filtrar por estado" value={filtrosForm.estado} onChange={(e) => filtrar('estado', e.target.value)}>
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </CampoSelect>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <Tabla
          encabezados={encabezados}
          cargando={isLoading}
          error={error}
          vacio={usuarios.length === 0}
          mensajeVacio="No se encontraron usuarios con esos filtros."
        >
          {usuarios.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-slate-900">
                  {u.nombres} {u.apellidos}
                </p>
                <p className="break-all text-xs text-slate-500">{u.email}</p>
                <p className="mt-0.5 text-xs text-slate-500 lg:hidden">
                  {u.rol.nombre}
                  {u.cargo && ` · ${u.cargo.nombre} (${u.area.nombre})`}
                </p>
                <div className="mt-1 sm:hidden">
                  <EtiquetaEstado estado={u.estado} />
                </div>
              </td>
              <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{u.documento}</td>
              <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{u.rol.nombre}</td>
              <td className="hidden px-4 py-3 lg:table-cell">
                {u.cargo ? (
                  <>
                    <p className="text-slate-700">{u.area.nombre}</p>
                    <p className="text-xs text-slate-500">{u.cargo.nombre}</p>
                  </>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="hidden px-4 py-3 sm:table-cell">
                <EtiquetaEstado estado={u.estado} />
              </td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-1">
                  <BotonIcono icono={Pencil} texto="Editar" onClick={() => setFormulario(u)} />
                  <BotonIcono
                    icono={Power}
                    texto={u.id === yo.id ? 'No puede inactivar su propio usuario' : u.estado === 'activo' ? 'Inactivar' : 'Activar'}
                    disabled={u.id === yo.id}
                    onClick={() => cambiarEstado(u)}
                  />
                </div>
              </td>
            </tr>
          ))}
        </Tabla>
        {data && data.total > 0 && (
          <Paginacion pagina={data.pagina} totalPaginas={data.totalPaginas} total={data.total} onCambiar={setPagina} />
        )}
      </div>

      {formulario && (
        <FormularioUsuario
          usuario={formulario.id ? formulario : null}
          onCerrar={() => setFormulario(null)}
          onGuardado={(mensaje) => {
            setFormulario(null)
            mostrarAviso(mensaje)
          }}
        />
      )}
      {importando && <ImportarUsuarios onCerrar={() => setImportando(false)} />}
      <DialogoConfirmar {...dialogo} />
    </div>
  )
}
