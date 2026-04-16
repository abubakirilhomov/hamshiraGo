import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';

// Import from api source (shared via tsconfig paths)
import { VoiceSession } from '@/voice-agent/entities/voice-session.entity';
import { Doctor } from '@/consultations/entities/doctor.entity';
import { Service } from '@/services/entities/service.entity';
import { VoiceAgentService } from '@/voice-agent/voice-agent.service';
import { VoiceAgentController } from '@/voice-agent/voice-agent.controller';
import { ServicesService } from '@/services/services.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'hamshira_go'),
        entities: [VoiceSession, Doctor, Service],
        synchronize: true,
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([VoiceSession, Doctor, Service]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [VoiceAgentController],
  providers: [VoiceAgentService, ServicesService],
})
export class VoiceAgentAppModule {}
