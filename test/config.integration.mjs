import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parse } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcryptjs';
import { envValidationSchema as schema } from '../dist/config/env.validation.js';
const valid = parse(readFileSync(new URL('../.env.example', import.meta.url)));
assert.equal(schema.validate(valid).error, undefined);
let cases = 0;
for (const [key, bad] of [
  ['SCHOOL_NAME', undefined],
  ['SCHOOL_NAME', 'ab'],
  ['SCHOOL_NAME', 'a'.repeat(81)],
  ['PORT', 'abc'],
  ['PORT', 0],
  ['PORT', 65536],
  ['PORT', 3.5],
  ['NODE_ENV', 'staging'],
  ['JWT_SECRET', 'corto'],
  ['JWT_SECRET', undefined],
  ['API_PREFIX', 'con espacio'],
  ['API_PREFIX', undefined],
  ['DATABASE_URL', 'https://example.com'],
  ['DATABASE_URL', undefined],
  ['JWT_EXPIRES_IN', 'forever'],
  ['JWT_EXPIRES_IN', undefined],
  ['BCRYPT_SALT_ROUNDS', 7],
  ['BCRYPT_SALT_ROUNDS', 15],
  ['BCRYPT_SALT_ROUNDS', 9.5],
  ['MIN_PASSING_GRADE', 150],
  ['MIN_PASSING_GRADE', 0],
  ['MIN_PASSING_GRADE', 50.5],
  ['MAX_STUDENTS_PER_COURSE', 10.5],
  ['MAX_STUDENTS_PER_COURSE', 4],
  ['MAX_STUDENTS_PER_COURSE', 61],
  ['MAX_STUDENTS_PER_COURSE', undefined],
]) {
  assert.ok(
    schema
      .validate({ ...valid, [key]: bad })
      .error?.details.some((x) => x.path[0] === key),
    key,
  );
  cases++;
}
const defaults = { ...valid };
for (const key of [
  'NODE_ENV',
  'PORT',
  'BCRYPT_SALT_ROUNDS',
  'MIN_PASSING_GRADE',
])
  delete defaults[key];
const result = schema.validate({ ...defaults, PATH: 'system-variable' });
assert.equal(result.error, undefined);
assert.equal(result.value.NODE_ENV, 'development');
assert.equal(result.value.PORT, 3000);
assert.equal(result.value.BCRYPT_SALT_ROUNDS, 10);
assert.equal(result.value.MIN_PASSING_GRADE, 51);
const multiple = schema.validate({
  ...valid,
  PORT: 'abc',
  JWT_SECRET: 'short',
  SCHOOL_NAME: undefined,
});
assert.equal(multiple.error.details.length, 3);
Object.assign(process.env, valid, {
  PORT: '43127',
  API_PREFIX: 'school-test',
  BCRYPT_SALT_ROUNDS: '8',
  JWT_EXPIRES_IN: '15m',
  MIN_PASSING_GRADE: '60',
  MAX_STUDENTS_PER_COURSE: '5',
});
const { AppModule } = await import('../dist/app.module.js');
const { PrismaService } = await import('../dist/prisma/prisma.service.js');
const { UsersService } = await import('../dist/users/users.service.js');
const { GradesService } = await import('../dist/grades/grades.service.js');
const { EnrollmentsService } =
  await import('../dist/enrollments/enrollments.service.js');
const app = await NestFactory.create(AppModule, { logger: false });
try {
  const config = app.get(ConfigService);
  assert.equal(config.get('PORT'), 43127);
  app.setGlobalPrefix(config.getOrThrow('API_PREFIX'));
  const prisma = app.get(PrismaService);
  const user = {
    id: 1,
    name: 'Test',
    email: 'test@example.com',
    role: 'STUDENT',
    password: await bcrypt.hash('Prueba123456', 8),
  };
  prisma.user.findUnique = async () => user;
  await app.listen(0, '127.0.0.1');
  const base = await app.getUrl();
  const info = await fetch(base + '/school-test');
  assert.equal(info.status, 200);
  assert.equal((await info.json()).school, valid.SCHOOL_NAME);
  const login = await fetch(base + '/school-test/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: 'Prueba123456' }),
  });
  assert.equal(login.status, 201);
  const { accessToken } = await login.json();
  const payload = JSON.parse(
    Buffer.from(accessToken.split('.')[1], 'base64url').toString(),
  );
  assert.equal(payload.exp - payload.iat, 900);
  assert.equal(
    (
      await fetch(base + '/school-test/auth/me', {
        headers: { Authorization: 'Bearer ' + accessToken },
      })
    ).status,
    200,
  );
  assert.equal((await fetch(base + '/school-test/auth/me')).status, 401);
  prisma.user.findUnique = async () => null;
  let stored;
  prisma.user.create = async ({ data }) => {
    stored = data;
    return { ...user, ...data };
  };
  await app
    .get(UsersService)
    .create({ name: 'Test', email: user.email, password: 'Prueba123456' });
  assert.equal(bcrypt.getRounds(stored.password), 8);
  prisma.grade.findMany = async () => [{ score: 59 }, { score: 60 }];
  assert.deepEqual(
    (
      await app.get(GradesService).findByStudent(1, { sub: 1, role: 'STUDENT' })
    ).map((x) => x.approved),
    [false, true],
  );
  prisma.user.findUnique = async () => user;
  prisma.course.findUnique = async () => ({
    name: 'Test',
    _count: { enrollments: 5 },
  });
  await assert.rejects(
    app.get(EnrollmentsService).create({ studentId: 1, courseId: 1 }),
    /5 estudiantes/,
  );
  console.log(
    `OK: ${cases} casos invalidos, 4 defaults, errores agrupados, variables del sistema, HTTP, login JWT 15m, Guard 200/401, bcrypt 8, nota minima 60 y cupo 5. Persistencia simulada.`,
  );
} finally {
  await app.close();
}
