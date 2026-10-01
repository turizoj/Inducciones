# SIGEIN · Sistema Web de Gestión de Inducciones Empresariales

SIGEIN permite a Talento Humano crear programas de inducción por módulos, cargar contenidos (videos, PDF, textos y enlaces), diseñar evaluaciones, asignar los programas por persona, área o cargo, seguir el avance en tiempo real y emitir certificados verificables con código QR.

| Parte | Tecnologías |
|---|---|
| Frontend (`sigein-frontend`) | React 19, Vite, Tailwind CSS, React Router, TanStack Query, React Hook Form + Zod, dnd-kit, TipTap |
| Backend (`sigein-backend`) | Node.js, Express 5, Prisma, MySQL 8, JWT, bcrypt, Zod, Multer, PDFKit, ExcelJS |

---

## 1. Manual técnico

### 1.1 Requisitos

- Node.js 20 LTS o superior
- MySQL 8 con un usuario que pueda crear tablas
- Un navegador actualizado (Chrome, Edge, Firefox o Safari)

### 1.2 Instalación

1. Cree la base de datos vacía en MySQL:
   ```sql
   CREATE DATABASE sigein_db CHARACTER SET utf8mb4;
   ```
2. Configure y prepare el **backend**:
   ```bash
   cd sigein-backend
   copy .env.example .env      # en macOS o Linux: cp .env.example .env
   ```
   Complete en `.env` los datos de conexión. Luego ejecute:
   ```bash
   npm install
   npx prisma migrate deploy   # crea las tablas
   npx prisma db seed          # crea los roles y los usuarios de prueba
   ```
3. Configure el **frontend**:
   ```bash
   cd ../sigein-frontend
   copy .env.example .env      # VITE_API_URL=http://localhost:4000/api
   npm install
   ```

Variables del backend (`sigein-backend/.env`):

| Variable | Para qué sirve | Ejemplo |
|---|---|---|
| `DATABASE_URL` | Conexión a MySQL | `mysql://usuario:clave@localhost:3306/sigein_db` |
| `JWT_SECRET` | Clave para firmar las sesiones (larga y secreta) | `una-clave-larga-y-aleatoria` |
| `JWT_EXPIRES_IN` | Duración de la sesión | `8h` |
| `PORT` | Puerto de la API | `4000` |
| `FRONTEND_URL` | Dirección del frontend (enlaces de correos y del QR) | `http://localhost:5173` |
| `EMPRESA_NOMBRE` | Nombre que aparece en certificados y reportes | `Mi Empresa S.A.S.` |

### 1.3 Encender el sistema

- **En Windows, con doble clic:** ejecute `Iniciar SIGEIN.bat`. Enciende MySQL, el backend y el frontend, y abre el navegador. Para apagar, cierre las ventanas "Backend" y "Frontend".
- **Manualmente:** en dos terminales, `npm run dev` dentro de `sigein-backend` (puerto 4000) y dentro de `sigein-frontend` (puerto 5173).

Usuarios de prueba que crea `npx prisma db seed`:

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | `admin@sigein.com` | `Admin123*` |
| Jefe de área | `jefe@sigein.com` | `Jefe123*` |
| Colaborador | `colaborador@sigein.com` | `Colab123*` |

> Los correos (bienvenida, recuperación de contraseña, asignaciones, recordatorios y certificados) se muestran por ahora en la consola del backend. Para enviarlos de verdad se configura Nodemailer en `sigein-backend/src/utils/correo.js`.

### 1.4 Pruebas

```bash
cd sigein-backend
npm test          # pruebas automáticas: CSV, avance y bloqueo de módulos, validaciones
cd ../sigein-frontend
npm run lint      # revisión del código del frontend
npm run build     # compila el frontend en la carpeta dist/
```

Para probar la API con Postman o Thunder Client:

