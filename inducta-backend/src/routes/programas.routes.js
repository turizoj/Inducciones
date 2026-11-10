const { Router } = require('express');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const controller = require('../controllers/programas.controller');
const { subirArchivo, LIMITES } = require('../utils/archivos');
const {
  esquemaFiltrosProgramas,
  esquemaPrograma,
  esquemaEstadoPrograma,
  esquemaModulo,
  esquemaContenido,
  esquemaOrden,
} = require('../schemas/programas.schema');

const subirImagen = subirArchivo({
  carpeta: 'programas',
  campo: 'imagen',
  tipos: ['image/jpeg', 'image/png', 'image/webp'],
  limite: LIMITES.imagen,
});

// El límite general es el del video; el de los PDF (20 MB) se revisa en el servicio
const subirContenido = subirArchivo({
  carpeta: 'contenidos',
  campo: 'archivo',
  tipos: ['application/pdf', 'video/mp4'],
  limite: LIMITES.video,
});

const soloAdmin = [auth, permitirRoles('Administrador')];

// /api/programas (HU-05)
const programas = Router();
programas.use(soloAdmin);
programas.get('/', validar(esquemaFiltrosProgramas, 'query'), controller.listar);
programas.post('/', validar(esquemaPrograma), controller.crear);
programas.get('/:id', controller.obtener);
programas.put('/:id', validar(esquemaPrograma), controller.actualizar);
programas.patch('/:id/estado', validar(esquemaEstadoPrograma), controller.cambiarEstado);
programas.delete('/:id', controller.eliminar);
programas.post('/:id/imagen', subirImagen, controller.subirImagen);
programas.delete('/:id/imagen', controller.quitarImagen);
programas.post('/:id/modulos', validar(esquemaModulo), controller.crearModulo);
programas.put('/:id/modulos/orden', validar(esquemaOrden), controller.ordenarModulos);

// /api/modulos (HU-06)
const modulos = Router();
modulos.use(soloAdmin);
modulos.put('/:id', validar(esquemaModulo), controller.actualizarModulo);
modulos.delete('/:id', controller.eliminarModulo);
modulos.post('/:id/contenidos', subirContenido, validar(esquemaContenido), controller.crearContenido);
modulos.put('/:id/contenidos/orden', validar(esquemaOrden), controller.ordenarContenidos);

// /api/contenidos (HU-06)
const contenidos = Router();
contenidos.use(soloAdmin);
contenidos.put('/:id', subirContenido, validar(esquemaContenido), controller.actualizarContenido);
contenidos.delete('/:id', controller.eliminarContenido);

module.exports = { programas, modulos, contenidos };
