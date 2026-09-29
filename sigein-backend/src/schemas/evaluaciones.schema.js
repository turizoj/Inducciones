const { z } = require('zod');

const esquemaOpcion = z.object({
  texto: z.string().trim().min(1, 'Escriba el texto de la opción').max(255, 'Máximo 255 caracteres'),
  esCorrecta: z.boolean(),
});

// HU-07: cada pregunta debe tener al menos una opción correcta
const esquemaPregunta = z
  .object({
    enunciado: z.string().trim().min(3, 'Escriba la pregunta').max(1000, 'Máximo 1.000 caracteres'),
    tipo: z.enum(['unica', 'multiple', 'verdadero_falso'], { error: 'Tipo de pregunta no válido' }),
    opciones: z.array(esquemaOpcion).max(10, 'Máximo 10 opciones por pregunta'),
  })
  .superRefine((p, ctx) => {
    const correctas = p.opciones.filter((o) => o.esCorrecta).length;
    const problema = (message) => ctx.addIssue({ code: 'custom', path: ['opciones'], message });
    if (p.tipo === 'verdadero_falso') {
      if (p.opciones.length !== 2) problema('Una pregunta de verdadero o falso tiene exactamente 2 opciones');
      else if (correctas !== 1) problema('Marque cuál es la respuesta correcta');
      return;
    }
    if (p.opciones.length < 2) return problema('Agregue al menos 2 opciones');
    if (p.tipo === 'unica' && correctas !== 1) problema('Una pregunta de selección única tiene exactamente 1 opción correcta');
    if (p.tipo === 'multiple' && correctas < 1) problema('Marque al menos una opción correcta');
  });

const esquemaEvaluacion = z.object({
  // HU-07: la nota se calcula en escala de 0 a 5
  notaMinima: z.coerce
    .number({ error: 'Escriba la nota mínima' })
    .min(0, 'La nota mínima va de 0 a 5')
    .max(5, 'La nota mínima va de 0 a 5')
    .refine((n) => Math.abs(n * 10 - Math.round(n * 10)) < 1e-9, 'Use máximo un decimal'),
  // HU-07: se pueden definir entre 1 y 5 intentos
  intentosMax: z.coerce.number().int().min(1, 'Mínimo 1 intento').max(5, 'Máximo 5 intentos'),
  tiempoLimiteMin: z.preprocess(
    (v) => (v === '' || v === undefined ? null : v),
    z.coerce.number().int('Escriba minutos enteros').min(1, 'Mínimo 1 minuto').max(180, 'Máximo 180 minutos').nullable(),
  ),
  preguntas: z.array(esquemaPregunta).min(1, 'Agregue al menos una pregunta').max(50, 'Máximo 50 preguntas'),
});

const esquemaIniciar = z.object({
  asignacionId: z.coerce.number().int().positive(),
});

const esquemaRespuestas = z.object({
  respuestas: z
    .array(
      z.object({
        preguntaId: z.number().int().positive(),
        opcionIds: z.array(z.number().int().positive()).max(10),
      }),
    )
    .max(50),
});

module.exports = { esquemaEvaluacion, esquemaIniciar, esquemaRespuestas };
