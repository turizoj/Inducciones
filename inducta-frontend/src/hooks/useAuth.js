import { useContext } from 'react'
import { AuthContext } from '../context/contexto'

export default function useAuth() {
  return useContext(AuthContext)
}
