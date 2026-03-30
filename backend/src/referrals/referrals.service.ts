import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Referral } from './entities/referral.entity';
import { UsersService } from '../users/users.service';

@Injectable()
export class ReferralsService {
  constructor(
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
    private usersService: UsersService,
  ) {}

  /** Returns referral summary for the current user */
  async getMyReferrals(userId: string): Promise<{
    referralCode: string | null;
    referredCount: number;
    bonusPaidCount: number;
    pendingReferralDiscount: number;
  }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const [referrals, referredCount] = await this.referralRepo.findAndCount({
      where: { referrerId: userId },
    });
    const bonusPaidCount = referrals.filter((r) => r.bonusPaid).length;

    return {
      referralCode: user.referralCode,
      referredCount,
      bonusPaidCount,
      pendingReferralDiscount: user.pendingReferralDiscount ?? 0,
    };
  }

  /** Validate that a referral code exists (public endpoint for registration UI) */
  async validateCode(code: string): Promise<{ valid: boolean }> {
    const user = await this.usersService.findByReferralCode(code);
    return { valid: !!user };
  }
}
