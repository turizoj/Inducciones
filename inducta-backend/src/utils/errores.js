// Error con código HTTP para responder de forma controlada desde los servicios
class HttpError extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

module.exports = { HttpError };
