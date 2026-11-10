import { useCallback, useEffect, useState } from 'react'

// Mensaje de éxito que desaparece solo después de unos segundos
export default function useAviso(segundos = 6) {
  const [aviso, setAviso] = useState('')
  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(''), segundos * 1000)
    return () => clearTimeout(t)
  }, [aviso, segundos])
  return [aviso, useCallback((texto) => setAviso(texto), [])]
}
