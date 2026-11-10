// Deja todas las inducciones como recién asignadas, para recorrerlas desde el inicio (por ejemplo, al grabar una demostración).
// Borra el avance, los intentos de evaluación y los certificados de los programas que no están archivados,
// pone las asignaciones en "Pendiente" con fecha límite futura y vuelve a pedir la política de datos a jefes y colaboradores.
// Uso: npm run demo:reiniciar
import prismaCliente from '@prisma/client';

const prisma = new prismaCliente.PrismaClient();
const DIAS_PLAZO = 21;

try {
  const asignaciones = await prisma.asignacion.findMany({
    where: { programa: { estado: { not: 'archivado' } } },
    select: { id: true, fechaLimite: true },
  });
  const ids = asignaciones.map((a) => a.id);

  const hoy = new Date(new Date().toISOString().slice(0, 10));
  const plazo = new Date(hoy.getTime() + DIAS_PLAZO * 86400000);

  const [progresos, intentos, certificados] = await prisma.$transaction([
    prisma.progresoContenido.deleteMany({ where: { asignacionId: { in: ids } } }),
    // Las respuestas de cada intento se borran en cascada
    prisma.intentoEvaluacion.deleteMany({ where: { asignacionId: { in: ids } } }),
    prisma.certificado.deleteMany({ where: { asignacionId: { in: ids } } }),
    prisma.asignacion.updateMany({
      where: { id: { in: ids } },
      data: { estado: 'pendiente', porcentajeAvance: 0, recordatorioAt: null, fechaAsignacion: hoy },
    }),
  ]);
  // Las que ya vencieron o vencen pronto reciben un plazo nuevo
  const conPlazoNuevo = await prisma.asignacion.updateMany({
    where: { id: { in: ids }, fechaLimite: { lt: plazo } },
    data: { fechaLimite: plazo },
  });

  // Se conservan solo los avisos de "nueva inducción", sin leer, como el primer día
  const avisos = await prisma.notificacion.deleteMany({ where: { titulo: { not: 'Nueva inducción asignada' } } });
  await prisma.notificacion.updateMany({ data: { leida: false } });

  const politica = await prisma.usuario.updateMany({
    where: { rol: { nombre: { not: 'Administrador' } } },
    data: { aceptaDatosAt: null },
  });

  console.log(`Inducciones reiniciadas: ${ids.length}`);
  console.log(`  Contenidos vistos borrados: ${progresos.count}`);
  console.log(`  Intentos de evaluación borrados: ${intentos.count}`);
  console.log(`  Certificados borrados: ${certificados.count}`);
  console.log(`  Fechas límite movidas a ${plazo.toISOString().slice(0, 10)}: ${conPlazoNuevo.count}`);
  console.log(`  Notificaciones borradas: ${avisos.count}`);
  console.log(`  Usuarios que verán de nuevo la política de datos: ${politica.count}`);
} finally {
  await prisma.$disconnect();
}
