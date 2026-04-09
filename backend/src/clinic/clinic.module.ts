import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { Company } from './entities/company.entity';
import { CompanyBranch } from './entities/company-branch.entity';
import { CompanyUser } from './entities/company-user.entity';
import { CompanyRoom } from './entities/company-room.entity';
import { CompanyRoomDoctor } from './entities/company-room-doctor.entity';
import { CompanyService as CompanyServiceEntity } from './entities/company-service.entity';
import { ClinicAppointment } from './entities/clinic-appointment.entity';
import { SalomatLead } from './entities/salomat-lead.entity';
import { User } from '../users/entities/user.entity';
import { ClinicService } from './clinic.service';
import {
  ClinicAuthController,
  ClinicController,
  ClinicAdminController,
  ClinicAdminLeadsController,
  ClinicPublicController,
} from './clinic.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyBranch,
      CompanyUser,
      CompanyRoom,
      CompanyRoomDoctor,
      CompanyServiceEntity,
      ClinicAppointment,
      SalomatLead,
      User,
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    forwardRef(() => RealtimeModule),
  ],
  controllers: [
    ClinicAuthController,
    ClinicController,
    ClinicAdminController,
    ClinicAdminLeadsController,
    ClinicPublicController,
  ],
  providers: [ClinicService],
  exports: [ClinicService],
})
export class ClinicModule {}
