import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaymentsAppModule } from './payments-app.module';

async function bootstrap() {
  const app = await NestFactory.create(PaymentsAppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableCors({ origin: true, credentials: true });

  const port = process.env.PAYMENTS_PORT || 3002;
  await app.listen(port);
  console.log(`Payments service running on port ${port}`);
}
bootstrap();
