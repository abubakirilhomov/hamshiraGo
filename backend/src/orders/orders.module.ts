import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderLocation } from './entities/order-location.entity';
import { DispatchAttempt } from './entities/dispatch-attempt.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { OrdersService } from './orders.service';
import { DispatchService } from './dispatch.service';
import { OrdersController } from './orders.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { MedicsModule } from '../medics/medics.module';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';
import { AppSettingsModule } from '../app-settings/app-settings.module';
import { FavoritesModule } from '../favorites/favorites.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderLocation, DispatchAttempt, Referral]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
    RealtimeModule,
    MedicsModule,
    UsersModule,
    ServicesModule,
    AppSettingsModule,
    FavoritesModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, DispatchService],
  exports: [OrdersService, DispatchService],
})
export class OrdersModule {}
