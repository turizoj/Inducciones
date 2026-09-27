// Datos iniciales: roles, estructura básica y un usuario por rol para pruebas
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const roles = {};
  for (const nombre of ['Administrador', 'Jefe de área', 'Colaborador']) {
    roles[nombre] = await prisma.rol.upsert({ where: { nombre }, update: {}, create: { nombre } });
  }

  const area = await prisma.area.upsert({
    where: { nombre: 'Talento Humano' },
    update: {},
    create: { nombre: 'Talento Humano', descripcion: 'Gestión del personal' },
  });

  const cargo = await prisma.cargo.upsert({
    where: { areaId_nombre: { areaId: area.id, nombre: 'Auxiliar administrativo' } },
    update: {},
    create: { nombre: 'Auxiliar administrativo', areaId: area.id },
  });

  const usuarios = [
    { documento: '1000000001', nombres: 'Admin', apellidos: 'SIGEIN', email: 'admin@sigein.com', password: 'Admin123*', rol: 'Administrador' },
    { documento: '1000000002', nombres: 'Laura', apellidos: 'Gómez', email: 'jefe@sigein.com', password: 'Jefe123*', rol: 'Jefe de área' },
    { documento: '1000000003', nombres: 'Carlos', apellidos: 'Pérez', email: 'colaborador@sigein.com', password: 'Colab123*', rol: 'Colaborador' },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: {
        documento: u.documento,
        nombres: u.nombres,
        apellidos: u.apellidos,
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        fechaIngreso: new Date(),
        rolId: roles[u.rol].id,
        cargoId: u.rol === 'Administrador' ? null : cargo.id,
      },
    });
  }

  const jefe = await prisma.usuario.findUnique({ where: { email: 'jefe@sigein.com' } });
  await prisma.area.update({ where: { id: area.id }, data: { jefeId: jefe.id } });

  console.log('Datos iniciales creados.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
