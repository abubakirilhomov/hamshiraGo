import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ClinicAppModule } from './clinic-app.module';

async function bootstrap() {
  const app = await NestFactory.create(ClinicAppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableCors({ origin: true, credentials: true });

  const port = process.env.CLINIC_PORT || 3003;
  await app.listen(port);
  console.log(`Clinic service running on port ${port}`);
}
bootstrap();
