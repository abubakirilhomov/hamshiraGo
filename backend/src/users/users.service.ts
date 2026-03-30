import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async create(data: { phone: string; passwordHash: string; name: string | null; referredBy?: string | null }): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  private isMissingColumnError(err: unknown): boolean {
    return (
      err instanceof Error &&
      /column .* does not exist/i.test(err.message)
    );
  }

  private findBaseBy(field: 'id' | 'phone', value: string): Promise<User | null> {
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

  async savePushToken(id: string, token: string): Promise<void> {
    await this.userRepo.update(id, { pushToken: token });
  }

  async getPushToken(id: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id }, select: ['pushToken'] });
    return user?.pushToken ?? null;
  }

  async blockUser(id: string, isBlocked: boolean): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('User not found');
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
}
