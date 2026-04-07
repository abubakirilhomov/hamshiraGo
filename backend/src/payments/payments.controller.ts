import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';
import { PaymeService } from './payme.service';
import { ClickService, ClickPrepareDto, ClickCompleteDto } from './click.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private paymeService: PaymeService,
    private clickService: ClickService,
  ) {}

  @Post(':orderId/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create/update payment record and return payment URLs' })
  async initiatePayment(@Param('orderId') orderId: string, @Req() req: Request) {
    const userId = (req as any).user?.id;
    await this.paymentsService.verifyOrderOwnership(orderId, userId);
    return this.paymentsService.initiatePayment(orderId);
  }

  @Get(':orderId/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current payment status for an order' })
  async getPaymentStatus(@Param('orderId') orderId: string, @Req() req: Request) {
    const userId = (req as any).user?.id;
    await this.paymentsService.verifyOrderOwnership(orderId, userId);
    return this.paymentsService.getPaymentStatus(orderId);
  }

  @Post('payme')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payme JSON-RPC webhook (Basic auth + IP whitelist)' })
  async paymeWebhook(
    @Headers('authorization') auth: string,
    @Req() req: Request,
    @Body() body: { method: string; params: Record<string, unknown>; id?: number },
  ) {
    this.paymeService.validateAuth(auth);
    this.paymeService.validateIp(req.ip);
    const result = await this.paymeService.handleRpc(body.method, body.params ?? {}) as Record<string, unknown>;
    return { jsonrpc: '2.0', id: body.id ?? null, ...result };
  }

  @Post('click/prepare')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Click prepare webhook' })
  async clickPrepare(@Req() req: Request, @Body() dto: ClickPrepareDto) {
    this.validateClickIp(req.ip);
    return this.clickService.prepare(dto);
  }

  @Post('click/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Click complete webhook' })
  async clickComplete(@Req() req: Request, @Body() dto: ClickCompleteDto) {
    this.validateClickIp(req.ip);
    return this.clickService.complete(dto);
  }

  /** Validate that request IP belongs to Click ranges: 185.8.212.0/24 or 195.158.28.0/24 */
  private validateClickIp(ip: string | undefined): void {
    if (process.env.NODE_ENV !== 'production') return;
    const normalized = (ip ?? '').replace(/^::ffff:/, '');
    const parts = normalized.split('.').map(Number);
    if (parts.length !== 4 || parts.some((p) => isNaN(p))) {
      throw new ForbiddenException('FORBIDDEN');
    }
    const isClick =
      (parts[0] === 185 && parts[1] === 8 && parts[2] === 212) ||
      (parts[0] === 195 && parts[1] === 158 && parts[2] === 28);
    if (!isClick) throw new ForbiddenException('FORBIDDEN');
  }
}
