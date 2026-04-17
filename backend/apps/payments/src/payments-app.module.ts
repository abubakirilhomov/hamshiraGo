import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@/auth/strategies/jwt.strategy';

import { Payment } from '@/payments/entities/payment.entity';
import { Order } from '@/orders/entities/order.entity';
import { OrderLocation } from '@/orders/entities/order-location.entity';
import { Consultation } from '@/consultations/entities/consultation.entity';
import { Doctor } from '@/consultations/entities/doctor.entity';
import { User } from '@/users/entities/user.entity';
import { PaymentsService } from '@/payments/payments.service';
import { PaymeService } from '@/payments/payme.service';
import { ClickService } from '@/payments/click.service';
import { PaymentsController } from '@/payments/payments.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'hamshira_go'),
        entities: [Payment, Order, OrderLocation, Consultation, Doctor, User],
        synchronize: true,
        ssl: config.get('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined,
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    TypeOrmModule.forFeature([Payment, Order, Consultation, User]),
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
  providers: [PaymentsService, PaymeService, ClickService, JwtStrategy],
})
export class PaymentsAppModule {}