1. Envíe `POST http://localhost:4000/api/auth/login` con el cuerpo `{"email": "admin@sigein.com", "password": "Admin123*"}`.
2. Copie el `token` de la respuesta.
3. En las demás peticiones, use la autorización **Bearer Token** con ese valor. Por ejemplo: `GET http://localhost:4000/api/programas`.

### 1.5 Servicios de la API

| Método | Ruta | Uso | Rol |
|---|---|---|---|
| POST | `/api/auth/login`, `/api/auth/recuperar`, `/api/auth/restablecer` | Sesión y contraseña | Público |
| GET, POST, PUT, PATCH | `/api/usuarios`, `/api/usuarios/importar` | Usuarios y carga por CSV | Administrador |
| GET, POST, PUT, PATCH, DELETE | `/api/areas`, `/api/cargos` | Estructura de la empresa | Administrador |
| GET, POST, PUT, PATCH, DELETE | `/api/programas`, `/api/modulos`, `/api/contenidos` | Programas, módulos y contenidos | Administrador |
| GET, PUT, DELETE | `/api/modulos/:id/evaluacion` | Constructor de evaluaciones | Administrador |
| GET, POST, PATCH, DELETE | `/api/asignaciones` | Asignar inducciones | Administrador, Jefe |
| GET | `/api/mis-inducciones` | Inducciones del colaborador | Colaborador |
| POST | `/api/progreso/:contenidoId` | Marcar un contenido como visto | Colaborador |
| GET, POST | `/api/evaluaciones/:id`, `/api/evaluaciones/:id/intentos` | Presentar evaluaciones | Colaborador |
| GET | `/api/certificados`, `/api/certificados/:id/pdf` | Certificados | Colaborador |
| GET | `/api/certificados/:codigo/verificar` | Verificación de certificados | Público |
| GET | `/api/reportes/cumplimiento` (`/excel`, `/pdf`) | Reportes con filtros | Administrador, Jefe |
| GET | `/api/reportes/resumen` | Indicadores del tablero | Administrador |
| GET, PATCH | `/api/notificaciones` | Campana de notificaciones | Todos |

Códigos de respuesta: **200/201** correcto o creado · **400** datos inválidos (la respuesta indica el campo) · **401** falta la sesión o venció · **403** el rol no tiene permiso · **404** no encontrado · **409** conflicto (por ejemplo, un correo repetido) · **413** archivo demasiado grande · **500** error interno.

### 1.6 Empaquetado para la entrega

- **Frontend:** `npm run build` genera la carpeta `dist/`. Comprímala como `sigein-frontend-v1.0.zip`; se publica en cualquier servidor web estático (Nginx, Apache, Netlify o Vercel).
- **Backend:** comprima la carpeta `sigein-backend` **sin** `node_modules` ni `.env` como `sigein-backend-v1.0.zip`. Incluya `.env.example` y las migraciones de `prisma/migrations`. En producción se ejecuta con `npm start` y un administrador de procesos como PM2.

### 1.7 Estructura del proyecto

```
sigein-backend/
├── prisma/            # modelo de datos, migraciones y datos iniciales
├── src/
│   ├── config/        # variables de entorno y conexión
│   ├── controllers/   # reciben la petición y responden
│   ├── jobs/          # tareas automáticas (recordatorios de vencimiento)
│   ├── middlewares/   # sesión (JWT), roles, validación y errores
│   ├── routes/        # rutas de la API
│   ├── schemas/       # reglas de validación (Zod)
│   ├── services/      # reglas de negocio
│   └── utils/         # archivos, correos, CSV, fechas, exportación
├── test/              # pruebas automáticas
└── uploads/           # archivos cargados (no se suben a Git)

sigein-frontend/src/
├── api/               # llamadas a la API
├── components/        # botones, tablas, ventanas, campana, editor de texto…
├── layouts/           # estructura del panel y de las pantallas de acceso
├── pages/             # pantallas por rol (admin, jefe, colaborador, público)
├── routes/            # rutas y protección por rol
└── utils/             # fechas, archivos, roles
```

