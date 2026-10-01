const app = require('./app');
const { port } = require('./config');
const { iniciarRecordatorios } = require('./jobs/recordatorios');

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
  iniciarRecordatorios();
});
