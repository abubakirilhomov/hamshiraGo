import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ClientErrorsService } from './client-errors.service';
import { CreateClientErrorDto } from './dto/create-client-error.dto';

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
}