---

## 2. Manual de usuario

### 2.1 Ingreso

1. Abra el navegador en la dirección que le entregó la empresa.
2. Escriba su correo y su contraseña, y presione **Iniciar sesión**.
3. La primera vez, lea y acepte la **política de tratamiento de datos personales** (Ley 1581 de 2012).
4. Si olvidó la contraseña, presione **¿Olvidaste tu contraseña?** y siga el enlace que le llegará al correo.
5. Si es un usuario nuevo, use el enlace del **correo de bienvenida** para crear su contraseña (vence en 72 horas).

### 2.2 Colaborador

1. En **Mis inducciones** verá sus programas con el avance, el estado y la fecha límite. Las vencidas aparecen en rojo.
2. Presione **Empezar** o **Continuar**. A la izquierda verá los módulos; los que tienen candado se desbloquean al completar el anterior.
3. Revise cada contenido y presione **Marcar como visto y continuar**. Si sale y vuelve, el sistema lo lleva a donde quedó.
4. Al terminar los contenidos de un módulo con evaluación, presione **Iniciar evaluación**. Tenga en cuenta el tiempo y los intentos: si el tiempo se agota, las respuestas se envían solas.
5. Al completar el programa, vaya a **Certificados** y presione **Descargar PDF**. Con **Copiar enlace para compartir** puede enviar el enlace de verificación.
6. La **campana** 🔔 muestra sus avisos: nuevas inducciones, recordatorios de vencimiento (3 días antes) y certificados disponibles.

### 2.3 Administrador (Talento Humano)

- **Áreas y cargos:** cree la estructura de la empresa antes de registrar usuarios. Un área o un cargo con usuarios no se elimina; se inactiva.
- **Usuarios:** presione **Nuevo usuario** o **Cargar CSV** (descargue antes la plantilla). Cada usuario recibe un correo de bienvenida.
- **Programas:** presione **Nuevo programa**, agregue módulos, cargue los contenidos y, si quiere, cree la **evaluación** de cada módulo. Ordene módulos y contenidos arrastrándolos. Cuando esté listo, presione **Publicar**.
- **Asignaciones:** elija el programa, a quién se asigna (personas, un área o un cargo) y la fecha límite. Si alguien ya tiene el programa activo, se omite.
- **Reportes:** combine los filtros (área, programa, estado y fechas) y presione **Exportar a Excel** o **Exportar a PDF**. El archivo incluye los filtros aplicados.
- **Dashboard:** indicadores generales, entre ellos la tasa de aprobación de las evaluaciones.

### 2.4 Jefe de área

- En **Progreso de mi equipo** consulte el avance, la nota y la fecha límite de cada colaborador de su área, filtre por estado y exporte el reporte a Excel o PDF.
- En **Asignar inducción** asigne programas a las personas de su área.
- Si un colaborador agota los intentos de una evaluación, usted recibe un aviso en la campana.

### 2.5 Verificar un certificado

Cualquier persona, sin iniciar sesión, puede escanear el **código QR** del certificado o entrar a **Verifíquelo aquí** (en la pantalla de inicio de sesión) y escribir el código.

### 2.6 Solución de problemas

| Situación | Solución |
|---|---|
| No puedo iniciar sesión | Verifique el correo y la contraseña. Tras 5 intentos fallidos espere 15 minutos o use la recuperación de contraseña. |
| Un módulo aparece con candado | Complete el módulo anterior y apruebe su evaluación. |
| Me quedé sin intentos | Su jefe de área recibe un aviso automático; comuníquese con Talento Humano. |
| El video o el PDF no carga | Use el enlace "Abrirlo en otra pestaña" debajo del contenido o revise su conexión. |
| `Iniciar SIGEIN.bat` no abre la página | Espere unos segundos y recargue. Revise en las ventanas "Backend" y "Frontend" si hay algún error. |
