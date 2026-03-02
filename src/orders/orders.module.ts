import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Order } from './entities/order.entity';
import { OrderLocation } from './entities/order-location.entity';
import { DispatchAttempt } from './entities/dispatch-attempt.entity';
import { OrdersService } from './orders.service';
import { DispatchService } from './dispatch.service';
import { OrdersController } from './orders.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { MedicsModule } from '../medics/medics.module';
import { UsersModule } from '../users/users.module';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderLocation, DispatchAttempt]),
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
  ],
  controllers: [OrdersController],
  providers: [OrdersService, DispatchService],
  exports: [OrdersService, DispatchService],
})
export class OrdersModule {}
