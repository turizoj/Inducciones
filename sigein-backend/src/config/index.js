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
  // Nombre que aparece en los certificados
  empresaNombre: process.env.EMPRESA_NOMBRE || 'SIGEIN',
  // Servidor de correo (opcional). Sin SMTP_HOST, los correos se muestran en la consola.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    remitente: process.env.CORREO_REMITENTE || process.env.SMTP_USER || '',
  },
};
