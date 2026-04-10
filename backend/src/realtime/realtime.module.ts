import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEventsGateway } from './order-events.gateway';
import { PushNotificationsService } from './push-notifications.service';
import { WebPushService } from './web-push.service';
import { WebPushSubscription } from './entities/web-push-subscription.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderLocation } from '../orders/entities/order-location.entity';
import { UsersModule } from '../users/users.module';
import { MedicsModule } from '../medics/medics.module';
import { PushProcessor } from './push.processor';
import { TelegramProcessor } from './telegram.processor';

// Only register BullMQ processors when Redis is available
const processors = process.env.REDIS_URL ? [PushProcessor, TelegramProcessor] : [];

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([WebPushSubscription, Order, OrderLocation]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: configService.get<string>('JWT_EXPIRES_IN') ?? '7d' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    forwardRef(() => MedicsModule),
  ],
  providers: [OrderEventsGateway, PushNotificationsService, WebPushService, ...processors],
  exports: [OrderEventsGateway, PushNotificationsService, WebPushService],
})
export class RealtimeModule {}
