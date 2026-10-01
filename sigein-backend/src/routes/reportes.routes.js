const { Router } = require('express');
const { z } = require('zod');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const validar = require('../middlewares/validar');
const controller = require('../controllers/reportes.controller');
const { filtro } = require('../schemas/comunes.schema');

const router = Router();

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use el formato AAAA-MM-DD');

// HU-14: filtros combinables por área, programa, estado y rango de fechas de asignación
const esquemaFiltros = z
  .object({
    areaId: filtro(z.coerce.number().int().positive()),
    programaId: filtro(z.coerce.number().int().positive()),
    estado: filtro(z.enum(['pendiente', 'en_curso', 'completada', 'vencida'])),
    desde: filtro(fecha),
    hasta: filtro(fecha),
    buscar: filtro(z.string().trim().max(80)),
  })
  .refine((f) => !f.desde || !f.hasta || f.desde <= f.hasta, { message: 'La fecha "desde" no puede ser posterior a "hasta"', path: ['hasta'] });

router.use(auth);

// RF-23: tablero del administrador
router.get('/resumen', permitirRoles('Administrador'), controller.resumen);

// HU-13 / HU-14: el jefe de área ve solo los colaboradores de su área
const alcance = permitirRoles('Administrador', 'Jefe de área');
router.get('/cumplimiento', alcance, validar(esquemaFiltros, 'query'), controller.cumplimiento);
router.get('/cumplimiento/excel', alcance, validar(esquemaFiltros, 'query'), controller.excel);
router.get('/cumplimiento/pdf', alcance, validar(esquemaFiltros, 'query'), controller.pdf);

module.exports = router;
