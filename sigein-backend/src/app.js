const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { frontendUrl } = require('./config');
const authRoutes = require('./routes/auth.routes');
const usuariosRoutes = require('./routes/usuarios.routes');
const areasRoutes = require('./routes/areas.routes');
const cargosRoutes = require('./routes/cargos.routes');
const reportesRoutes = require('./routes/reportes.routes');
const programasRoutes = require('./routes/programas.routes');
const errores = require('./middlewares/errores');
const { CARPETA_UPLOADS } = require('./utils/archivos');

const app = express();

// Archivos cargados (imágenes, PDF, videos). Van antes de helmet para que el frontend,
// que está en otro puerto, los pueda mostrar dentro de la página.
app.use(
  '/uploads',
  express.static(CARPETA_UPLOADS, {
    fallthrough: false,
    setHeaders: (res) => {
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  }),
);

app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/salud', (req, res) => res.json({ estado: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/areas', areasRoutes);
app.use('/api/cargos', cargosRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/programas', programasRoutes.programas);
app.use('/api/modulos', programasRoutes.modulos);
app.use('/api/contenidos', programasRoutes.contenidos);

app.use((req, res) => res.status(404).json({ mensaje: 'Recurso no encontrado' }));
app.use(errores);

module.exports = app;
