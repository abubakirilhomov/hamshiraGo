import { Injectable, Logger, Optional } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly hasRedis: boolean;

  constructor(
    @Optional() @InjectQueue('push-notifications') private pushQueue?: Queue,
    @Optional() @InjectQueue('telegram-messages') private telegramQueue?: Queue,
  ) {
    this.hasRedis = !!pushQueue;
    if (this.hasRedis) {
      this.logger.log('Redis queues connected — using BullMQ');
    } else {
      this.logger.warn('No Redis — using direct send (fire-and-forget)');
    }
  }

  async pushNotification(tokens: string[], payload: any): Promise<void> {
    if (this.hasRedis && this.pushQueue) {
      await this.pushQueue.add('send', { tokens, payload }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    }
    // If no Redis, caller handles directly (existing behavior)
  }

  async telegramMessage(chatId: string, text: string): Promise<void> {
    if (this.hasRedis && this.telegramQueue) {
      await this.telegramQueue.add('send', { chatId, text }, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
      });
    }
  }

  get isQueueAvailable(): boolean {
    return this.hasRedis;
  }
}
