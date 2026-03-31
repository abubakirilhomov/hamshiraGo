import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Order } from '../orders/entities/order.entity';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { RealtimeModule } from '../realtime/realtime.module';
import { UsersModule } from '../users/users.module';
import { MedicsModule } from '../medics/medics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Review, Order]),
    RealtimeModule,
    UsersModule,
    MedicsModule,
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
