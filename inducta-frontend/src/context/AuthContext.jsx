import { useCallback, useEffect, useState } from 'react'
import * as authApi from '../api/auth'
import { CLAVE_TOKEN } from '../api/cliente'
import { AuthContext } from './contexto'

// Guarda el usuario autenticado y su token para toda la aplicación
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null)
  const [cargando, setCargando] = useState(() => Boolean(localStorage.getItem(CLAVE_TOKEN)))

  // Al abrir la aplicación, si hay un token guardado se recupera el perfil
  useEffect(() => {
    if (!localStorage.getItem(CLAVE_TOKEN)) return
    authApi
      .obtenerPerfil()
      .then(setUsuario)
      .catch(() => localStorage.removeItem(CLAVE_TOKEN))
      .finally(() => setCargando(false))
  }, [])

  const iniciarSesion = useCallback(async (credenciales) => {
    const { token, usuario } = await authApi.iniciarSesion(credenciales)
    localStorage.setItem(CLAVE_TOKEN, token)
    setUsuario(usuario)
    return usuario
  }, [])

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(CLAVE_TOKEN)
    setUsuario(null)
  }, [])

  const aceptarPoliticaDatos = useCallback(async () => {
    setUsuario(await authApi.aceptarPoliticaDatos())
  }, [])

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion, aceptarPoliticaDatos }}>
      {children}
    </AuthContext.Provider>
  )
}
