import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, LessThan, Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { SubscriptionTier } from './entities/subscription-tier.entity';
import { Subscription } from './entities/subscription.entity';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    @InjectRepository(SubscriptionTier)
    private readonly tierRepo: Repository<SubscriptionTier>,
    @InjectRepository(Subscription)
    private readonly subRepo: Repository<Subscription>,
    private readonly pushService: PushNotificationsService,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Tiers                                                              */
  /* ------------------------------------------------------------------ */

  /** Active tiers for client display, sorted by sortOrder */
  async getTiers(): Promise<SubscriptionTier[]> {
    return this.tierRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  /** All tiers for admin (including inactive) */
  async getAllTiers(): Promise<SubscriptionTier[]> {
    return this.tierRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createTier(data: Partial<SubscriptionTier>): Promise<SubscriptionTier> {
    const tier = this.tierRepo.create(data);
    return this.tierRepo.save(tier);
  }

  async updateTier(
    id: string,
    data: Partial<SubscriptionTier>,
  ): Promise<SubscriptionTier> {
    const tier = await this.tierRepo.findOne({ where: { id } });
    if (!tier) throw new NotFoundException('TIER_NOT_FOUND');
    Object.assign(tier, data);
    return this.tierRepo.save(tier);
  }

  /* ------------------------------------------------------------------ */
  /*  User subscriptions                                                 */
  /* ------------------------------------------------------------------ */

  /** Get the user's currently active subscription (or null) */
  async getActiveSubscription(userId: string): Promise<Subscription | null> {
    return this.subRepo.findOne({
      where: { userId, status: 'ACTIVE' },
      relations: { tier: true },
    });
  }

  /** Purchase a new subscription (with pessimistic lock to prevent doubles) */
  async purchase(userId: string, tierId: string): Promise<Subscription> {
    return this.dataSource.transaction(async (manager) => {
      // Pessimistic lock: check for existing ACTIVE subscription
      const existing = await manager
        .createQueryBuilder(Subscription, 's')
        .setLock('pessimistic_write')
        .where('s.userId = :userId AND s.status = :status', {
          userId,
          status: 'ACTIVE',
        })
        .getOne();

      if (existing) {
        throw new BadRequestException('SUBSCRIPTION_ALREADY_ACTIVE');
      }

      const tier = await manager.findOne(SubscriptionTier, {
        where: { id: tierId, isActive: true },
      });
      if (!tier) {
        throw new NotFoundException('SUBSCRIPTION_TIER_NOT_FOUND');
      }

      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + tier.billingDays);

      const sub = manager.create(Subscription, {
        userId,
        tierId: tier.id,
        status: 'ACTIVE',
        ordersUsed: 0,
        startDate: now,
        expiresAt,
      });

      const saved = await manager.save(Subscription, sub);

      // Reload with tier relation
      const full = await manager.findOne(Subscription, {
        where: { id: saved.id },
        relations: { tier: true },
      });
      return full!;
    });
  }

  /** Cancel the user's active subscription */
  async cancel(userId: string): Promise<Subscription> {
    const sub = await this.subRepo.findOne({
      where: { userId, status: 'ACTIVE' },
      relations: { tier: true },
    });
    if (!sub) {
      throw new BadRequestException('NO_ACTIVE_SUBSCRIPTION');
    }
    sub.status = 'CANCELED';
    return this.subRepo.save(sub);
  }

  /** Atomically increment ordersUsed for a subscription */
  async incrementOrdersUsed(subscriptionId: string): Promise<void> {
    await this.subRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ ordersUsed: () => '"ordersUsed" + 1' })
      .where('id = :id', { id: subscriptionId })
      .execute();
  }

  /**
   * Check if user has an active subscription with remaining orders.
   * Returns the discount percent and subscription id, or 0/null.
   */
  async getSubscriptionDiscount(
    userId: string,
  ): Promise<{ discountPercent: number; subscriptionId: string | null }> {
    const sub = await this.subRepo.findOne({
      where: { userId, status: 'ACTIVE' },
      relations: { tier: true },
    });

    if (
      !sub ||
      sub.expiresAt < new Date() ||
      sub.ordersUsed >= sub.tier.maxOrders
    ) {
      return { discountPercent: 0, subscriptionId: null };
    }

    return {
      discountPercent: sub.tier.discountPercent,
      subscriptionId: sub.id,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Admin stats                                                        */
  /* ------------------------------------------------------------------ */

  async getStats(): Promise<Record<string, number>> {
    const rows: { status: string; count: string }[] = await this.subRepo
      .createQueryBuilder('s')
      .select('s.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('s.status')
      .getRawMany();

    const stats: Record<string, number> = {};
    for (const row of rows) {
      stats[row.status] = parseInt(row.count, 10);
    }
    return stats;
  }

  /* ------------------------------------------------------------------ */
  /*  Cron: expire subscriptions daily at 3 AM                           */
  /* ------------------------------------------------------------------ */

  @Cron('0 3 * * *')
  async handleExpiredSubscriptions(): Promise<void> {
    this.logger.log('Running subscription expiry cron...');

    const expired = await this.subRepo.find({
      where: {
        status: 'ACTIVE',
        expiresAt: LessThan(new Date()),
      },
    });

    if (!expired.length) {
      this.logger.log('No expired subscriptions found');
      return;
    }

    // Mark all as expired
    const ids = expired.map((s) => s.id);
    await this.subRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ status: 'EXPIRED' })
      .whereInIds(ids)
      .execute();

    this.logger.log(`Expired ${ids.length} subscriptions`);

    // Send push notifications (fire-and-forget)
    for (const sub of expired) {
      this.sendExpiryPush(sub.userId).catch((err) => {
        this.logger.warn(
          `Failed to send expiry push for user ${sub.userId}: ${err}`,
        );
      });
    }
  }

  private async sendExpiryPush(userId: string): Promise<void> {
    const token = await this.usersService.getPushToken(userId);
    if (!token) return;
    await this.pushService.send([token], {
      title: 'Подписка истекла',
      body: 'Ваша подписка истекла. Оформите новую, чтобы продолжить получать скидки!',
      data: { type: 'subscription_expired' },
    });
  }
}
