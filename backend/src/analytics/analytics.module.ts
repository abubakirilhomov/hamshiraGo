import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module';
import { Order } from '../orders/entities/order.entity';
import { User } from '../users/entities/user.entity';
import { Medic } from '../medics/entities/medic.entity';
import { ClientError } from '../client-errors/entities/client-error.entity';
import { Review } from '../reviews/entities/review.entity';

import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';

@Module({
  imports: [
    ConfigModule,
    AuthModule,
    TypeOrmModule.forFeature([Order, User, Medic, ClientError, Review]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
