import { useEffect, useState } from 'react'

// Devuelve el valor solo cuando deja de cambiar, para no consultar la API en cada tecla
export default function useRetraso(valor, milisegundos = 300) {
  const [retrasado, setRetrasado] = useState(valor)
  useEffect(() => {
    const t = setTimeout(() => setRetrasado(valor), milisegundos)
    return () => clearTimeout(t)
  }, [valor, milisegundos])
  return retrasado
}
