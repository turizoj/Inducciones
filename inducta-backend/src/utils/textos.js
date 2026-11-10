const { HttpError } = require('./errores');

// Convierte el :id de la URL en número o responde 400
function idDeRuta(valor) {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Identificador no válido');
  return id;
}

// Minúsculas y sin tildes, para comparar nombres escritos de distintas formas
function normalizar(texto) {
  return String(texto || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase();
}

// Comprueba que dos listas de ids tengan los mismos elementos, sin importar el orden
function mismosIds(a, b) {
  const ordenar = (lista) => [...lista].sort((x, y) => x - y);
  const [x, y] = [ordenar(a), ordenar(b)];
  return x.length === y.length && x.every((id, i) => id === y[i]);
}

module.exports = { idDeRuta, normalizar, mismosIds };
