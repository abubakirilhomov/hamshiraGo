import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AppSettingsService } from './app-settings.service';
import { PatchSettingsDto } from './dto/patch-settings.dto';

@Controller('settings')
export class AppSettingsController {
  constructor(private readonly service: AppSettingsService) {}

  /** Public — mobile apps and web read current mode */
  @Get()
  async getSettings() {
    const s = await this.service.get();
    return { isPaidMode: s.isPaidMode };
  }

  /** Admin only — toggle paid mode */
  @Patch()
  @HttpCode(HttpStatus.OK)
  @UseGuards(AdminGuard)
  async patchSettings(@Body() dto: PatchSettingsDto) {
    const s = await this.service.setIsPaidMode(dto.isPaidMode);
    return { isPaidMode: s.isPaidMode };
  }
}
