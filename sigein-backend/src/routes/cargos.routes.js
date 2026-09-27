const { Router } = require('express');
const { z } = require('zod');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const { cargos: controller } = require('../controllers/areas.controller');
const { filtro, esquemaEstado } = require('../schemas/comunes.schema');

const router = Router();

const esquemaFiltros = z.object({
  buscar: filtro(z.string().trim()),
  estado: filtro(z.enum(['activo', 'inactivo'])),
  areaId: filtro(z.coerce.number().int().positive()),
});

const esquemaCargo = z.object({
  nombre: z.string().trim().min(2, 'Escriba el nombre del cargo').max(80, 'Máximo 80 caracteres'),
  areaId: z.coerce.number({ error: 'Seleccione el área' }).int().positive('Seleccione el área'),
});

// HU-04: solo el administrador gestiona los cargos
router.use(auth, permitirRoles('Administrador'));

router.get('/', validar(esquemaFiltros, 'query'), controller.listar);
router.post('/', validar(esquemaCargo), controller.crear);
router.put('/:id', validar(esquemaCargo), controller.actualizar);
router.patch('/:id/estado', validar(esquemaEstado), controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
