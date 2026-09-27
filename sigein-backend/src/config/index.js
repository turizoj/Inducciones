require('dotenv').config();

const requeridas = ['DATABASE_URL', 'JWT_SECRET'];
for (const nombre of requeridas) {
  if (!process.env[nombre]) {
    throw new Error(`Falta la variable de entorno ${nombre}. Revise el archivo .env`);
  }
}

module.exports = {
  port: Number(process.env.PORT) || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
