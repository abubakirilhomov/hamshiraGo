import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Doctor } from './entities/doctor.entity';
import { Consultation } from './entities/consultation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { Prescription } from './entities/prescription.entity';
import { SalomatAuditLog } from './entities/salomat-audit-log.entity';
import { ConsultationsService } from './consultations.service';
import { AiAgentService } from './ai-agent.service';
import { VideoService } from './video.service';
import { SalomatAuditService } from './salomat-audit.service';
import { ConsultationsController } from './consultations.controller';
import { OrdersModule } from '../orders/orders.module';
import { ServicesModule } from '../services/services.module';
import { UsersModule } from '../users/users.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { CommonModule } from '../common/common.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { ClinicModule } from '../clinic/clinic.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Doctor, Consultation, ChatMessage, Prescription, SalomatAuditLog]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    forwardRef(() => OrdersModule),
    ServicesModule,
    UsersModule,
    RealtimeModule,
    CommonModule,
    forwardRef(() => DoctorsModule),
    forwardRef(() => ClinicModule),
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService, AiAgentService, VideoService, SalomatAuditService],
  exports: [ConsultationsService, AiAgentService, VideoService, SalomatAuditService],
})
export class ConsultationsModule {}
