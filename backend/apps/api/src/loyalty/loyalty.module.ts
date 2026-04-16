import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { LoyaltyService } from './loyalty.service';
import { LoyaltyController } from './loyalty.controller';
import { AppSettingsModule } from '../app-settings/app-settings.module';

@Module({
  imports: [TypeOrmModule.forFeature([LoyaltyTransaction]), AppSettingsModule],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
