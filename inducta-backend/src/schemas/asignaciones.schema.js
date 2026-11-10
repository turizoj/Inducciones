const { z } = require('zod');
const { filtro } = require('./comunes.schema');

const fecha = z
  .string({ error: 'Seleccione la fecha límite' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'La fecha límite debe tener el formato AAAA-MM-DD', abort: true })
  .refine((v) => !Number.isNaN(new Date(v).getTime()), 'Fecha límite no válida');

const esquemaFiltrosAsignaciones = z.object({
  buscar: filtro(z.string().trim()),
  programaId: filtro(z.coerce.number().int().positive()),
  estado: filtro(z.enum(['pendiente', 'en_curso', 'completada', 'vencida'])),
  pagina: z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().min(1).max(50).default(10),
});

// CU-08: modo individual, por área o por cargo
const esquemaAsignacion = z
  .object({
    programaId: z.coerce.number({ error: 'Seleccione el programa' }).int().positive('Seleccione el programa'),
    modo: z.enum(['individual', 'area', 'cargo'], { error: 'Seleccione a quién se asigna' }),
    usuarioIds: z.array(z.number().int().positive()).max(1000).default([]),
    areaId: z.coerce.number().int().positive().optional(),
    cargoId: z.coerce.number().int().positive().optional(),
    fechaLimite: fecha,
  })
  .superRefine((d, ctx) => {
    if (d.modo === 'individual' && d.usuarioIds.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['usuarioIds'], message: 'Seleccione al menos un colaborador' });
    }
    if (d.modo === 'area' && !d.areaId) ctx.addIssue({ code: 'custom', path: ['areaId'], message: 'Seleccione el área' });
    if (d.modo === 'cargo' && !d.cargoId) ctx.addIssue({ code: 'custom', path: ['cargoId'], message: 'Seleccione el cargo' });
  });

const esquemaFecha = z.object({ fechaLimite: fecha });

const esquemaProgreso = z.object({
  asignacionId: z.coerce.number().int().positive(),
});

module.exports = { esquemaFiltrosAsignaciones, esquemaAsignacion, esquemaFecha, esquemaProgreso };
