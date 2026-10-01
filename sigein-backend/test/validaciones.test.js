// Pruebas de las reglas de validación de usuarios (HU-03) y evaluaciones (HU-07)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { esquemaUsuario } = require('../src/schemas/usuarios.schema');
const { esquemaEvaluacion } = require('../src/schemas/evaluaciones.schema');

const mensajes = (resultado) => resultado.error.issues.map((i) => i.message);

test('usuario válido: limpia espacios, pasa el correo a minúsculas y convierte vacíos en null', () => {
  const r = esquemaUsuario.safeParse({
    documento: '1012345678',
    nombres: '  Ana ',
    apellidos: 'Rojas',
    email: 'Ana.Rojas@Empresa.com',
    telefono: '',
    fechaIngreso: '2026-10-01',
    rolId: '3',
    cargoId: '2',
  });
  assert.equal(r.success, true);
  assert.equal(r.data.nombres, 'Ana');
  assert.equal(r.data.email, 'ana.rojas@empresa.com');
  assert.equal(r.data.telefono, null);
  assert.equal(r.data.rolId, 3);
});

test('usuario inválido: documento con puntos y fecha mal escrita', () => {
  const r = esquemaUsuario.safeParse({
    documento: '1.012.345',
    nombres: 'Ana',
    apellidos: 'Rojas',
    email: 'ana@empresa.com',
    fechaIngreso: '01/10/2026',
    rolId: 3,
  });
  assert.equal(r.success, false);
  assert.ok(mensajes(r).some((m) => m.includes('sin puntos')));
  assert.ok(mensajes(r).some((m) => m.includes('AAAA-MM-DD')));
});

const pregunta = (tipo, opciones) => ({ enunciado: 'Pregunta de prueba', tipo, opciones });

test('evaluación válida con los tres tipos de pregunta', () => {
  const r = esquemaEvaluacion.safeParse({
    notaMinima: 3.5,
    intentosMax: 3,
    tiempoLimiteMin: '',
    preguntas: [
      pregunta('unica', [{ texto: 'A', esCorrecta: true }, { texto: 'B', esCorrecta: false }]),
      pregunta('multiple', [{ texto: 'A', esCorrecta: true }, { texto: 'B', esCorrecta: true }, { texto: 'C', esCorrecta: false }]),
      pregunta('verdadero_falso', [{ texto: 'Verdadero', esCorrecta: false }, { texto: 'Falso', esCorrecta: true }]),
    ],
  });
  assert.equal(r.success, true);
  assert.equal(r.data.tiempoLimiteMin, null);
});

test('HU-07: cada pregunta debe tener al menos una opción correcta', () => {
  const r = esquemaEvaluacion.safeParse({
    notaMinima: 3,
    intentosMax: 2,
    preguntas: [pregunta('multiple', [{ texto: 'A', esCorrecta: false }, { texto: 'B', esCorrecta: false }])],
  });
  assert.equal(r.success, false);
  assert.ok(mensajes(r).includes('Marque al menos una opción correcta'));
});

test('HU-07: nota de 0 a 5 con un decimal y entre 1 y 5 intentos', () => {
  const base = { preguntas: [pregunta('unica', [{ texto: 'A', esCorrecta: true }, { texto: 'B', esCorrecta: false }])] };
  assert.equal(esquemaEvaluacion.safeParse({ ...base, notaMinima: 5.5, intentosMax: 2 }).success, false);
  assert.equal(esquemaEvaluacion.safeParse({ ...base, notaMinima: 3.25, intentosMax: 2 }).success, false);
  assert.equal(esquemaEvaluacion.safeParse({ ...base, notaMinima: 3, intentosMax: 6 }).success, false);
  assert.equal(esquemaEvaluacion.safeParse({ ...base, notaMinima: 3, intentosMax: 0 }).success, false);
  assert.equal(esquemaEvaluacion.safeParse({ ...base, notaMinima: 4.5, intentosMax: 5 }).success, true);
});

test('selección única con dos respuestas correctas no es válida', () => {
  const r = esquemaEvaluacion.safeParse({
    notaMinima: 3,
    intentosMax: 1,
    preguntas: [pregunta('unica', [{ texto: 'A', esCorrecta: true }, { texto: 'B', esCorrecta: true }])],
  });
  assert.equal(r.success, false);
});
