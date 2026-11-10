const { z } = require('zod');
const { opcional, filtro } = require('./comunes.schema');

const esquemaFiltrosProgramas = z.object({
  buscar: filtro(z.string().trim()),
  estado: filtro(z.enum(['borrador', 'publicado', 'archivado'])),
});

const esquemaPrograma = z.object({
  titulo: z.string().trim().min(3, 'Escriba el título del programa').max(150, 'Máximo 150 caracteres'),
  descripcion: opcional(z.string().trim().max(5000, 'Máximo 5.000 caracteres')),
  duracionHoras: z.coerce
    .number({ error: 'Escriba la duración en horas' })
    .int('La duración debe ser un número entero de horas')
    .min(1, 'La duración mínima es 1 hora')
    .max(500, 'La duración máxima es 500 horas'),
  obligatorio: z.boolean().default(true),
});

const esquemaEstadoPrograma = z.object({
  estado: z.enum(['borrador', 'publicado', 'archivado'], { error: 'Estado no válido' }),
});

const esquemaModulo = z.object({
  titulo: z.string().trim().min(2, 'Escriba el título del módulo').max(150, 'Máximo 150 caracteres'),
  descripcion: opcional(z.string().trim().max(2000, 'Máximo 2.000 caracteres')),
});

// Llega como formulario con archivo (multipart), por eso todos los campos son texto
const esquemaContenido = z.object({
  titulo: z.string().trim().min(2, 'Escriba el título del contenido').max(150, 'Máximo 150 caracteres'),
  tipo: z.enum(['video', 'pdf', 'texto', 'enlace'], { error: 'Tipo de contenido no válido' }),
  url: opcional(z.string().trim().max(255, 'El enlace es demasiado largo (máximo 255 caracteres)')),
  texto: opcional(z.string().max(100000, 'El texto es demasiado largo')),
});

const esquemaOrden = z.object({
  ids: z.array(z.number().int().positive()).min(1),
});

module.exports = {
  esquemaFiltrosProgramas,
  esquemaPrograma,
  esquemaEstadoPrograma,
  esquemaModulo,
  esquemaContenido,
  esquemaOrden,
};
