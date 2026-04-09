import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { MedicsModule } from '../medics/medics.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Referral } from '../referrals/entities/referral.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Referral]),
    UsersModule,
    MedicsModule,
    forwardRef(() => DoctorsModule),
    RealtimeModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
