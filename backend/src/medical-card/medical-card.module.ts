import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MedicalCard } from './entities/medical-card.entity';
import { Order } from '../orders/entities/order.entity';
import { MedicalCardService } from './medical-card.service';
import { MedicalCardController } from './medical-card.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MedicalCard, Order])],
  controllers: [MedicalCardController],
  providers: [MedicalCardService],
  exports: [MedicalCardService],
})
export class MedicalCardModule {}
