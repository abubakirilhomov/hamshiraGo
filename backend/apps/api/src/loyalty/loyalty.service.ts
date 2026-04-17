import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { LoyaltyTransaction } from './entities/loyalty-transaction.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { AppSettingsService } from '../app-settings/app-settings.service';

/** Default loyalty config values (used when AppSettings columns are missing) */
const DEFAULTS = {
  pointsPerOrder: 100,
  silverThreshold: 500,
  goldThreshold: 2000,
  redemptionRate: 1000, // 100 points = 1000 UZS
} as const;

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectRepository(LoyaltyTransaction)
    private readonly txRepo: Repository<LoyaltyTransaction>,
    private readonly appSettingsService: AppSettingsService,
    private readonly dataSource: DataSource,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Award points after an order is marked DONE                        */
  /* ------------------------------------------------------------------ */
  async awardPoints(
    userId: string,
    orderId: string,
    _netPrice: number,
  ): Promise<{
    pointsEarned: number;
    newBalance: number;
    tierChanged: boolean;
    newTier: string;
  }> {
    const settings = await this.appSettingsService.get();
    const pointsPerOrder =
      (settings as any).loyaltyPointsPerOrder ?? DEFAULTS.pointsPerOrder;
    const silverThreshold =
      (settings as any).loyaltySilverThreshold ?? DEFAULTS.silverThreshold;
    const goldThreshold =
      (settings as any).loyaltyGoldThreshold ?? DEFAULTS.goldThreshold;

    return this.dataSource.transaction(async (manager) => {
      // Lock user row to prevent concurrent point mutations
      const user = await manager
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: userId })
        .getOne();

      if (!user) throw new NotFoundException('USER_NOT_FOUND');

      const currentTier = (user as any).loyaltyTier ?? 'BRONZE';
      const currentPoints: number = (user as any).loyaltyPoints ?? 0;

      // Tier multiplier
      let multiplier = 1;
      if (currentTier === 'GOLD') multiplier = 2;
      else if (currentTier === 'SILVER') multiplier = 1.5;

      const earned = Math.round(pointsPerOrder * multiplier);

      // Save EARNED transaction
      await manager.save(LoyaltyTransaction, {
        userId,
        orderId,
        type: 'EARNED' as const,
        points: earned,
        description: `Order completed (+${earned} pts, x${multiplier} ${currentTier})`,
      });

      let totalEarned = earned;

      // Milestone bonus: every 5th DONE order
      const doneCount = await manager.count(Order, {
        where: { clientId: userId, status: 'DONE' as any },
      });
      if (doneCount > 0 && doneCount % 5 === 0) {
        const milestoneBonus = 500;
        await manager.save(LoyaltyTransaction, {
          userId,
          orderId,
          type: 'MILESTONE' as const,
          points: milestoneBonus,
          description: `Milestone: ${doneCount} orders completed (+${milestoneBonus} bonus)`,
        });
        totalEarned += milestoneBonus;
      }

      // Update user balance
      const newBalance = currentPoints + totalEarned;

      // Recalculate tier
      let newTier = 'BRONZE';
      if (newBalance >= goldThreshold) newTier = 'GOLD';
      else if (newBalance >= silverThreshold) newTier = 'SILVER';

      await manager.update(User, userId, {
        loyaltyPoints: newBalance,
        loyaltyTier: newTier,
      } as any);

      return {
        pointsEarned: totalEarned,
        newBalance,
        tierChanged: newTier !== currentTier,
        newTier,
      };
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Spend points to get a discount                                    */
  /* ------------------------------------------------------------------ */
  async spendPoints(
    userId: string,
    points: number,
  ): Promise<{ discountAmountUZS: number }> {
    if (points <= 0) {
      throw new BadRequestException('LOYALTY_POINTS_POSITIVE');
    }

    const settings = await this.appSettingsService.get();
    const redemptionRate =
      (settings as any).loyaltyRedemptionRate ?? DEFAULTS.redemptionRate;

    return this.dataSource.transaction(async (manager) => {
      const user = await manager
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: userId })
        .getOne();

      if (!user) throw new NotFoundException('USER_NOT_FOUND');

      const currentPoints: number = (user as any).loyaltyPoints ?? 0;
      if (currentPoints < points) {
        throw new BadRequestException('INSUFFICIENT_LOYALTY_POINTS');
      }

      const discountAmountUZS = Math.round(points * (redemptionRate / 100));

      await manager.save(LoyaltyTransaction, {
        userId,
        orderId: null,
        type: 'SPENT' as const,
        points: -points,
        description: `Redeemed ${points} pts for ${discountAmountUZS} UZS discount`,
      });

      await manager.update(User, userId, {
        loyaltyPoints: currentPoints - points,
      } as any);

      return { discountAmountUZS };
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Balance & tier info                                               */
  /* ------------------------------------------------------------------ */
  async getBalance(
    userId: string,
  ): Promise<{
    points: number;
    tier: string;
    nextTierAt: number | null;
    nextTierName: string | null;
  }> {
    const settings = await this.appSettingsService.get();
    const silverThreshold =
      (settings as any).loyaltySilverThreshold ?? DEFAULTS.silverThreshold;
    const goldThreshold =
      (settings as any).loyaltyGoldThreshold ?? DEFAULTS.goldThreshold;

    let user: User | null;
    try {
      user = await this.dataSource.getRepository(User).findOne({
        where: { id: userId },
      });
    } catch {
      // loyaltyPoints/loyaltyTier columns may not exist yet
      user = await this.dataSource.getRepository(User).findOne({
        where: { id: userId },
      });
    }

    if (!user) throw new NotFoundException('User not found');

    const points: number = (user as any).loyaltyPoints ?? 0;
    const tier: string = (user as any).loyaltyTier ?? 'BRONZE';

    let nextTierAt: number | null = null;
    let nextTierName: string | null = null;
    if (tier === 'BRONZE') {
      nextTierAt = silverThreshold - points;
      nextTierName = 'SILVER';
    } else if (tier === 'SILVER') {
      nextTierAt = goldThreshold - points;
      nextTierName = 'GOLD';
    }
    // GOLD has no next tier

    return { points, tier, nextTierAt, nextTierName };
  }

  /* ------------------------------------------------------------------ */
  /*  Transaction history (paginated)                                   */
  /* ------------------------------------------------------------------ */
  async getHistory(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: LoyaltyTransaction[]; total: number; page: number }> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;

    const [data, total] = await this.txRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take,
      skip,
    });

    return { data, total, page };
  }
}
