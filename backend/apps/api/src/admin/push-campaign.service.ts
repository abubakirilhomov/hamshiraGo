import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PushNotificationsService } from '../realtime/push-notifications.service';

@Injectable()
export class PushCampaignService {
  private readonly logger = new Logger(PushCampaignService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private pushService: PushNotificationsService,
  ) {}

  async sendCampaign(
    segment: string,
    title: string,
    body: string,
  ): Promise<{ sent: number; segment: string }> {
    let users: { pushToken: string | null }[];

    switch (segment) {
      case 'all':
        users = await this.userRepo.find({
          where: { pushToken: Not(IsNull()) },
          select: ['pushToken'],
        });
        break;

      case 'new_7d': {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        users = await this.userRepo
          .createQueryBuilder('u')
          .select('u.pushToken')
          .where('u.pushToken IS NOT NULL')
          .andWhere('u.created_at > :weekAgo', { weekAgo })
          .getMany();
        break;
      }

      case 'inactive_30d': {
        const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        users = await this.userRepo
          .createQueryBuilder('u')
          .select('u.pushToken')
          .where('u.pushToken IS NOT NULL')
          .andWhere(
            `u.id NOT IN (
              SELECT DISTINCT "clientId" FROM orders WHERE created_at > :monthAgo
            )`,
          )
          .setParameter('monthAgo', monthAgo)
          .getMany();
        break;
      }

      case 'tier_gold':
        users = await this.userRepo.find({
          where: { pushToken: Not(IsNull()), loyaltyTier: 'GOLD' },
          select: ['pushToken'],
        });
        break;

      default:
        throw new BadRequestException('Invalid segment');
    }

    const tokens = users
      .map((u) => u.pushToken)
      .filter(Boolean) as string[];

    // Send in batches of 100
    const BATCH = 100;
    let sent = 0;
    for (let i = 0; i < tokens.length; i += BATCH) {
      const batch = tokens.slice(i, i + BATCH);
      await this.pushService
        .send(batch, {
          title,
          body,
          sound: 'default',
          data: { type: 'campaign', segment },
          channelId: 'order_updates',
          priority: 'default',
        })
        .catch(() => {});
      sent += batch.length;
    }

    this.logger.log(`Campaign sent: segment=${segment}, sent=${sent}`);
    return { sent, segment };
  }
}
