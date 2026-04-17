import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PromoService } from './promo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CreatePromoDto, ValidatePromoDto } from './dto/create-promo.dto';

@Controller('promo')
export class PromoController {
  constructor(private readonly promoService: PromoService) {}

  /** Validate a promo code (client) */
  @UseGuards(JwtAuthGuard)
  @Post('validate')
  validate(@Body() dto: ValidatePromoDto) {
    return this.promoService.validate(dto.code, 0);
  }

  /** Admin: list all promo codes */
  @UseGuards(AdminGuard)
  @Get('admin')
  findAll() {
    return this.promoService.findAll();
  }

  /** Admin: create a promo code */
  @UseGuards(AdminGuard)
  @Post('admin')
  create(@Body() dto: CreatePromoDto) {
    return this.promoService.create({
      ...dto,
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
    });
  }

  /** Admin: deactivate a promo code */
  @UseGuards(AdminGuard)
  @Patch('admin/:id/deactivate')
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.promoService.deactivate(id);
  }
}
