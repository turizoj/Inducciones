const { z } = require('zod');

// Convierte los textos vacíos en null para los campos opcionales
const opcional = (esquema) => z.preprocess((v) => (v === '' || v === undefined ? null : v), esquema.nullable());

// Filtro de la URL que puede venir vacío (?estado=)
const filtro = (esquema) => z.preprocess((v) => (v === '' ? undefined : v), esquema.optional());

const esquemaEstado = z.object({
  estado: z.enum(['activo', 'inactivo'], { error: 'El estado debe ser activo o inactivo' }),
});

module.exports = { opcional, filtro, esquemaEstado };
