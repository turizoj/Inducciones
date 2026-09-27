const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { frontendUrl } = require('../config');
const { HttpError } = require('../utils/errores');
const { enviarCorreo } = require('../utils/correo');
const { leerCsv } = require('../utils/csv');
const { normalizar } = require('../utils/textos');
const { esquemaUsuario } = require('../schemas/usuarios.schema');

const HORAS_ENLACE_BIENVENIDA = 72;
const MAX_FILAS_CSV = 1000;

const incluir = { rol: true, cargo: { include: { area: true } } };

// Datos que se envían al navegador (sin contraseña ni tokens)
function formatear(u) {
  return {
    id: u.id,
    documento: u.documento,
    nombres: u.nombres,
    apellidos: u.apellidos,
    email: u.email,
    telefono: u.telefono,
    fechaIngreso: u.fechaIngreso.toISOString().slice(0, 10),
    estado: u.estado,
    ultimoAcceso: u.ultimoAcceso,
    rol: { id: u.rol.id, nombre: u.rol.nombre },
    cargo: u.cargo ? { id: u.cargo.id, nombre: u.cargo.nombre } : null,
    area: u.cargo ? { id: u.cargo.area.id, nombre: u.cargo.area.nombre } : null,
  };
}

async function listar({ buscar, rolId, areaId, estado, pagina, porPagina }) {
  const where = {
    ...(buscar && {
      OR: [
        { nombres: { contains: buscar } },
        { apellidos: { contains: buscar } },
        { documento: { contains: buscar } },
        { email: { contains: buscar } },
      ],
    }),
    ...(rolId && { rolId }),
    ...(areaId && { cargo: { areaId } }),
    ...(estado && { estado }),
  };
  const [total, usuarios] = await prisma.$transaction([
    prisma.usuario.count({ where }),
    prisma.usuario.findMany({
      where,
      include: incluir,
      orderBy: [{ apellidos: 'asc' }, { nombres: 'asc' }],
      skip: (pagina - 1) * porPagina,
      take: porPagina,
    }),
  ]);
  return { datos: usuarios.map(formatear), total, pagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) };
}

async function buscarPorId(id) {
  const usuario = await prisma.usuario.findUnique({ where: { id }, include: incluir });
  if (!usuario) throw new HttpError(404, 'Usuario no encontrado');
  return usuario;
}

async function obtener(id) {
  return formatear(await buscarPorId(id));
}

// HU-03: documento y correo no se repiten; los que no son administradores necesitan cargo
async function validarDatos({ documento, email, rolId, cargoId }, actual) {
  const repetido = await prisma.usuario.findFirst({
    where: { OR: [{ documento }, { email }], ...(actual && { NOT: { id: actual.id } }) },
  });
  if (repetido?.documento === documento) throw new HttpError(409, `Ya existe un usuario con el documento ${documento}`);
  if (repetido) throw new HttpError(409, `Ya existe un usuario con el correo ${email}`);

  const rol = await prisma.rol.findUnique({ where: { id: rolId } });
  if (!rol) throw new HttpError(400, 'El rol seleccionado no existe');
  if (rol.nombre !== 'Administrador' && !cargoId) throw new HttpError(400, 'Seleccione el cargo del usuario');

  // Solo se exige que el cargo esté activo cuando se asigna uno nuevo
  if (cargoId && cargoId !== actual?.cargoId) {
    const cargo = await prisma.cargo.findUnique({ where: { id: cargoId }, include: { area: true } });
    if (!cargo) throw new HttpError(400, 'El cargo seleccionado no existe');
    if (cargo.estado !== 'activo' || cargo.area.estado !== 'activo') {
      throw new HttpError(400, 'El cargo o su área están inactivos');
    }
  }
  return rol;
}

// Contraseña que nadie conoce: el usuario crea la suya con el enlace de bienvenida
function contrasenaAleatoria() {
  return bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
}

function tokenDeBienvenida() {
  const token = crypto.randomBytes(32).toString('hex');
  return {
    token,
    datos: {
      resetTokenHash: crypto.createHash('sha256').update(token).digest('hex'),
      resetTokenExpira: new Date(Date.now() + HORAS_ENLACE_BIENVENIDA * 3600000),
    },
  };
}

function enviarBienvenida(usuario, token) {
  return enviarCorreo({
    para: usuario.email,
    asunto: 'Bienvenido a SIGEIN',
    texto:
      `Hola ${usuario.nombres}, se creó su usuario en SIGEIN, el sistema de inducciones de la empresa.\n` +
      `Para crear su contraseña ingrese a:\n${frontendUrl}/restablecer?token=${token}&bienvenida=1\n` +
      `El enlace vence en ${HORAS_ENLACE_BIENVENIDA} horas. Luego inicie sesión con el correo ${usuario.email}.`,
  });
}

async function crear(datos) {
  await validarDatos(datos);
  const { token, datos: datosToken } = tokenDeBienvenida();
  const usuario = await prisma.usuario.create({
    data: {
      ...datos,
      fechaIngreso: new Date(datos.fechaIngreso),
      passwordHash: await contrasenaAleatoria(),
      ...datosToken,
    },
    include: incluir,
  });
  await enviarBienvenida(usuario, token);
  return formatear(usuario);
}

