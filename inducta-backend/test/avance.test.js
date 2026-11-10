// Pruebas del cálculo de avance y del bloqueo de módulos (HU-10, RF-16, RF-17)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calcularAvance, estadoSegun } = require('../src/services/avance.service');

// Asignación de prueba: módulo 1 con dos contenidos y evaluación; módulo 2 con un contenido
function asignacion({ vistos = [], aprobadas = [], fechaLimite = '2099-12-31' } = {}) {
  return {
    fechaLimite: new Date(`${fechaLimite}T00:00:00.000Z`),
    programa: {
      modulos: [
        { id: 1, titulo: 'Uno', contenidos: [{ id: 11 }, { id: 12 }], evaluacion: { id: 100, notaMinima: 3, intentosMax: 2 } },
        { id: 2, titulo: 'Dos', contenidos: [{ id: 21 }], evaluacion: null },
      ],
    },
    progresos: vistos.map((contenidoId) => ({ contenidoId })),
    intentos: aprobadas.map((evaluacionId) => ({ evaluacionId })),
  };
}

test('sin avance: el primer módulo está en curso y el segundo bloqueado', () => {
  const a = asignacion();
  const avance = calcularAvance(a);
  assert.deepEqual(
    avance.modulos.map((m) => m.estado),
    ['en_curso', 'bloqueado'],
  );
  assert.equal(avance.porcentaje, 0);
  assert.equal(estadoSegun(a, avance), 'pendiente');
});

test('ver los contenidos sin aprobar la evaluación no desbloquea el módulo siguiente', () => {
  const a = asignacion({ vistos: [11, 12] });
  const avance = calcularAvance(a);
  assert.deepEqual(
    avance.modulos.map((m) => m.estado),
    ['en_curso', 'bloqueado'],
  );
  assert.equal(avance.porcentaje, 50); // 2 de 4 elementos (3 contenidos + 1 evaluación)
  assert.equal(estadoSegun(a, avance), 'en_curso');
});

test('al aprobar la evaluación se desbloquea el módulo siguiente', () => {
  const avance = calcularAvance(asignacion({ vistos: [11, 12], aprobadas: [100] }));
  assert.deepEqual(
    avance.modulos.map((m) => m.estado),
    ['completado', 'en_curso'],
  );
  assert.equal(avance.porcentaje, 75);
});

test('con todo visto y aprobado la inducción queda completada aunque esté vencida', () => {
  const a = asignacion({ vistos: [11, 12, 21], aprobadas: [100], fechaLimite: '2000-01-01' });
  const avance = calcularAvance(a);
  assert.equal(avance.completo, true);
  assert.equal(avance.porcentaje, 100);
  assert.equal(estadoSegun(a, avance), 'completada');
});

test('si pasa la fecha límite sin completar, queda vencida', () => {
  const a = asignacion({ vistos: [11], fechaLimite: '2000-01-01' });
  assert.equal(estadoSegun(a, calcularAvance(a)), 'vencida');
});
