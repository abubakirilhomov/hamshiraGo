import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { PaymeService } from './payme.service';
import { ClickService } from './click.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, Order]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaymeService, ClickService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
