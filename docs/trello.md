# Tablero de Trello · Inducta

Truco: en Trello, si pegas varias líneas en "Añadir una tarjeta", te pregunta si quieres crear una tarjeta por línea. Lo mismo pasa al pegar varias líneas en una checklist: crea un ítem por línea.

## 1. Crear el tablero

1. Trello > Crear > Tablero. Nombre: **Inducta · Sistema de Gestión de Inducciones**.
2. Visibilidad: **Público** (o compártelo con el docente: Compartir > correo del docente).
3. Crea estas listas, en este orden:
   - Product Backlog
   - Sprint Backlog
   - En progreso
   - En revisión / Pruebas
   - Terminado

## 2. Etiquetas (menú ... > Etiquetas)

| Etiqueta | Color |
|---|---|
| Sprint 1 | verde |
| Sprint 2 | amarillo |
| Sprint 3 | naranja |
| Sprint 4 | rojo |
| Sprint 5 | morado |
| Frontend | azul |
| Backend | celeste |
| Base de datos | gris |
| Documentación | rosa |

## 3. Tarjetas (pegar en la lista "Terminado", porque el proyecto ya está hecho)

Copia este bloque y pégalo en "Añadir una tarjeta" > "Crear 15 tarjetas":

```
HU-01 Iniciar sesión
HU-02 Recuperar contraseña
HU-03 Gestionar usuarios y carga CSV
HU-04 Gestionar áreas y cargos
HU-05 Gestionar programas de inducción
HU-06 Gestionar módulos y contenidos
HU-07 Constructor de evaluaciones
HU-08 Asignar inducciones
HU-09 Mis inducciones
HU-10 Recorrer contenidos con desbloqueo
HU-11 Presentar evaluación
HU-12 Certificado PDF con QR y verificación
HU-13 Progreso del equipo (jefe de área)
HU-14 Reportes de cumplimiento Excel/PDF
HU-15 Notificaciones y recordatorios
```

Y estas tarjetas de documentación y entrega:

```
Planteamiento, justificación y objetivos
Estudio de factibilidad
Requisitos funcionales y no funcionales
Casos de uso y diagramas UML
Diagrama MER y modelo de base de datos
Wireframes en Figma
Empaquetado frontend + manual de usuario
Empaquetado backend + manual técnico
Pruebas automáticas y revisión final
```

## 4. Detalle de cada tarjeta

En cada tarjeta: descripción = la historia, etiqueta del sprint + Frontend/Backend, miembro responsable, fecha de vencimiento y una checklist "Criterios de aceptación" (pega las líneas de abajo).

### HU-01 Iniciar sesión · Sprint 1
Como usuario quiero iniciar sesión con correo y contraseña para entrar al panel de mi rol.
```
Redirige al panel según el rol
Bloquea 15 minutos tras 5 intentos fallidos
Usuario inactivo no puede entrar
Pide aceptar la política de datos en el primer ingreso
```

### HU-02 Recuperar contraseña · Sprint 1
Como usuario quiero recuperar mi contraseña para volver a ingresar si la olvido.
```
Envía enlace por correo válido 30 minutos
Nueva contraseña: mínimo 8 caracteres, una mayúscula y un número
No revela si el correo existe
```

### HU-03 Gestionar usuarios y carga CSV · Sprint 2
Como administrador quiero crear, editar, inactivar, buscar y cargar usuarios por CSV.
```
Documento y correo no se repiten
Los no administradores necesitan cargo
Carga CSV con resumen de filas cargadas y con error
Envía correo de bienvenida
```

### HU-04 Gestionar áreas y cargos · Sprint 2
Como administrador quiero gestionar áreas y cargos para reflejar la estructura de la empresa.
```
Cada cargo pertenece a un área y no se repite en ella
Área o cargo con usuarios solo se inactiva
Se puede asignar jefe al área
```

### HU-05 Gestionar programas · Sprint 3
Como administrador quiero crear programas de inducción para organizar la formación.
```
Programa nuevo queda en Borrador
Portada JPG, PNG o WEBP de máximo 2 MB
Solo se publica con al menos un módulo con contenido
Se puede archivar
```

### HU-06 Gestionar módulos y contenidos · Sprint 3
Como administrador quiero agregar módulos y contenidos para estructurar el programa.
```
Tipos: video, PDF, texto y enlace
PDF máximo 20 MB, MP4 máximo 100 MB
Módulos y contenidos se reordenan arrastrando
```

### HU-07 Constructor de evaluaciones · Sprint 3
Como administrador quiero crear evaluaciones por módulo para medir la comprensión.
```
Preguntas única, múltiple y verdadero/falso
Cada pregunta con al menos una opción correcta
Nota de 0 a 5 con nota mínima configurable
Entre 1 y 5 intentos
Tiempo límite opcional
```

### HU-08 Asignar inducciones · Sprint 4
Como administrador o jefe de área quiero asignar programas para que los colaboradores los realicen.
```
Asignación individual, por área o por cargo
Fecha límite obligatoria
Omite a quien ya tiene el programa activo
El jefe solo asigna a su área
Notifica al colaborador
```

### HU-09 Mis inducciones · Sprint 4
Como colaborador quiero ver mis inducciones para saber qué debo hacer y para cuándo.
```
Muestra avance, estado y fecha límite
Vencidas en rojo
Filtro En curso / Completadas
```

### HU-10 Recorrer contenidos · Sprint 4
Como colaborador quiero recorrer los contenidos en orden para completar mi inducción.
```
Módulos bloqueados hasta completar el anterior
Botón Marcar como visto y continuar
Retoma donde quedó
Avance calculado automáticamente
```

### HU-11 Presentar evaluación · Sprint 4
Como colaborador quiero presentar la evaluación del módulo para aprobarlo.
```
Muestra instrucciones, nota mínima, tiempo e intentos
Envío automático al agotar el tiempo
Calificación en el servidor
Sin intentos: aviso al jefe de área
```

### HU-12 Certificado · Sprint 5
Como colaborador quiero descargar mi certificado para evidenciar que completé la inducción.
```
Se emite una sola vez al completar
PDF con código QR
Página pública de verificación por código
```

### HU-13 Progreso del equipo · Sprint 5
Como jefe de área quiero ver el progreso de mi equipo para hacer seguimiento.
```
Solo ve colaboradores de su área
Avance, nota y fecha límite
Filtro por estado
Exporta a Excel y PDF
```

### HU-14 Reportes de cumplimiento · Sprint 5
Como administrador quiero reportes de cumplimiento para auditar el proceso.
```
Filtros por área, programa, estado y fechas
Exporta a Excel y PDF
El archivo muestra los filtros aplicados
Tablero de indicadores
```

### HU-15 Notificaciones y recordatorios · Sprint 5
Como colaborador quiero recibir recordatorios para no dejar vencer mi inducción.
```
Campana con número de no leídas
Recordatorio 3 días antes del vencimiento
Aviso por correo
Una sola vez por asignación
```

## 5. Para la entrega

1. Pon fechas de vencimiento a las tarjetas según el sprint (5 sprints de 2 semanas).
2. Asigna un miembro a cada tarjeta.
3. Toma una captura del tablero completo.
4. Copia el enlace del tablero (Compartir > Copiar enlace) y pégalo en la sección 12 del documento, junto con la captura.
