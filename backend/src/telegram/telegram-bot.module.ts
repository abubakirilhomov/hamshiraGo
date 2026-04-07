import { Module, forwardRef } from '@nestjs/common';
import { MedicsModule } from '../medics/medics.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';

@Module({
  imports: [MedicsModule, UsersModule, forwardRef(() => OrdersModule)],
  controllers: [TelegramBotController],
  providers: [TelegramBotService],
  exports: [TelegramBotService],
})
export class TelegramBotModule {}
