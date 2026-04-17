import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { IsEnum } from 'class-validator';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ClientErrorsService } from './client-errors.service';
import { CreateClientErrorDto } from './dto/create-client-error.dto';
import { ClientErrorStatus } from './entities/client-error-status.enum';

class UpdateClientErrorStatusDto {
  @IsEnum(ClientErrorStatus)
  status!: ClientErrorStatus;
}

@Controller('client-errors')
export class ClientErrorsController {
  constructor(private readonly service: ClientErrorsService) {}

  /** Public endpoint — no auth required. Stricter rate limit: 20 req/min. */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  async report(@Body() dto: CreateClientErrorDto): Promise<void> {
    await this.service.save(dto);
  }

  // ── Admin endpoints ────────────────────────────────────────────────────────

  /** Admin: stats counts per status. Must be declared before :id routes. */
  @Get('admin/stats')
  @UseGuards(AdminGuard)
  getStats() {
    return this.service.getStats();
  }

  /** Admin: paginated list with optional filters. */
  @Get('admin')
  @UseGuards(AdminGuard)
  findAll(
    @Query('status') status?: ClientErrorStatus,
    @Query('appType') appType?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('userId') userId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findAll({
      status,
      appType,
      dateFrom,
      dateTo,
      userId,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /** Admin: update triage status of a specific error. */
  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateClientErrorStatusDto,
  ) {
    return this.service.updateStatus(id, dto.status);
  }
}
