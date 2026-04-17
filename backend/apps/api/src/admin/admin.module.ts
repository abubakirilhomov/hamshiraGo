import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { PaymentLedger } from './entities/payment-ledger.entity';
import { PushCampaignService } from './push-campaign.service';
import { PaymentLedgerService } from './payment-ledger.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, PaymentLedger]),
    RealtimeModule,
  ],
  providers: [PushCampaignService, PaymentLedgerService],
  exports: [PushCampaignService, PaymentLedgerService],
})
export class AdminModule {}
