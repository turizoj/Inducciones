// Pruebas automáticas de funciones que no necesitan base de datos. Ejecutar con: npm test
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { leerCsv } = require('../src/utils/csv');
const { normalizar, mismosIds, idDeRuta } = require('../src/utils/textos');
const { formatearFecha, textoAFecha } = require('../src/utils/fechas');

test('CSV: detecta punto y coma, respeta comillas y descarta líneas vacías', () => {
  const filas = leerCsv('﻿documento;nombres\r\n123;"Pérez; Ana"\r\n\r\n456;"Dice ""hola"""\n');
  assert.deepEqual(filas, [
    ['documento', 'nombres'],
    ['123', 'Pérez; Ana'],
    ['456', 'Dice "hola"'],
  ]);
});

test('CSV: usa coma cuando es el separador más frecuente', () => {
  assert.deepEqual(leerCsv('a,b,c\n1,2,3'), [
    ['a', 'b', 'c'],
    ['1', '2', '3'],
  ]);
});

test('normalizar: ignora tildes, mayúsculas y espacios', () => {
  assert.equal(normalizar('  Área de OPERACIÓN '), 'area de operacion');
});

test('mismosIds: compara listas sin importar el orden', () => {
  assert.equal(mismosIds([3, 1, 2], [1, 2, 3]), true);
  assert.equal(mismosIds([1, 2], [1, 2, 2]), false);
  assert.equal(mismosIds([10, 2], [2, 1]), false);
});

test('idDeRuta: rechaza identificadores que no son enteros positivos', () => {
  assert.equal(idDeRuta('15'), 15);
  assert.throws(() => idDeRuta('abc'), /no válido/);
  assert.throws(() => idDeRuta('-3'), /no válido/);
});

test('fechas: se muestran en formato dd/mm/aaaa sin correrse un día', () => {
  assert.equal(formatearFecha(textoAFecha('2026-10-05')), '05/10/2026');
});
