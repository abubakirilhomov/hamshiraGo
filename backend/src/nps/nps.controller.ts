import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { NpsService } from './nps.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClientId } from '../auth/decorators/client-id.decorator';
import { SubmitNpsDto } from './dto/submit-nps.dto';

@Controller('nps')
export class NpsController {
  constructor(private readonly npsService: NpsService) {}

  /** Submit NPS score */
  @UseGuards(JwtAuthGuard)
  @Post('submit')
  submit(
    @ClientId() userId: string,
    @Body() dto: SubmitNpsDto,
  ) {
    return this.npsService.submit(userId, dto.score, dto.comment);
  }

  /** Check if user should see NPS survey */
  @UseGuards(JwtAuthGuard)
  @Get('check')
  async check(@ClientId() userId: string) {
    const answered = await this.npsService.hasAnsweredThisMonth(userId);
    return { shouldShow: !answered };
  }

  /** Admin: NPS dashboard stats */
  @UseGuards(AdminGuard)
  @Get('admin/stats')
  getStats() {
    return this.npsService.getStats();
  }
}
