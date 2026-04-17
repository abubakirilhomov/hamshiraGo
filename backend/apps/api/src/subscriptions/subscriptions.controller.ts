import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { PurchaseSubscriptionDto } from './dto/purchase-subscription.dto';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /* ------------------------------------------------------------------ */
  /*  Public / Client endpoints                                          */
  /* ------------------------------------------------------------------ */

  /** List active subscription tiers (public) */
  @Get('tiers')
  getTiers() {
    return this.subscriptionsService.getTiers();
  }

  /** Get current user's active subscription */
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMySubscription(@ClientId() userId: string) {
    return this.subscriptionsService.getActiveSubscription(userId);
  }

  /** Purchase a subscription */
  @UseGuards(JwtAuthGuard)
  @Post('purchase')
  purchase(
    @ClientId() userId: string,
    @Body() dto: PurchaseSubscriptionDto,
  ) {
    return this.subscriptionsService.purchase(userId, dto.tierId);
  }

  /** Cancel active subscription */
  @UseGuards(JwtAuthGuard)
  @Post('cancel')
  cancel(@ClientId() userId: string) {
    return this.subscriptionsService.cancel(userId);
  }

  /* ------------------------------------------------------------------ */
  /*  Admin endpoints                                                    */
  /* ------------------------------------------------------------------ */

  /** Admin: list all tiers (including inactive) */
  @UseGuards(AdminGuard)
  @Get('admin/tiers')
  getAllTiers() {
    return this.subscriptionsService.getAllTiers();
  }

  /** Admin: create a new tier */
  @UseGuards(AdminGuard)
  @Post('admin/tiers')
  createTier(@Body() dto: CreateTierDto) {
    return this.subscriptionsService.createTier(dto);
  }

  /** Admin: update a tier */
  @UseGuards(AdminGuard)
  @Patch('admin/tiers/:id')
  updateTier(@Param('id') id: string, @Body() dto: UpdateTierDto) {
    return this.subscriptionsService.updateTier(id, dto);
  }

  /** Admin: subscription stats by status */
  @UseGuards(AdminGuard)
  @Get('admin/stats')
  getStats() {
    return this.subscriptionsService.getStats();
  }
}
