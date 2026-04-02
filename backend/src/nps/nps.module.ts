import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NpsSurvey } from './entities/nps-survey.entity';
import { NpsService } from './nps.service';
import { NpsController } from './nps.controller';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NpsSurvey]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    ConfigModule,
    RealtimeModule,
  ],
  controllers: [NpsController],
  providers: [NpsService],
  exports: [NpsService],
})
export class NpsModule {}
