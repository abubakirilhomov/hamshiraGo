import { Module, forwardRef } from '@nestjs/common';
import { MedicsModule } from '../medics/medics.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { ConsultationsModule } from '../consultations/consultations.module';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';

@Module({
  imports: [
    MedicsModule,
    UsersModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => ConsultationsModule),
  ],
  controllers: [TelegramBotController],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
