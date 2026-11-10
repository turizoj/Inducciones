const { z } = require('zod');
const { opcional } = require('./comunes.schema');

// Reglas de un usuario: se usan en el formulario (API) y en la carga masiva por CSV
const esquemaUsuario = z.object({
  documento: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{5,20}$/, 'El documento debe tener entre 5 y 20 letras o números, sin puntos ni espacios'),
  nombres: z.string().trim().min(2, 'Escriba los nombres').max(80, 'Máximo 80 caracteres'),
  apellidos: z.string().trim().min(2, 'Escriba los apellidos').max(80, 'Máximo 80 caracteres'),
  email: z.string().trim().toLowerCase().email('Correo no válido').max(120, 'Máximo 120 caracteres'),
  telefono: opcional(z.string().trim().regex(/^\+?[0-9 ]{7,20}$/, 'Teléfono no válido')),
  fechaIngreso: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha de ingreso debe tener el formato AAAA-MM-DD', abort: true })
    .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Fecha de ingreso no válida'),
  rolId: z.coerce.number().int().positive('Seleccione el rol'),
  cargoId: opcional(z.coerce.number().int().positive()),
});

module.exports = { esquemaUsuario };
