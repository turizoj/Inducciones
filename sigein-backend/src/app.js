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
const errores = require('./middlewares/errores');

const app = express();

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

app.use((req, res) => res.status(404).json({ mensaje: 'Recurso no encontrado' }));
app.use(errores);

module.exports = app;
