import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PushNotificationsService } from './push-notifications.service';

@Processor('push-notifications')
export class PushProcessor extends WorkerHost {
  constructor(private pushService: PushNotificationsService) {
    super();
  }

  async process(job: Job<{ tokens: string[]; payload: any }>): Promise<void> {
    await this.pushService.send(job.data.tokens, job.data.payload);
  }
}
