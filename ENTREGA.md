# Entrega: configuración de entornos

La validación de las 10 variables está en `src/config/env.validation.ts`. ConfigModule es global y el único cargador de .env dentro de src. JWT usa registerAsync para resolver la configuración mediante inyección. Los demás servicios consumen los valores convertidos y validados con ConfigService.

Validar al arrancar evita atender peticiones con una configuración incompleta. Los errores se detectan juntos antes del login o de las operaciones de negocio, en vez de manifestarse como fallos tardíos difíciles de diagnosticar.

## Verificación

- Cliente Prisma generado y compilación correcta.
- `npm run test:config`: 26 casos inválidos, cuatro valores por defecto, variables adicionales del sistema y errores agrupados.
- HTTP, JWT con duración personalizada, rutas protegidas 200/401, rondas bcrypt, umbral de aprobación y límite de cupos. Persistencia simulada en estas pruebas.
- Arranque real de main y GET /api con HTTP 200. No se aplicaron migraciones ni se verificó una conexión real a PostgreSQL.
- Arranque con cinco variables inválidas: salida 1 y todos los errores juntos.
- Sin lecturas de process.env ni carga manual de dotenv en src, excluyendo código generado.
- .env.example válido y .env ignorado por Git.

## Evidencias

Estas imágenes son visualizaciones de los registros reales de consola, no capturas del escritorio. Se incluyen los archivos de texto originales para comprobarlas.

![Arranque correcto](docs/evidence/valid-startup.png)

![Errores agrupados](docs/evidence/invalid-startup.png)

Registros: [arranque](docs/evidence/valid-startup.txt), [errores](docs/evidence/invalid-startup.txt), [HTTP](docs/evidence/http-response.txt).

Para reproducir: npm install, copiar .env.example a .env, configurar PostgreSQL, npm run db:generate, npm run build y npm run start:prod. Las pruebas automatizadas se ejecutan con npm run test:config.
