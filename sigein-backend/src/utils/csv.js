// Lector sencillo de archivos CSV. Acepta coma o punto y coma como separador
// (Excel en español guarda con punto y coma) y valores entre comillas.
function leerCsv(texto) {
  const limpio = texto.replace(/^﻿/, '');
  const primeraLinea = limpio.split(/\r?\n/, 1)[0];
  const separador = (primeraLinea.match(/;/g) || []).length > (primeraLinea.match(/,/g) || []).length ? ';' : ',';

  const filas = [];
  let fila = [];
  let valor = '';
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"' && limpio[i + 1] === '"') {
        valor += '"';
        i++;
      } else if (c === '"') {
        entreComillas = false;
      } else {
        valor += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === separador) {
      fila.push(valor);
      valor = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && limpio[i + 1] === '\n') i++;
      fila.push(valor);
      filas.push(fila);
      fila = [];
      valor = '';
    } else {
      valor += c;
    }
  }
  if (valor !== '' || fila.length) {
    fila.push(valor);
    filas.push(fila);
  }

  // Se descartan las líneas vacías
  return filas.filter((f) => f.some((v) => v.trim() !== ''));
}

module.exports = { leerCsv };
