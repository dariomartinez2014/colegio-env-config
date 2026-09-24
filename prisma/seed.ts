import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
  const hash = (password: string) => bcrypt.hash(password, saltRounds);

  await prisma.user.upsert({
    where: { email: 'admin@colegio.com' },
    update: {},
    create: {
      name: 'Directora',
      email: 'admin@colegio.com',
      password: await hash('admin123'),
      role: 'ADMIN',
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'profe@colegio.com' },
    update: {},
    create: {
      name: 'Profesor de Matemáticas',
      email: 'profe@colegio.com',
      password: await hash('profe123'),
      role: 'TEACHER',
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'estudiante@colegio.com' },
    update: {},
    create: {
      name: 'Estudiante de ejemplo',
      email: 'estudiante@colegio.com',
      password: await hash('estudiante123'),
      role: 'STUDENT',
    },
  });

  const course = await prisma.course.upsert({
    where: { name: '1ro de Secundaria A' },
    update: {},
    create: { name: '1ro de Secundaria A', level: 'Secundaria', year: 2026 },
  });

  for (const name of ['Matemáticas', 'Lenguaje', 'Ciencias Naturales']) {
    await prisma.subject.upsert({
      where: { name_courseId: { name, courseId: course.id } },
      update: {},
      create: {
        name,
        courseId: course.id,
        teacherId: name === 'Matemáticas' ? teacher.id : null,
      },
    });
  }

  await prisma.enrollment.upsert({
    where: {
      studentId_courseId: { studentId: student.id, courseId: course.id },
    },
    update: {},
    create: { studentId: student.id, courseId: course.id },
  });

  console.log('🌱 Seed completado');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
