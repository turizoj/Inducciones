const app = require('./app');
const { port } = require('./config');
const { iniciarRecordatorios } = require('./jobs/recordatorios');
const { verificarCorreo } = require('./utils/correo');

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
  verificarCorreo();
  iniciarRecordatorios();
});
