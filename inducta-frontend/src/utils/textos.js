// Minúsculas y sin tildes, para buscar sin importar cómo se escribió ("Pérez" = "perez")
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}
