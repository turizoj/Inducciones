// Datos de demostración: inducción completa de la empresa ficticia Andina Logística S.A.S.
// Crea áreas, cargos, usuarios, 4 programas con módulos, contenidos y evaluaciones, asignaciones y avance de ejemplo.
// Uso (con el backend encendido y la semilla aplicada): npm run demo
// Se puede ejecutar varias veces: no duplica usuarios, programas ni asignaciones.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import prismaCliente from '@prisma/client';

const API = process.env.API_URL || 'http://localhost:4000/api';
const MATERIAL = fileURLToPath(new URL('./material', import.meta.url));
const prisma = new prismaCliente.PrismaClient();

async function api(token, metodo, ruta, cuerpo, esForm = false) {
  const res = await fetch(API + ruta, {
    method: metodo,
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(cuerpo && !esForm ? { 'Content-Type': 'application/json' } : {}) },
    body: cuerpo ? (esForm ? cuerpo : JSON.stringify(cuerpo)) : undefined,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${metodo} ${ruta} -> ${res.status} ${JSON.stringify(datos)}`);
  return datos;
}
const lista = (d) => (Array.isArray(d) ? d : d.datos || []);
const login = async (email, password) => (await api(null, 'POST', '/auth/login', { email, password })).token;
const archivo = (nombre, tipo) => new Blob([readFileSync(`${MATERIAL}/${nombre}`)], { type: tipo });

// ---------------- Estructura ----------------
const AREAS = [
  ['Talento Humano', 'Gestión del personal, nómina y bienestar'],
  ['Operaciones', 'Bodegas, inventario y transporte'],
  ['Comercial', 'Clientes, ventas y servicio'],
  ['Tecnología', 'Sistemas de información y soporte'],
];
const CARGOS = [
  ['Analista de Talento Humano', 'Talento Humano'],
  ['Jefe de operaciones', 'Operaciones'],
  ['Auxiliar de bodega', 'Operaciones'],
  ['Coordinador logístico', 'Operaciones'],
  ['Asesor comercial', 'Comercial'],
  ['Desarrollador de software', 'Tecnología'],
];
const PERSONAS = [
  ['1037654321', 'Mariana', 'Restrepo', 'mariana.restrepo@inducta.com', 'Analista de Talento Humano', 'Colaborador'],
  ['1017223344', 'Felipe', 'Ríos', 'felipe.rios@inducta.com', 'Jefe de operaciones', 'Jefe de área'],
  ['1036889900', 'Juan Camilo', 'Arango', 'juan.arango@inducta.com', 'Auxiliar de bodega', 'Colaborador'],
  ['1040112233', 'Daniela', 'Ospina', 'daniela.ospina@inducta.com', 'Auxiliar de bodega', 'Colaborador'],
  ['1020445566', 'Santiago', 'Mejía', 'santiago.mejia@inducta.com', 'Coordinador logístico', 'Colaborador'],
  ['1152778899', 'Valentina', 'Cardona', 'valentina.cardona@inducta.com', 'Asesor comercial', 'Colaborador'],
  ['1001998877', 'Sebastián', 'Londoño', 'sebastian.londono@inducta.com', 'Desarrollador de software', 'Colaborador'],
];

async function estructura() {
  const t = await login('admin@inducta.com', 'Admin123*');
  const roles = lista(await api(t, 'GET', '/usuarios/roles'));
  const rol = (n) => roles.find((r) => r.nombre === n).id;

  const areas = Object.fromEntries(lista(await api(t, 'GET', '/areas')).map((a) => [a.nombre, a.id]));
  for (const [nombre, descripcion] of AREAS) {
    if (!areas[nombre]) areas[nombre] = (await api(t, 'POST', '/areas', { nombre, descripcion })).id;
  }
  const cargos = Object.fromEntries(lista(await api(t, 'GET', '/cargos')).map((c) => [c.nombre, c.id]));
  for (const [nombre, area] of CARGOS) {
    if (!cargos[nombre]) cargos[nombre] = (await api(t, 'POST', '/cargos', { nombre, areaId: areas[area] })).id;
  }
  for (const [documento, nombres, apellidos, email, cargo, r] of PERSONAS) {
    try {
      await api(t, 'POST', '/usuarios', { documento, nombres, apellidos, email, telefono: '3001234567', fechaIngreso: '2026-11-03', rolId: rol(r), cargoId: cargos[cargo] });
      console.log(`Usuario: ${nombres} ${apellidos}`);
    } catch (e) {
      if (!String(e).includes('409')) throw e;
    }
  }
  // Felipe Ríos dirige Operaciones
  const felipe = lista(await api(t, 'GET', '/usuarios?buscar=felipe.rios')).find((u) => u.email === 'felipe.rios@inducta.com');
  await api(t, 'PUT', `/areas/${areas['Operaciones']}`, { nombre: 'Operaciones', descripcion: 'Bodegas, inventario y transporte', jefeId: felipe.id });

  // Contraseñas de demostración (en uso real cada persona la crea con el correo de bienvenida)
  const colaborador = await bcrypt.hash('Colab123*', 10);
  const jefe = await bcrypt.hash('Jefe123*', 10);
  for (const [, , , email, , r] of PERSONAS) {
    await prisma.usuario.update({ where: { email }, data: { passwordHash: r === 'Jefe de área' ? jefe : colaborador } });
  }
  console.log('Estructura lista');
}

// ---------------- Programas ----------------
const vf = (enunciado, verdadero) => ({ enunciado, tipo: 'verdadero_falso', opciones: [{ texto: 'Verdadero', esCorrecta: verdadero }, { texto: 'Falso', esCorrecta: !verdadero }] });
const unica = (enunciado, opciones, correcta) => ({ enunciado, tipo: 'unica', opciones: opciones.map((texto, i) => ({ texto, esCorrecta: i === correcta })) });
const multiple = (enunciado, opciones, correctas) => ({ enunciado, tipo: 'multiple', opciones: opciones.map((texto, i) => ({ texto, esCorrecta: correctas.includes(i) })) });
const video = (titulo, id) => ({ titulo, tipo: 'video', url: `https://www.youtube.com/watch?v=${id}` });
const pdf = (titulo, nombre) => ({ titulo, tipo: 'pdf', archivo: nombre });
const imagen = (titulo, nombre) => ({ titulo, tipo: 'imagen', archivo: nombre });
const enlace = (titulo, url) => ({ titulo, tipo: 'enlace', url });
const texto = (titulo, html) => ({ titulo, tipo: 'texto', texto: html });

const PROGRAMAS = [
  {
    titulo: 'Bienvenido a Andina Logística',
    descripcion: 'Inducción corporativa: nuestra historia, cómo trabajamos y los beneficios que tienes desde el primer día.',
    horas: 6, obligatorio: true, portada: 'portada-corporativa.png',
    modulos: [
      {
        titulo: 'Quiénes somos', descripcion: 'Historia, misión, visión, valores y organigrama.',
        contenidos: [
          texto('Mensaje de bienvenida', `<h2>¡Bienvenido a la familia Andina!</h2><p>Hoy empiezas a hacer parte de un equipo de <strong>320 personas</strong> que todos los días conecta a 180 empresas con sus clientes en 12 ciudades de Colombia.</p><p>Esta inducción te va a mostrar quiénes somos, cómo trabajamos y qué esperamos de ti. Tómate tu tiempo: al final de cada módulo hay una evaluación corta.</p><blockquote>«Ningún envío vale más que una persona. Cuídate y cuida a tu equipo.» — Gerencia General</blockquote>`),
          pdf('Conócenos: historia, valores y organigrama', 'conocenos-andina-logistica.pdf'),
          imagen('Organigrama de Andina Logística', 'organigrama-andina-logistica.png'),
          video('Video: el trabajo en equipo (corto «El Puente»)', 'gQiaAb6VGt8'),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 10, preguntas: [
          unica('¿En qué año se fundó Andina Logística?', ['2009', '2013', '2017', '2021'], 0),
          multiple('¿Cuáles son valores de Andina Logística?', ['Compromiso', 'Integridad', 'Rapidez a cualquier costo', 'Seguridad'], [0, 1, 3]),
          vf('Cada área tiene un jefe que acompaña tu proceso de inducción.', true),
          unica('Según el corto «El Puente», ¿qué permite a los personajes cruzar?', ['Competir entre ellos', 'Cooperar y ceder el paso', 'Esperar a que otro se rinda'], 1),
        ] },
      },
      {
        titulo: 'Cómo trabajamos', descripcion: 'Horarios, canales de comunicación y normas de convivencia.',
        contenidos: [
          texto('Horarios, canales y convivencia', `<h2>Horarios</h2><ul><li><strong>Administrativos:</strong> lunes a viernes, entrada flexible entre 7:00 y 9:00 a. m., jornada de 8 horas.</li><li><strong>Operaciones:</strong> turnos rotativos de 6:00 a. m. a 2:00 p. m. y de 2:00 p. m. a 10:00 p. m.</li></ul><h2>Canales de comunicación</h2><ul><li>Correo corporativo para solicitudes formales.</li><li>Reunión de equipo los lunes a las 8:00 a. m.</li><li>Línea ética confidencial: etica@andinalogistica.com.co</li></ul><h2>Normas de convivencia</h2><p>Trato respetuoso, puntualidad, uso del carné visible y cero tolerancia al acoso laboral.</p>`),
          video('Video: el poder del trabajo en equipo', 'yKo5pNtu8c4'),
          enlace('Ministerio del Trabajo: derechos y deberes laborales', 'https://www.mintrabajo.gov.co/'),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 8, preguntas: [
          unica('¿Entre qué horas es la entrada flexible del personal administrativo?', ['6:00 y 8:00 a. m.', '7:00 y 9:00 a. m.', '8:00 y 10:00 a. m.'], 1),
          vf('La línea ética es confidencial.', true),
          unica('¿Cuándo es la reunión semanal de equipo?', ['Lunes 8:00 a. m.', 'Viernes 4:00 p. m.', 'Miércoles al mediodía'], 0),
        ] },
      },
      {
        titulo: 'Beneficios y bienestar', descripcion: 'Lo que la empresa tiene para ti y cómo solicitarlo.',
        contenidos: [
          pdf('Guía de beneficios 2026', 'guia-de-beneficios-2026.pdf'),
          texto('¿Cómo solicitar un beneficio?', `<p>Escribe a <strong>talentohumano@andinalogistica.com.co</strong> con el asunto «Beneficio + tu nombre». Talento Humano responde en máximo <strong>3 días hábiles</strong>.</p><p>Los auxilios educativos se aprueban dos veces al año: en <strong>febrero</strong> y en <strong>agosto</strong>.</p>`),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 5, preguntas: [
          vf('El día de tu cumpleaños tienes un día libre remunerado.', true),
          unica('¿Qué porcentaje de la matrícula cubre el auxilio educativo?', ['Hasta el 25 %', 'Hasta el 50 %', 'El 100 %'], 1),
          unica('¿En cuánto tiempo responde Talento Humano una solicitud de beneficio?', ['El mismo día', 'Máximo 3 días hábiles', 'Un mes'], 1),
        ] },
      },
    ],
  },
  {
    titulo: 'Seguridad y Salud en el Trabajo',
    descripcion: 'Inducción obligatoria del SG-SST (Decreto 1072 de 2015): derechos y deberes, pausas activas y plan de emergencias.',
    horas: 4, obligatorio: true, portada: 'portada-sst.png',
    modulos: [
      {
        titulo: '¿Qué es el SG-SST?', descripcion: 'El sistema que cuida tu salud y tu seguridad.',
        contenidos: [
          video('Aplicación del SG-SST (SENA y Ministerio del Trabajo)', '5ylCiR7-t1g'),
          texto('Tus derechos y deberes', `<h2>Tus derechos</h2><ul><li>Estar afiliado a una ARL desde el primer día.</li><li>Recibir elementos de protección personal sin costo.</li><li>Conocer los peligros de tu puesto de trabajo.</li></ul><h2>Tus deberes</h2><ul><li>Cumplir las normas y procedimientos de seguridad.</li><li>Usar los elementos de protección.</li><li>Reportar de inmediato cualquier accidente o incidente a tu jefe y a SST.</li></ul><p><strong>Accidente de trabajo:</strong> repórtalo en las primeras 24 horas. La empresa lo informa a la ARL en máximo 2 días hábiles.</p>`),
          enlace('Fondo de Riesgos Laborales de Colombia', 'https://www.fondoriesgoslaborales.gov.co/'),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 10, preguntas: [
          vf('Debes estar afiliado a la ARL desde tu primer día de trabajo.', true),
          unica('¿En cuánto tiempo debes reportar un accidente de trabajo?', ['En las primeras 24 horas', 'En una semana', 'Solo si hay incapacidad'], 0),
          multiple('¿Cuáles son deberes del trabajador en el SG-SST?', ['Usar los elementos de protección', 'Reportar incidentes', 'Comprar su propio casco', 'Cumplir los procedimientos'], [0, 1, 3]),
          vf('Los elementos de protección personal los paga el trabajador.', false),
        ] },
      },
      {
        titulo: 'Pausas activas y ergonomía', descripcion: 'Cuida tu cuerpo durante la jornada.',
        contenidos: [
          pdf('Tu puesto de trabajo ergonómico', 'puesto-de-trabajo-ergonomico.pdf'),
          video('Pausa activa de 5 minutos en la oficina', '4PJtqNmFevE'),
          video('Ejercicios de cabeza y cuello (Mapfre)', 'WsoVhk7gnMo'),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 6, preguntas: [
          unica('¿Cada cuánto se recomienda hacer una pausa activa?', ['Cada 2 horas', 'Una vez al día', 'Solo cuando duele algo'], 0),
          unica('¿A qué altura debe estar la pantalla?', ['A la altura de los ojos', 'Por debajo del mentón', 'Por encima de la cabeza'], 0),
          vf('En la regla 20-20-20 miras un punto lejano durante 20 segundos.', true),
        ] },
      },
      {
        titulo: 'Plan de emergencias', descripcion: 'Rutas de evacuación, punto de encuentro y brigada.',
        contenidos: [
          imagen('Plano de evacuación · Sede Medellín', 'plano-de-evacuacion-sede-medellin.png'),
          pdf('Plan de emergencias · Sede Medellín', 'plan-de-emergencias-sede-medellin.pdf'),
          video('¿Sabes qué hacer en una emergencia?', 'iUZefC7cQVg'),
          texto('Brigada de emergencias', `<p>Cada piso tiene un <strong>brigadista</strong> identificado con chaleco rojo. En una evacuación, sigue sus instrucciones.</p><ul><li><strong>Línea nacional de emergencias:</strong> 123</li><li><strong>Brigada interna:</strong> extensión 911</li><li><strong>Simulacro:</strong> se realiza dos veces al año; participar es obligatorio.</li></ul>`),
        ],
        evaluacion: { notaMinima: 4, intentosMax: 2, tiempoLimiteMin: 8, preguntas: [
          vf('En una evacuación se puede usar el ascensor si está libre.', false),
          unica('¿A dónde debes ir después de evacuar?', ['Al punto de encuentro', 'A tu casa', 'Al parqueadero'], 0),
          unica('¿Cuál es la línea nacional de emergencias?', ['123', '018000', '911'], 0),
          multiple('¿Qué debes hacer ANTES de una emergencia?', ['Ubicar las salidas', 'Conocer a tu brigadista', 'Esconder el extintor', 'Saber dónde está el extintor'], [0, 1, 3]),
        ] },
      },
    ],
  },
  {
    titulo: 'Protección de datos y seguridad digital',
    descripcion: 'Ley 1581 de 2012, contraseñas seguras y cómo reconocer un correo de phishing.',
    horas: 3, obligatorio: true, portada: 'portada-datos.png',
    modulos: [
      {
        titulo: 'Ley 1581 de 2012', descripcion: 'Cómo tratamos los datos personales de clientes y colaboradores.',
        contenidos: [
          video('Protección de datos en Colombia: Ley 1581 de 2012', 'Y3JzdNEi568'),
          texto('Principios y derechos', `<h2>Principios que aplicamos</h2><p>Legalidad, finalidad, libertad, veracidad, transparencia, acceso restringido, seguridad y confidencialidad.</p><h2>Derechos del titular</h2><ul><li><strong>Conocer</strong> qué datos suyos tenemos.</li><li><strong>Actualizar y rectificar</strong> sus datos.</li><li><strong>Revocar</strong> la autorización y pedir que se borren.</li><li><strong>Quejarse</strong> ante la Superintendencia de Industria y Comercio.</li></ul><p>En Andina solo usamos los datos de los clientes para prestar el servicio contratado. Nunca los compartas por WhatsApp ni los guardes en tu computador personal.</p>`),
          enlace('Superintendencia de Industria y Comercio: protección de datos', 'https://www.sic.gov.co/tema/proteccion-de-datos-personales'),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 8, preguntas: [
          vf('Se necesita autorización del titular para tratar sus datos personales.', true),
          unica('¿Qué entidad vigila la protección de datos en Colombia?', ['Superintendencia de Industria y Comercio', 'DIAN', 'Ministerio de Transporte'], 0),
          multiple('¿Cuáles son derechos del titular de los datos?', ['Conocer sus datos', 'Rectificarlos', 'Venderlos a terceros', 'Revocar la autorización'], [0, 1, 3]),
        ] },
      },
      {
        titulo: 'Seguridad digital', descripcion: 'Contraseñas, phishing y buenas prácticas.',
        contenidos: [
          video('Ciberseguridad en la empresa', 'uhVAklKRM54'),
          pdf('10 reglas de seguridad digital', '10-reglas-de-seguridad-digital.pdf'),
          imagen('¿Cómo reconocer un correo de phishing?', 'como-reconocer-un-correo-de-phishing.png'),
          video('Cómo crear contraseñas seguras', 'Mo_iddRc16k'),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 8, preguntas: [
          unica('¿Cuántos caracteres debe tener como mínimo una contraseña segura?', ['6', '8', '12'], 2),
          multiple('¿Qué señales indican que un correo puede ser phishing?', ['Dominio parecido pero falso', 'Urgencia o amenazas', 'Enlaces acortados', 'Viene de tu jefe con su correo corporativo real'], [0, 1, 2]),
          vf('Puedes compartir tu contraseña con soporte de TI si te la piden por correo.', false),
          unica('¿Qué combinación bloquea tu equipo con Windows?', ['Windows + L', 'Ctrl + C', 'Alt + F4'], 0),
        ] },
      },
    ],
  },
  {
    titulo: 'Inducción al cargo: Auxiliar de bodega',
    descripcion: 'Inducción específica del cargo: manipulación segura de cargas, orden en bodega y elementos de protección.',
    horas: 3, obligatorio: true, portada: 'portada-bodega.png',
    modulos: [
      {
        titulo: 'Manipulación segura de cargas', descripcion: 'Técnica correcta para levantar y transportar.',
        contenidos: [
          video('Manipulación manual de cargas: recomendaciones (INSST)', '3BP62XEoEUI'),
          imagen('Levantamiento seguro en 4 pasos', 'levantamiento-seguro-de-cargas.png'),
          pdf('Manual del auxiliar de bodega', 'manual-del-auxiliar-de-bodega.pdf'),
          video('Cómo manipular cargas correctamente', 'TWglucdnMEM'),
        ],
        evaluacion: { notaMinima: 3.5, intentosMax: 3, tiempoLimiteMin: 8, preguntas: [
          unica('¿Cuál es el peso máximo que debe levantar una persona sola?', ['15 kg', '25 kg', '50 kg'], 1),
          unica('Al levantar una carga, ¿con qué haces la fuerza?', ['Con la espalda', 'Con las piernas', 'Con los brazos estirados'], 1),
          vf('Al transportar una carga se debe girar el tronco para avanzar más rápido.', false),
        ] },
      },
      {
        titulo: 'Seguridad en bodega', descripcion: 'Orden, montacargas y elementos de protección personal.',
        contenidos: [
          video('Seguridad en bodegas (Positiva ARL)', 'SIAlN50AASQ'),
          texto('Reglas de oro de la bodega', `<ol><li>Pasillos libres: nada en el piso fuera de las zonas demarcadas.</li><li>Las estibas no superan la franja amarilla de altura.</li><li>Los peatones caminan solo por la franja verde; el montacargas tiene la prelación.</li><li>Casco, botas, guantes y chaleco reflectivo en todo momento.</li><li>Si ves un derrame o una estiba dañada, repórtalo al coordinador logístico.</li></ol>`),
        ],
        evaluacion: { notaMinima: 4, intentosMax: 2, tiempoLimiteMin: 6, preguntas: [
          multiple('¿Qué elementos de protección son obligatorios en bodega?', ['Casco', 'Botas de seguridad', 'Audífonos de música', 'Chaleco reflectivo'], [0, 1, 3]),
          vf('Los peatones pueden cruzar por cualquier lugar si el montacargas va despacio.', false),
          unica('¿A quién reportas una estiba dañada?', ['Al coordinador logístico', 'A nadie, la acomodas tú', 'Al cliente'], 0),
        ] },
      },
    ],
  },
];

async function programas() {
  const t = await login('admin@inducta.com', 'Admin123*');
  const existentes = lista(await api(t, 'GET', '/programas')).map((p) => p.titulo);
  const ids = {};
  for (const p of PROGRAMAS) {
    if (existentes.includes(p.titulo)) continue;
    const prog = await api(t, 'POST', '/programas', { titulo: p.titulo, descripcion: p.descripcion, duracionHoras: p.horas, obligatorio: p.obligatorio });
    const f = new FormData();
    f.set('imagen', archivo(p.portada, 'image/png'), p.portada);
    await api(t, 'POST', `/programas/${prog.id}/imagen`, f, true);
    for (const m of p.modulos) {
      const mod = await api(t, 'POST', `/programas/${prog.id}/modulos`, { titulo: m.titulo, descripcion: m.descripcion });
      for (const c of m.contenidos) {
        const fc = new FormData();
        fc.set('titulo', c.titulo);
        fc.set('tipo', c.tipo);
        if (c.url) fc.set('url', c.url);
        if (c.texto) fc.set('texto', c.texto);
        if (c.archivo) fc.set('archivo', archivo(c.archivo, c.tipo === 'imagen' ? 'image/png' : 'application/pdf'), c.archivo);
        await api(t, 'POST', `/modulos/${mod.id}/contenidos`, fc, true);
      }
      await api(t, 'PUT', `/modulos/${mod.id}/evaluacion`, m.evaluacion);
    }
    await api(t, 'PATCH', `/programas/${prog.id}/estado`, { estado: 'publicado' });
    ids[p.titulo] = prog.id;
    console.log(`Programa publicado: ${p.titulo}`);
  }

  // Asignaciones
  const areas = Object.fromEntries(lista(await api(t, 'GET', '/areas')).map((a) => [a.nombre, a.id]));
  const cargos = Object.fromEntries(lista(await api(t, 'GET', '/cargos')).map((c) => [c.nombre, c.id]));
  const progs = Object.fromEntries(lista(await api(t, 'GET', '/programas')).map((p) => [p.titulo, p.id]));
  // Un programa que ya tiene asignaciones no se vuelve a asignar: la API permite repetir
  // las inducciones completadas, y una segunda ejecución las duplicaría
  const yaAsignados = new Set(
    (await prisma.asignacion.findMany({ select: { programaId: true }, distinct: ['programaId'] })).map((a) => a.programaId),
  );
  const asignar = async (titulo, cuerpo) => {
    if (yaAsignados.has(progs[titulo])) return;
    const r = await api(t, 'POST', '/asignaciones', { programaId: progs[titulo], ...cuerpo });
    console.log(`Asignado «${titulo}»: ${r.asignados.length} nuevas, ${r.omitidos.length} omitidas`);
  };
  for (const area of Object.keys(areas)) {
    await asignar('Bienvenido a Andina Logística', { modo: 'area', areaId: areas[area], fechaLimite: '2026-11-30' });
    await asignar('Seguridad y Salud en el Trabajo', { modo: 'area', areaId: areas[area], fechaLimite: '2026-12-04' });
    await asignar('Protección de datos y seguridad digital', { modo: 'area', areaId: areas[area], fechaLimite: '2026-12-11' });
  }
  await asignar('Inducción al cargo: Auxiliar de bodega', { modo: 'cargo', cargoId: cargos['Auxiliar de bodega'], fechaLimite: '2026-11-27' });
}

// ---------------- Avance de ejemplo ----------------
async function avanzar(email, plan, { fallarPrimero = false } = {}) {
  const admin = await login('admin@inducta.com', 'Admin123*');
  const t = await login(email, 'Colab123*');
  await api(t, 'POST', '/auth/aceptar-datos');
  const mias = lista(await api(t, 'GET', '/mis-inducciones'));
  for (const [titulo, pasos] of Object.entries(plan)) {
    const asig = mias.find((a) => a.programa.titulo === titulo);
    if (!asig) continue;
    const detalle = await api(t, 'GET', `/mis-inducciones/${asig.id}`);
    let restantes = pasos;
    for (const m of detalle.modulos) {
      for (const c of m.contenidos) {
        if (restantes-- <= 0) break;
        await api(t, 'POST', `/progreso/${c.id}`, { asignacionId: asig.id }).catch(() => {});
      }
      if (restantes <= 0) break;
      if (m.evaluacion && m.evaluacion.aprobada) {
        restantes--;
      } else if (m.evaluacion) {
        restantes--;
        const ev = (await api(admin, 'GET', `/modulos/${m.id}/evaluacion`)).evaluacion;
        const correctas = ev.preguntas.map((p) => ({ preguntaId: p.id, opcionIds: p.opciones.filter((o) => o.esCorrecta).map((o) => o.id) }));
        if (fallarPrimero) {
          const malo = await api(t, 'POST', `/evaluaciones/${m.evaluacion.id}/intentos`, { asignacionId: asig.id });
          const incorrectas = ev.preguntas.map((p) => ({ preguntaId: p.id, opcionIds: [p.opciones.find((o) => !o.esCorrecta).id] }));
          const r0 = await api(t, 'POST', `/evaluaciones/intentos/${malo.intentoId}/respuestas`, { respuestas: incorrectas });
          console.log(`  ${email} · ${m.titulo}: intento fallido, nota ${r0.nota}`);
          fallarPrimero = false;
        }
        const intento = await api(t, 'POST', `/evaluaciones/${m.evaluacion.id}/intentos`, { asignacionId: asig.id });
        // Una pregunta mal para que las notas no sean todas 5.0
        const respuestas = correctas.map((r, i) => (i === 0 && email.includes('juan') && m.titulo === 'Quiénes somos' ? { ...r, opcionIds: [ev.preguntas[0].opciones.find((o) => !o.esCorrecta).id] } : r));
        const r = await api(t, 'POST', `/evaluaciones/intentos/${intento.intentoId}/respuestas`, { respuestas });
        console.log(`  ${email} · ${m.titulo}: nota ${r.nota}`);
      }
    }
  }
  console.log(`Avance: ${email}`);
}

async function avance() {
  await avanzar('mariana.restrepo@inducta.com', { 'Bienvenido a Andina Logística': 99, 'Seguridad y Salud en el Trabajo': 99, 'Protección de datos y seguridad digital': 4 });
  await avanzar('juan.arango@inducta.com', { 'Bienvenido a Andina Logística': 99, 'Inducción al cargo: Auxiliar de bodega': 4 });
  await avanzar('daniela.ospina@inducta.com', { 'Bienvenido a Andina Logística': 3 }, { fallarPrimero: true });
  await avanzar('valentina.cardona@inducta.com', { 'Bienvenido a Andina Logística': 99, 'Protección de datos y seguridad digital': 99 });
  await avanzar('sebastian.londono@inducta.com', { 'Bienvenido a Andina Logística': 5, 'Protección de datos y seguridad digital': 99 });
  await avanzar('santiago.mejia@inducta.com', {});

  // Una inducción vencida para mostrar ese estado en reportes y tableros
  const santiago = await prisma.usuario.findUnique({ where: { email: 'santiago.mejia@inducta.com' } });
  const corporativa = await prisma.programa.findFirst({ where: { titulo: 'Bienvenido a Andina Logística' } });
  await prisma.asignacion.updateMany({
    where: { usuarioId: santiago.id, programaId: corporativa.id, porcentajeAvance: 0 },
    data: { fechaAsignacion: new Date('2026-10-27'), fechaLimite: new Date('2026-11-06') },
  });
}

try {
  await estructura();
  await programas();
  await avance();
  console.log('\nDemostración cargada. Usuarios: admin@inducta.com / Admin123*, felipe.rios@inducta.com / Jefe123*, colaboradores / Colab123*');
} finally {
  await prisma.$disconnect();
}
