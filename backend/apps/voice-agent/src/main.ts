import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { VoiceAgentAppModule } from './voice-agent-app.module';

async function bootstrap() {
  const app = await NestFactory.create(VoiceAgentAppModule);

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const port = process.env.VOICE_AGENT_PORT || 3001;
  await app.listen(port);
  console.log(`Voice Agent service running on :${port}`);
}
bootstrap();
