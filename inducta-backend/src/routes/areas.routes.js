const { Router } = require('express');
const { z } = require('zod');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const { areas: controller } = require('../controllers/areas.controller');
const { opcional, filtro, esquemaEstado } = require('../schemas/comunes.schema');

const router = Router();

const esquemaFiltros = z.object({
  buscar: filtro(z.string().trim()),
  estado: filtro(z.enum(['activo', 'inactivo'])),
});

const esquemaArea = z.object({
  nombre: z.string().trim().min(2, 'Escriba el nombre del área').max(80, 'Máximo 80 caracteres'),
  descripcion: opcional(z.string().trim().max(255, 'Máximo 255 caracteres')),
  jefeId: opcional(z.coerce.number().int().positive()),
});

// HU-04: solo el administrador gestiona las áreas
router.use(auth, permitirRoles('Administrador'));

router.get('/', validar(esquemaFiltros, 'query'), controller.listar);
router.post('/', validar(esquemaArea), controller.crear);
router.put('/:id', validar(esquemaArea), controller.actualizar);
router.patch('/:id/estado', validar(esquemaEstado), controller.cambiarEstado);
router.delete('/:id', controller.eliminar);

module.exports = router;
