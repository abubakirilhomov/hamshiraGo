import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { RedeemPointsDto } from './dto/redeem-points.dto';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  /** Returns current user's loyalty balance and tier info */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getBalance(@ClientId() userId: string) {
    return this.loyaltyService.getBalance(userId);
  }

  /** Paginated loyalty transaction history */
  @UseGuards(JwtAuthGuard)
  @Get('history')
  getHistory(
    @ClientId() userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.loyaltyService.getHistory(
      userId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /** Redeem loyalty points for a UZS discount */
  @UseGuards(JwtAuthGuard)
  @Post('redeem')
  redeem(@ClientId() userId: string, @Body() dto: RedeemPointsDto) {
    return this.loyaltyService.spendPoints(userId, dto.points);
  }
}
