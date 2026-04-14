import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(data: { phone: string; passwordHash: string; name: string | null; referredBy?: string | null }): Promise<User> {
    try {
      const user = this.userRepo.create(data);
      return await this.userRepo.save(user);
    } catch (err: unknown) {
      if (this.isMissingColumnError(err)) {
        // Fallback: insert only base columns that definitely exist on Railway
        const rows = await this.userRepo.query(
          `INSERT INTO users (phone, "passwordHash", name) VALUES ($1, $2, $3) RETURNING *`,
          [data.phone, data.passwordHash, data.name],
        );
        return this.userRepo.create(rows[0] as Partial<User>);
      }
      throw err;
    }
  }

  private isMissingColumnError(err: unknown): boolean {
    return (
      err instanceof Error &&
      /column .* does not exist/i.test(err.message)
    );
  }

  private async findBaseBy(field: 'id' | 'phone', value: string): Promise<User | null> {
    // Try including referral columns first so referral logic works
    try {
      return await this.userRepo
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.phone',
          'user.name',
          'user.passwordHash',
          'user.pushToken',
          'user.isBlocked',
          'user.referralCode',
          'user.referredBy',
          'user.referralBonusUsed',
          'user.pendingReferralDiscount',
        ])
        .where(`user.${field} = :value`, { value })
        .getOne();
    } catch (err) {
      if (!this.isMissingColumnError(err)) throw err;
    }
    // Fall back without referral columns
    return this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.phone',
        'user.name',
        'user.passwordHash',
        'user.pushToken',
        'user.isBlocked',
      ])
      .where(`user.${field} = :value`, { value })
      .getOne();
  }

  async findByReferralCode(code: string): Promise<User | null> {
    try {
      return await this.userRepo.findOne({ where: { referralCode: code } });
    } catch (err) {
      // Backward compatibility for old DB schema where referral columns are not migrated yet
      if (this.isMissingColumnError(err)) return null;
      throw err;
    }
  }

  async setReferralCode(id: string, code: string): Promise<void> {
    try {
      await this.userRepo.update(id, { referralCode: code });
    } catch (err) {
      if (this.isMissingColumnError(err)) return;
      throw err;
    }
  }

  async setPendingReferralDiscount(id: string, amount: number): Promise<void> {
    try {
      await this.userRepo.update(id, { pendingReferralDiscount: amount });
    } catch (err) {
      if (this.isMissingColumnError(err)) return;
      throw err;
    }
  }

  async markReferralBonusUsed(id: string): Promise<void> {
    try {
      await this.userRepo.update(id, { referralBonusUsed: true });
    } catch (err) {
      if (this.isMissingColumnError(err)) return;
      throw err;
    }
  }

  async findById(id: string): Promise<User | null> {
    try {
      return await this.userRepo.findOne({ where: { id } });
    } catch (err) {
      if (this.isMissingColumnError(err)) {
        return this.findBaseBy('id', id);
      }
      throw err;
    }
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      return await this.userRepo.findOne({ where: { phone } });
    } catch (err) {
      if (this.isMissingColumnError(err)) {
        return this.findBaseBy('phone', phone);
      }
      throw err;
    }
  }

  async updateProfile(id: string, data: { name?: string }): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    if (data.name !== undefined) user.name = data.name;
    return this.userRepo.save(user);
  }

  async savePushToken(id: string, token: string): Promise<void> {
    await this.userRepo.update(id, { pushToken: token });
  }

  async getPushToken(id: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id }, select: ['pushToken'] });
    return user?.pushToken ?? null;
  }

  async saveTelegramChatId(id: string, chatId: string | null): Promise<void> {
    await this.userRepo.update(id, { telegramChatId: chatId });
  }

  async getTelegramChatId(id: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id }, select: ['id', 'telegramChatId'] });
    return user?.telegramChatId ?? null;
  }

  async blockUser(id: string, isBlocked: boolean): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    await this.userRepo.update(id, { isBlocked });
  }

  async findAllAdmin(
    page = 1,
    limit = 20,
    search?: string,
    isBlocked?: boolean,
  ): Promise<{ data: Partial<User>[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;

    const qb = this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.phone',
        'user.name',
        'user.isBlocked',
        'user.created_at',
        'user.updated_at',
      ])
      .orderBy('user.created_at', 'DESC')
      .take(take)
      .skip(skip);

    if (search?.trim()) {
      qb.andWhere('(user.phone ILIKE :q OR user.name ILIKE :q)', {
        q: `%${search.trim()}%`,
      });
    }

    if (typeof isBlocked === 'boolean') {
      qb.andWhere('user.isBlocked = :isBlocked', { isBlocked });
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page: Math.max(page, 1),
      totalPages: Math.ceil(total / take),
    };
  }

  // ── Account Deletion (GDPR / App Store compliance) ───────────────────

  /**
   * Soft-delete a user account:
   * 1. Anonymize PII (phone, name, tokens)
   * 2. Cancel active orders
   * 3. Hard-delete medical card, favorites, push subscriptions
   * 4. Soft-delete the user record
   */
  async deleteAccount(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('USER_NOT_FOUND');

    const anonPhone = `deleted_${userId.slice(0, 8)}`;

    await this.dataSource.transaction(async (manager) => {
      // 1. Anonymize user data
      await manager.update(User, userId, {
        phone: anonPhone,
        name: null,
        pushToken: null,
        telegramChatId: null,
        referralCode: null,
        isBlocked: true,
      });

      // 2. Cancel active orders
      try {
        await manager.query(
          `UPDATE orders SET status = 'CANCELED', "cancelReason" = 'Account deleted'
           WHERE "clientId" = $1 AND status NOT IN ('DONE', 'CANCELED')`,
          [userId],
        );
      } catch (err) {
        this.logger.warn(`Failed to cancel active orders: ${err}`);
      }

      // 3. Hard-delete medical data
      try {
        await manager.query(`DELETE FROM medical_cards WHERE "userId" = $1`, [userId]);
      } catch (err) {
        this.logger.warn(`Failed to delete medical card: ${err}`);
      }

      // 4. Hard-delete favorites
      try {
        await manager.query(`DELETE FROM favorite_medics WHERE "userId" = $1`, [userId]);
      } catch (err) {
        this.logger.warn(`Failed to delete favorites: ${err}`);
      }

      // 5. Hard-delete push subscriptions
      try {
        await manager.query(
          `DELETE FROM web_push_subscriptions WHERE "subscriberType" = 'client' AND "subscriberId" = $1`,
          [userId],
        );
      } catch (err) {
        this.logger.warn(`Failed to delete push subscriptions: ${err}`);
      }

      // 6. Soft-delete user
      await manager.softDelete(User, userId);
    });

    this.logger.log(`Account deleted (soft) for user=${userId}`);
  }
}
