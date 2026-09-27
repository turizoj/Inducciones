const { Router } = require('express');
const { z } = require('zod');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const controller = require('../controllers/usuarios.controller');
const { filtro, esquemaEstado } = require('../schemas/comunes.schema');
const { esquemaUsuario } = require('../schemas/usuarios.schema');

const router = Router();

const esquemaFiltros = z.object({
  buscar: filtro(z.string().trim()),
  estado: filtro(z.enum(['activo', 'inactivo'])),
  rolId: filtro(z.coerce.number().int().positive()),
  areaId: filtro(z.coerce.number().int().positive()),
  pagina: z.coerce.number().int().positive().default(1),
  porPagina: z.coerce.number().int().min(1).max(50).default(10),
});

const esquemaImportar = z.object({
  csv: z.string().min(1, 'El archivo está vacío'),
});

// HU-03: solo el administrador gestiona los usuarios
router.use(auth, permitirRoles('Administrador'));

router.get('/', validar(esquemaFiltros, 'query'), controller.listar);
router.get('/roles', controller.roles);
router.post('/', validar(esquemaUsuario), controller.crear);
router.post('/importar', validar(esquemaImportar), controller.importar);
router.get('/:id', controller.obtener);
router.put('/:id', validar(esquemaUsuario), controller.actualizar);
router.patch('/:id/estado', validar(esquemaEstado), controller.cambiarEstado);

module.exports = router;
