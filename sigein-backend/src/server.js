const app = require('./app');
const { port } = require('./config');

app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
