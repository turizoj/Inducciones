const { Router } = require('express');
const { z } = require('zod');
const validar = require('../middlewares/validar');
const auth = require('../middlewares/auth');
const controller = require('../controllers/auth.controller');

const router = Router();

const esquemaLogin = z.object({
  email: z.string().trim().toLowerCase().email('Correo no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

const esquemaRecuperar = z.object({
  email: z.string().trim().toLowerCase().email('Correo no válido'),
});

// HU-02: mínimo 8 caracteres, una mayúscula y un número
const esquemaRestablecer = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .regex(/[0-9]/, 'Debe tener al menos un número'),
});

router.post('/login', validar(esquemaLogin), controller.login);
router.post('/recuperar', validar(esquemaRecuperar), controller.recuperar);
router.post('/restablecer', validar(esquemaRestablecer), controller.restablecer);
router.get('/perfil', auth, controller.perfil);
router.post('/aceptar-datos', auth, controller.aceptarDatos);

module.exports = router;
