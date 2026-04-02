import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Doctor } from './entities/doctor.entity';
import { Consultation } from './entities/consultation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Prescription } from './entities/prescription.entity';
import { ConsultationsService } from './consultations.service';
import { AiAgentService } from './ai-agent.service';
import { ConsultationsController } from './consultations.controller';
import { OrdersModule } from '../orders/orders.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Consultation, ChatMessage, Prescription]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    OrdersModule,
    ServicesModule,
    UsersModule,
    RealtimeModule,
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, AiAgentService],
  exports: [ConsultationsService, AiAgentService],
})
export class ConsultationsModule {}
