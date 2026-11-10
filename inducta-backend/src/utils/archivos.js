const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { HttpError } = require('./errores');

const CARPETA_UPLOADS = path.join(__dirname, '..', '..', 'uploads');
const MB = 1024 * 1024;

// HU-06: los PDF no superan 20 MB; los MP4 pesados deberían ir como enlace de YouTube o Vimeo
const LIMITES = { pdf: 20 * MB, video: 100 * MB, imagen: 2 * MB };

const EXTENSIONES = {
  'application/pdf': '.pdf',
  'video/mp4': '.mp4',
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

// Crea el middleware de multer para una subcarpeta de uploads y unos tipos de archivo permitidos
function subirArchivo({ carpeta, campo, tipos, limite }) {
  const destino = path.join(CARPETA_UPLOADS, carpeta);
  fs.mkdirSync(destino, { recursive: true });

  const almacen = multer.diskStorage({
    destination: destino,
    // Nombre aleatorio: evita choques y que se adivine el nombre de otros archivos
    filename: (req, archivo, cb) => cb(null, crypto.randomBytes(16).toString('hex') + EXTENSIONES[archivo.mimetype]),
  });

  return multer({
    storage: almacen,
    limits: { fileSize: limite, files: 1 },
    fileFilter: (req, archivo, cb) => {
      if (tipos.includes(archivo.mimetype)) return cb(null, true);
      cb(new HttpError(400, 'Tipo de archivo no permitido'));
    },
  }).single(campo);
}

// Firma de los primeros bytes de cada formato. El tipo que informa el navegador depende solo
// de la extensión del nombre, así que se revisa el contenido real del archivo.
const FIRMAS = {
  'application/pdf': (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
  'video/mp4': (b) => b.subarray(4, 8).toString('latin1') === 'ftyp',
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/webp': (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
};

// Lanza un error si el archivo subido no es realmente del tipo que dice ser
function verificarTipoReal(archivo, nombreTipo) {
  const inicio = Buffer.alloc(16);
  const fd = fs.openSync(archivo.path, 'r');
  try {
    fs.readSync(fd, inicio, 0, 16, 0);
  } finally {
    fs.closeSync(fd);
  }
  if (!FIRMAS[archivo.mimetype]?.(inicio)) {
    throw new HttpError(400, `El archivo no es un ${nombreTipo} válido`);
  }
}

// Ruta pública del archivo guardado, por ejemplo /uploads/contenidos/abc.pdf
function rutaPublica(archivo, carpeta) {
  return `/uploads/${carpeta}/${archivo.filename}`;
}

// Borra un archivo de uploads a partir de su ruta pública. Ignora rutas externas o inexistentes.
function borrarArchivo(ruta) {
  if (!ruta || !ruta.startsWith('/uploads/')) return;
  const completa = path.join(CARPETA_UPLOADS, ruta.replace('/uploads/', ''));
  if (!completa.startsWith(CARPETA_UPLOADS)) return;
  fs.unlink(completa, () => {});
}

// Si la petición falla después de subir el archivo, se borra para no dejar basura
function borrarArchivoSubido(req) {
  if (req.file) fs.unlink(req.file.path, () => {});
}

module.exports = {
  CARPETA_UPLOADS,
  LIMITES,
  MB,
  subirArchivo,
  verificarTipoReal,
  rutaPublica,
  borrarArchivo,
  borrarArchivoSubido,
};
