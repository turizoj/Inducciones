const prisma = require('../config/prisma');
const { hoy } = require('../utils/fechas');

// Estados en los que una asignación sigue "activa" (RF-14: no se asigna dos veces)
const ESTADOS_ACTIVOS = ['pendiente', 'en_curso', 'vencida'];

// Lo que hace falta leer de una asignación para calcular su avance
const incluirAvance = {
  programa: {
    include: {
      modulos: {
        orderBy: { orden: 'asc' },
        include: {
          contenidos: { orderBy: { orden: 'asc' } },
          evaluacion: { select: { id: true, notaMinima: true, intentosMax: true, tiempoLimiteMin: true } },
        },
      },
    },
  },
  progresos: { select: { contenidoId: true } },
  intentos: { where: { aprobado: true }, select: { evaluacionId: true } },
};

// HU-10 / RF-17: un módulo se desbloquea cuando todos los anteriores están completos.
// Un módulo está completo si se vieron todos sus contenidos y, si tiene evaluación, se aprobó.
function calcularAvance(asignacion) {
  const vistos = new Set(asignacion.progresos.map((p) => p.contenidoId));
  const aprobadas = new Set(asignacion.intentos.map((i) => i.evaluacionId));
  let bloquear = false;
  let total = 0;
  let hechos = 0;

  const modulos = asignacion.programa.modulos.map((m) => {
    const contenidos = m.contenidos.map((c) => ({ ...c, visto: vistos.has(c.id) }));
    const evaluacionAprobada = m.evaluacion ? aprobadas.has(m.evaluacion.id) : null;
    const completo = contenidos.every((c) => c.visto) && evaluacionAprobada !== false;
    const bloqueado = bloquear;
    if (!completo) bloquear = true;

    total += contenidos.length + (m.evaluacion ? 1 : 0);
    hechos += contenidos.filter((c) => c.visto).length + (evaluacionAprobada ? 1 : 0);

    return {
      id: m.id,
      titulo: m.titulo,
      descripcion: m.descripcion,
      estado: bloqueado ? 'bloqueado' : completo ? 'completado' : 'en_curso',
      contenidos,
      evaluacion: m.evaluacion ? { ...m.evaluacion, notaMinima: Number(m.evaluacion.notaMinima), aprobada: evaluacionAprobada } : null,
    };
  });

  return {
    modulos,
    porcentaje: total ? Math.round((hechos / total) * 10000) / 100 : 0,
    completo: total > 0 && hechos === total,
    hayAvance: hechos > 0,
  };
}

// Estado que le corresponde a la asignación según su avance y su fecha límite
function estadoSegun(asignacion, avance) {
  if (avance.completo) return 'completada';
  if (asignacion.fechaLimite < hoy()) return 'vencida';
  return avance.hayAvance ? 'en_curso' : 'pendiente';
}

// HU-09: las inducciones que pasaron su fecha límite sin completarse quedan "vencidas"
async function actualizarVencidas(where = {}) {
  await prisma.asignacion.updateMany({
    where: { ...where, estado: { in: ['pendiente', 'en_curso'] }, fechaLimite: { lt: hoy() } },
    data: { estado: 'vencida' },
  });
}

module.exports = { ESTADOS_ACTIVOS, incluirAvance, calcularAvance, estadoSegun, actualizarVencidas };
