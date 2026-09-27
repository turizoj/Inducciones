const { Router } = require('express');
const auth = require('../middlewares/auth');
const permitirRoles = require('../middlewares/roles');
const controller = require('../controllers/reportes.controller');

const router = Router();

router.use(auth, permitirRoles('Administrador'));

router.get('/resumen', controller.resumen);

module.exports = router;
