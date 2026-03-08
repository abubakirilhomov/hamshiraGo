import { Module } from '@nestjs/common';
import { MedicsModule } from '../medics/medics.module';
import { TelegramBotService } from './telegram-bot.service';
import { TelegramBotController } from './telegram-bot.controller';

@Module({
  imports: [MedicsModule],
  controllers: [TelegramBotController],
  providers: [TelegramBotService],
})
export class TelegramBotModule {}
