import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  /** Returns the current user's referral code, counts, and pending discount */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyReferrals(@ClientId() userId: string) {
    return this.referralsService.getMyReferrals(userId);
  }

  /** Public — check if a referral code is valid (for registration UI) */
  @Get('validate/:code')
  validateCode(@Param('code') code: string) {
    return this.referralsService.validateCode(code);
  }
}
