import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as nodeCrypto from 'crypto';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { seedServices } from './services/services.seed';
import { ALLOWED_ORIGINS } from './common/cors.config';

async function bootstrap() {
  // Node 18 compatibility: @nestjs/schedule expects global `crypto.randomUUID()`.
  const g = globalThis as any;
  if (!g.crypto?.randomUUID) {
    g.crypto = nodeCrypto;
  }

  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow Cloudinary images
  }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: origin "${origin}" not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Secret'],
  });

  // ── Swagger / OpenAPI (dev only) ───────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('HamshiraGo API')
      .setDescription('REST API для мобильного приложения HamshiraGo')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Seed reference data (idempotent — skips existing rows)
  const dataSource = app.get<DataSource>(getDataSourceToken());
  await seedServices(dataSource);

  const port = process.env.PORT ?? 3000;
  // Railway runs behind a reverse proxy — trust first hop so req.ip returns real client IP
  app.getHttpAdapter().getInstance().set('trust proxy', 1);
  await app.listen(port);
  app.get(Logger).log(`HamshiraGo API running on port ${port}`);
}

bootstrap();
