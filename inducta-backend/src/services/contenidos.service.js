const sanitizeHtml = require('sanitize-html');
const prisma = require('../config/prisma');
const { HttpError } = require('../utils/errores');
const { LIMITES, MB, borrarArchivo, rutaPublica, verificarTipoReal } = require('../utils/archivos');
const { mismosIds } = require('../utils/textos');
const { verificarSinAsignaciones } = require('./programas.service');

const CARPETA = 'contenidos';

// HU-06: los videos se registran como enlace de YouTube o Vimeo, o como archivo MP4
const VIDEO_PERMITIDO = /^https:\/\/(www\.|m\.|player\.)?(youtube\.com|youtu\.be|vimeo\.com)\//i;

// Etiquetas que acepta el texto enriquecido; todo lo demás (scripts, estilos, iframes) se elimina
const OPCIONES_HTML = {
  allowedTags: ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'code', 'pre', 'hr'],
  allowedAttributes: { a: ['href', 'target', 'rel'] },
  allowedSchemes: ['http', 'https', 'mailto'],
  transformTags: { a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }) },
};

async function buscarPorId(id) {
  const contenido = await prisma.contenido.findUnique({ where: { id }, include: { modulo: true } });
  if (!contenido) throw new HttpError(404, 'Contenido no encontrado');
  return contenido;
}

async function buscarModulo(id) {
  const modulo = await prisma.modulo.findUnique({ where: { id } });
  if (!modulo) throw new HttpError(404, 'Módulo no encontrado');
  return modulo;
}

// Arma la url o el texto del contenido según su tipo. "actual" es el contenido que se edita.
function prepararDatos({ titulo, tipo, url, texto }, archivo, actual) {
  const conservaArchivo = actual && actual.tipo === tipo && actual.url?.startsWith('/uploads/');

  if (tipo === 'texto') {
    if (archivo) throw new HttpError(400, 'Un contenido de texto no lleva archivo');
    // Se quitan también los párrafos vacíos que el editor deja al final
    const limpio = sanitizeHtml(texto || '', OPCIONES_HTML).replace(/(<p>\s*<\/p>)+$/, '');
    if (!sanitizeHtml(limpio, { allowedTags: [] }).trim()) throw new HttpError(400, 'Escriba el texto del contenido');
    return { titulo, tipo, url: null, texto: limpio };
  }

  if (tipo === 'enlace') {
    if (archivo) throw new HttpError(400, 'Un enlace no lleva archivo');
    if (!url || !/^https?:\/\//i.test(url)) throw new HttpError(400, 'Escriba un enlace que empiece por http:// o https://');
    return { titulo, tipo, url, texto: null };
  }

  if (tipo === 'pdf') {
    if (archivo) {
      if (archivo.mimetype !== 'application/pdf') throw new HttpError(400, 'El archivo debe ser un PDF');
      if (archivo.size > LIMITES.pdf) throw new HttpError(413, `El PDF supera el máximo de ${LIMITES.pdf / MB} MB`);
      verificarTipoReal(archivo, 'PDF');
      return { titulo, tipo, url: rutaPublica(archivo, CARPETA), texto: null };
    }
    if (conservaArchivo) return { titulo, tipo, url: actual.url, texto: null };
    throw new HttpError(400, 'Seleccione el archivo PDF');
  }

  // Video: archivo MP4 o enlace de YouTube / Vimeo
  if (archivo) {
    if (archivo.mimetype !== 'video/mp4') throw new HttpError(400, 'El video debe ser un archivo MP4');
    verificarTipoReal(archivo, 'video MP4');
    return { titulo, tipo, url: rutaPublica(archivo, CARPETA), texto: null };
  }
  if (url) {
    if (!VIDEO_PERMITIDO.test(url)) throw new HttpError(400, 'El enlace del video debe ser de YouTube o Vimeo');
    return { titulo, tipo, url, texto: null };
  }
  if (conservaArchivo) return { titulo, tipo, url: actual.url, texto: null };
  throw new HttpError(400, 'Escriba el enlace de YouTube o Vimeo, o suba un archivo MP4');
}

async function crear(moduloId, datos, archivo) {
  await buscarModulo(moduloId);
  const preparado = prepararDatos(datos, archivo);
  const ultimo = await prisma.contenido.aggregate({ where: { moduloId }, _max: { orden: true } });
  return prisma.contenido.create({ data: { ...preparado, moduloId, orden: (ultimo._max.orden ?? 0) + 1 } });
}

async function actualizar(id, datos, archivo) {
  const actual = await buscarPorId(id);
  const preparado = prepararDatos(datos, archivo, actual);
  const contenido = await prisma.contenido.update({ where: { id }, data: preparado });
  // Si el archivo cambió o se reemplazó por un enlace, se borra el anterior
  if (actual.url !== contenido.url) borrarArchivo(actual.url);
  return contenido;
}

async function eliminar(id) {
  const contenido = await buscarPorId(id);
  await verificarSinAsignaciones(contenido.modulo.programaId, 'eliminar sus contenidos');
  await prisma.contenido.delete({ where: { id } });
  borrarArchivo(contenido.url);
  const restantes = await prisma.contenido.findMany({ where: { moduloId: contenido.moduloId }, orderBy: { orden: 'asc' } });
  await prisma.$transaction(restantes.map((c, i) => prisma.contenido.update({ where: { id: c.id }, data: { orden: i + 1 } })));
}

// HU-06: los contenidos se reordenan arrastrándolos
async function ordenar(moduloId, ids) {
  const contenidos = await prisma.contenido.findMany({ where: { moduloId }, select: { id: true } });
  if (!mismosIds(contenidos.map((c) => c.id), ids)) {
    throw new HttpError(400, 'La lista de contenidos no coincide con la del módulo. Recargue la página.');
  }
  await prisma.$transaction(ids.map((id, i) => prisma.contenido.update({ where: { id }, data: { orden: i + 1 } })));
}

module.exports = { CARPETA, crear, actualizar, eliminar, ordenar };
