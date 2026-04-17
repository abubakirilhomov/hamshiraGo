import { Module, Injectable } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { SimpleJwtStrategy } from '../../../libs/common/src/simple-jwt.strategy';

import { Company } from '@/clinic/entities/company.entity';
import { CompanyBranch } from '@/clinic/entities/company-branch.entity';
import { CompanyUser } from '@/clinic/entities/company-user.entity';
import { CompanyRoom } from '@/clinic/entities/company-room.entity';
import { CompanyRoomDoctor } from '@/clinic/entities/company-room-doctor.entity';
import { CompanyService as CompanyServiceEntity } from '@/clinic/entities/company-service.entity';
import { ClinicAppointment } from '@/clinic/entities/clinic-appointment.entity';
import { SalomatLead } from '@/clinic/entities/salomat-lead.entity';
import { ClinicPrescription } from '@/clinic/entities/clinic-prescription.entity';
import { User } from '@/users/entities/user.entity';
import { Order } from '@/orders/entities/order.entity';
import { OrderLocation } from '@/orders/entities/order-location.entity';
import { Medic } from '@/medics/entities/medic.entity';
import { Doctor } from '@/consultations/entities/doctor.entity';
import { Consultation } from '@/consultations/entities/consultation.entity';
import { WebPushSubscription } from '@/realtime/entities/web-push-subscription.entity';

import { ClinicService } from '@/clinic/clinic.service';
import { ClinicController, ClinicAuthController, ClinicAdminController, ClinicPublicController, ClinicAdminLeadsController, PatientPrescriptionsController } from '@/clinic/clinic.controller';

import { CommonModule } from '@/common/common.module';
import { WebPushService } from '@/realtime/web-push.service';
import { PushNotificationsService } from '@/realtime/push-notifications.service';
import { OrderEventsGateway } from '@/realtime/order-events.gateway';

/** Stub gateway — clinic service emits events but doesn't need full WebSocket */
@Injectable()
class StubOrderEventsGateway {
  server = { to: () => ({ emit: () => {} }) };
  emitNewLead(..._args: unknown[]) {}
  emitOrderStatus(..._args: unknown[]) {}
  emitNewConsultation(..._args: unknown[]) {}
}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'hamshira_go'),
        entities: [
          Company, CompanyBranch, CompanyUser, CompanyRoom, CompanyRoomDoctor,
          CompanyServiceEntity, ClinicAppointment, SalomatLead, ClinicPrescription,
          User, WebPushSubscription,
          Order, OrderLocation, Medic, Doctor, Consultation,
        ],
        synchronize: true,
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([
      Company, CompanyBranch, CompanyUser, CompanyRoom, CompanyRoomDoctor,
      CompanyServiceEntity, ClinicAppointment, SalomatLead, ClinicPrescription,
      User, WebPushSubscription,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    CommonModule,
  ],
  controllers: [
    ClinicAuthController,
    ClinicController,
    ClinicAdminController,
    ClinicPublicController,
    ClinicAdminLeadsController,
    PatientPrescriptionsController,
  ],
  providers: [
    ClinicService,
    WebPushService,
    PushNotificationsService,
    { provide: OrderEventsGateway, useClass: StubOrderEventsGateway },
    SimpleJwtStrategy,
  ],
})
export class ClinicAppModule {}