async function actualizar(id, datos, idActor) {
  const actual = await buscarPorId(id);
  const rol = await validarDatos(datos, actual);
  if (id === idActor && rol.nombre !== 'Administrador') {
    throw new HttpError(400, 'No puede quitarse a sí mismo el rol de Administrador');
  }
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { ...datos, fechaIngreso: new Date(datos.fechaIngreso) },
    include: incluir,
  });
  return formatear(usuario);
}

async function cambiarEstado(id, estado, idActor) {
  await buscarPorId(id);
  if (id === idActor && estado === 'inactivo') throw new HttpError(400, 'No puede inactivar su propio usuario');
  return formatear(await prisma.usuario.update({ where: { id }, data: { estado }, include: incluir }));
}

// Nombres de columna aceptados en el CSV (sin tildes, espacios ni guiones)
const COLUMNAS = {
  documento: 'documento',
  nombres: 'nombres',
  apellidos: 'apellidos',
  email: 'email',
  correo: 'email',
  correoelectronico: 'email',
  telefono: 'telefono',
  fechaingreso: 'fechaIngreso',
  fechadeingreso: 'fechaIngreso',
  rol: 'rol',
  area: 'area',
  cargo: 'cargo',
};
const COLUMNAS_OBLIGATORIAS = ['documento', 'nombres', 'apellidos', 'email', 'fechaIngreso', 'rol', 'area', 'cargo'];

// Acepta AAAA-MM-DD y también DD/MM/AAAA, que es como Excel suele guardar las fechas
function fechaIso(valor) {
  const m = String(valor).trim().match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : String(valor).trim();
}

// HU-03: carga masiva desde CSV con resumen de filas cargadas y filas con error
async function importar(textoCsv) {
  const [encabezado, ...filas] = leerCsv(textoCsv);
  if (!encabezado || filas.length === 0) throw new HttpError(400, 'El archivo no tiene filas para cargar');
  if (filas.length > MAX_FILAS_CSV) throw new HttpError(400, `El archivo supera el máximo de ${MAX_FILAS_CSV} filas`);

  const columnas = encabezado.map((c) => COLUMNAS[normalizar(c).replace(/[^a-z]/g, '')]);
  const faltantes = COLUMNAS_OBLIGATORIAS.filter((c) => !columnas.includes(c));
  if (faltantes.length) {
    throw new HttpError(400, `Faltan columnas en el archivo: ${faltantes.join(', ')}. Descargue la plantilla de ejemplo.`);
  }

  const [roles, cargos, existentes] = await Promise.all([
    prisma.rol.findMany(),
    prisma.cargo.findMany({ include: { area: true } }),
    prisma.usuario.findMany({ select: { documento: true, email: true } }),
  ]);
  const documentos = new Set(existentes.map((u) => u.documento));
  const correos = new Set(existentes.map((u) => u.email));
  const passwordHash = await contrasenaAleatoria();

  const errores = [];
  let cargados = 0;

  for (const [i, fila] of filas.entries()) {
    const numeroFila = i + 2; // la fila 1 es el encabezado
    const valores = {};
    columnas.forEach((c, j) => {
      if (c) valores[c] = (fila[j] || '').trim();
    });

    const problemas = [];
    const rol = roles.find((r) => normalizar(r.nombre) === normalizar(valores.rol));
    if (!rol) problemas.push(`El rol "${valores.rol}" no existe`);

    let cargo = null;
    if (valores.area || valores.cargo) {
      cargo = cargos.find(
        (c) => normalizar(c.area.nombre) === normalizar(valores.area) && normalizar(c.nombre) === normalizar(valores.cargo),
      );
      if (!cargo) problemas.push(`No existe el cargo "${valores.cargo}" en el área "${valores.area}"`);
      else if (cargo.estado !== 'activo' || cargo.area.estado !== 'activo') problemas.push('El cargo o su área están inactivos');
    } else if (rol && rol.nombre !== 'Administrador') {
      problemas.push('Escriba el área y el cargo');
    }

    const resultado = esquemaUsuario.safeParse({
      ...valores,
      fechaIngreso: fechaIso(valores.fechaIngreso),
      rolId: rol?.id ?? 0,
      cargoId: cargo?.id ?? null,
    });
    if (!resultado.success) {
      problemas.push(...resultado.error.issues.filter((p) => p.path[0] !== 'rolId').map((p) => p.message));
    }

    // Se revisa aunque la fila tenga otros errores, para avisar todo de una vez
    const documento = valores.documento;
    const email = valores.email.toLowerCase();
    if (documento && documentos.has(documento)) problemas.push(`El documento ${documento} ya está registrado o se repite en el archivo`);
    if (email && correos.has(email)) problemas.push(`El correo ${email} ya está registrado o se repite en el archivo`);

    if (problemas.length) {
      errores.push({ fila: numeroFila, documento: valores.documento || '', errores: problemas });
      continue;
    }

    const datos = resultado.data;
    const { token, datos: datosToken } = tokenDeBienvenida();
    const usuario = await prisma.usuario.create({
      data: { ...datos, fechaIngreso: new Date(datos.fechaIngreso), passwordHash, ...datosToken },
    });
    documentos.add(datos.documento);
    correos.add(datos.email);
    cargados++;
    await enviarBienvenida(usuario, token);
  }

  return { totalFilas: filas.length, cargados, errores };
}

async function listarRoles() {
  return prisma.rol.findMany({ orderBy: { id: 'asc' } });
}

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, importar, listarRoles };
