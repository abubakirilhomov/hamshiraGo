import { Body, Controller, ForbiddenException, Headers, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramBotService } from './telegram-bot.service';

@Controller('telegram')
export class TelegramBotController {
  private readonly logger = new Logger(TelegramBotController.name);
  private readonly webhookSecret: string | undefined;

  constructor(
    private readonly botService: TelegramBotService,
    private readonly config: ConfigService,
  ) {
    this.webhookSecret = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    if (!this.webhookSecret) {
      this.logger.warn('TELEGRAM_WEBHOOK_SECRET not set — webhook requests will NOT be authenticated');
    }
  }

  /** Telegram calls this URL for every update (message, callback, etc.) */
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(
    @Headers('x-telegram-bot-api-secret-token') secretToken: string | undefined,
    @Body() update: any,
  ): Promise<void> {
    if (this.webhookSecret && secretToken !== this.webhookSecret) {
      throw new ForbiddenException('Invalid webhook secret');
    }
    await this.botService.handleUpdate(update);
  }
}
