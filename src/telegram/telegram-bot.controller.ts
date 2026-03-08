import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { TelegramBotService } from './telegram-bot.service';

@Controller('telegram')
export class TelegramBotController {
  constructor(private readonly botService: TelegramBotService) {}

  /** Telegram calls this URL for every update (message, callback, etc.) */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() update: any): Promise<void> {
    await this.botService.handleUpdate(update);
  }
}
