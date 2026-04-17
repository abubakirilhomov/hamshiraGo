import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TelegramService } from '../common/telegram.service';

@Processor('telegram-messages')
export class TelegramProcessor extends WorkerHost {
  constructor(private telegramService: TelegramService) {
    super();
  }

  async process(job: Job<{ chatId: string; text: string }>): Promise<void> {
    await this.telegramService.sendMessage(job.data.chatId, job.data.text);
  }
}
