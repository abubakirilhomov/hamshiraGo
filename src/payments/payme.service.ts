import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';

// Payme error codes
const ERR_OBJECT_NOT_FOUND = -32504;
const ERR_WRONG_AMOUNT = -32400;
const ERR_CANNOT_PERFORM = -32300;
const ERR_ORDER_NOT_FOUND = -32001;
const ERR_ALREADY_PAID = -31001;
const ERR_ALREADY_CANCELLED = -31003;

@Injectable()
export class PaymeService {
  private readonly logger = new Logger(PaymeService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private config: ConfigService,
  ) {}

  /** Validate Basic auth header: "Basic base64(Paycom:{KEY})" */
  validateAuth(authHeader: string | undefined): void {
    const key = this.config.get<string>('PAYME_MERCHANT_KEY', '');
    const expected = Buffer.from(`Paycom:${key}`).toString('base64');
    const provided = (authHeader ?? '').replace(/^Basic\s+/i, '').trim();
    if (provided !== expected) {
      throw new UnauthorizedException('Invalid Payme credentials');
    }
  }

  /** Build Payme checkout URL */
  buildPaymeUrl(orderId: string, amountUzs: number): string {
    const merchantId = this.config.get<string>('PAYME_MERCHANT_ID', '');
    const tiyin = amountUzs * 100;
    const raw = `m=${merchantId};ac.order_id=${orderId};a=${tiyin}`;
    const encoded = Buffer.from(raw).toString('base64');
    const base = this.config.get<string>('PAYME_TEST_MODE', 'true') === 'true'
      ? 'https://checkout.test.paycom.uz'
      : 'https://checkout.paycom.uz';
    return `${base}/${encoded}`;
  }

  /** Handle JSON-RPC dispatch */
  async handleRpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    switch (method) {
      case 'CheckPerformTransaction':
        return this.checkPerformTransaction(params);
      case 'CreateTransaction':
        return this.createTransaction(params);
      case 'PerformTransaction':
        return this.performTransaction(params);
      case 'CancelTransaction':
        return this.cancelTransaction(params);
      case 'CheckTransaction':
        return this.checkTransaction(params);
      case 'GetStatement':
        return this.getStatement(params);
      default:
        return this.rpcError(-32601, 'Method not found');
    }
  }

  // ---- Private helpers ----

  private rpcOk(result: unknown) {
    return { result };
  }

  private rpcError(code: number, message: string, data?: unknown) {
    return { error: { code, message, data } };
  }

  private async findOrder(orderId: unknown): Promise<Order | null> {
    if (typeof orderId !== 'string') return null;
    return this.orderRepo.findOne({ where: { id: orderId } });
  }

  private async findPaymentByProviderTxId(id: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({ where: { providerTransactionId: id, provider: 'payme' } });
  }

  /** Payme sends amounts in tiyin; we store/compare in UZS */
  private tiyinToUzs(tiyin: number): number {
    return Math.round(tiyin / 100);
  }

  // ---- RPC methods ----

  private async checkPerformTransaction(params: Record<string, unknown>) {
    const account = params['account'] as Record<string, unknown> | undefined;
    const orderId = account?.['order_id'];
    const amountTiyin = params['amount'] as number | undefined;

    const order = await this.findOrder(orderId);
    if (!order) return this.rpcError(ERR_ORDER_NOT_FOUND, 'Order not found');
    if (order.status === OrderStatus.CANCELED) return this.rpcError(ERR_CANNOT_PERFORM, 'Order is cancelled');

    const amountUzs = this.tiyinToUzs(amountTiyin ?? 0);
    if (order.priceAmount !== null && amountUzs !== order.priceAmount) {
      return this.rpcError(ERR_WRONG_AMOUNT, 'Wrong amount');
    }

    const existing = await this.paymentRepo.findOne({ where: { orderId: order.id, provider: 'payme', status: 'paid' } });
    if (existing) return this.rpcError(ERR_ALREADY_PAID, 'Order already paid');

    return this.rpcOk({ allow: true });
  }

  private async createTransaction(params: Record<string, unknown>) {
    const id = params['id'] as string | undefined;
    const account = params['account'] as Record<string, unknown> | undefined;
    const orderId = account?.['order_id'];
    const amountTiyin = params['amount'] as number | undefined;
    const time = params['time'] as number | undefined;

    if (!id) return this.rpcError(ERR_OBJECT_NOT_FOUND, 'Transaction id required');

    // Check if transaction already exists
    let payment = await this.findPaymentByProviderTxId(id);
    if (payment) {
      if (payment.providerState === -1) return this.rpcError(ERR_ALREADY_CANCELLED, 'Transaction cancelled');
      return this.rpcOk({
        create_time: payment.createdAt.getTime(),
        transaction: payment.id,
        state: payment.providerState,
      });
    }

    const order = await this.findOrder(orderId);
    if (!order) return this.rpcError(ERR_ORDER_NOT_FOUND, 'Order not found');
    if (order.status === OrderStatus.CANCELED) return this.rpcError(ERR_CANNOT_PERFORM, 'Order is cancelled');

    const amountUzs = this.tiyinToUzs(amountTiyin ?? 0);

    payment = this.paymentRepo.create({
      orderId: order.id,
      provider: 'payme',
      status: 'pending',
      amount: amountUzs,
      providerTransactionId: id,
      providerState: 1,
    });
    if (time) {
      payment.createdAt = new Date(time);
    }
    await this.paymentRepo.save(payment);

    return this.rpcOk({
      create_time: payment.createdAt.getTime(),
      transaction: payment.id,
      state: 1,
    });
  }

  private async performTransaction(params: Record<string, unknown>) {
    const id = params['id'] as string | undefined;
    if (!id) return this.rpcError(ERR_OBJECT_NOT_FOUND, 'Transaction id required');

    const payment = await this.findPaymentByProviderTxId(id);
    if (!payment) return this.rpcError(ERR_OBJECT_NOT_FOUND, 'Transaction not found');
    if (payment.providerState === -1) return this.rpcError(ERR_ALREADY_CANCELLED, 'Transaction cancelled');
    if (payment.providerState === 2) {
      return this.rpcOk({
        transaction: payment.id,
        perform_time: payment.performTime!.getTime(),
        state: 2,
      });
    }

    payment.status = 'paid';
    payment.providerState = 2;
    payment.performTime = new Date();
    await this.paymentRepo.save(payment);

    return this.rpcOk({
      transaction: payment.id,
      perform_time: payment.performTime.getTime(),
      state: 2,
    });
  }

  private async cancelTransaction(params: Record<string, unknown>) {
    const id = params['id'] as string | undefined;
    const reason = params['reason'] as number | undefined;
    if (!id) return this.rpcError(ERR_OBJECT_NOT_FOUND, 'Transaction id required');

    const payment = await this.findPaymentByProviderTxId(id);
    if (!payment) return this.rpcError(ERR_OBJECT_NOT_FOUND, 'Transaction not found');

    if (payment.providerState === 2) {
      // Already performed — cannot cancel
      return this.rpcError(ERR_CANNOT_PERFORM, 'Cannot cancel performed transaction');
    }

    if (payment.providerState === -1) {
      return this.rpcOk({
        transaction: payment.id,
        cancel_time: payment.cancelTime!.getTime(),
        state: -1,
      });
    }

    payment.status = payment.providerState === 1 ? 'cancelled' : 'failed';
    payment.providerState = -1;
    payment.cancelTime = new Date();
    payment.reason = reason ?? null;
    await this.paymentRepo.save(payment);

    return this.rpcOk({
      transaction: payment.id,
      cancel_time: payment.cancelTime.getTime(),
      state: -1,
    });
  }

  private async checkTransaction(params: Record<string, unknown>) {
    const id = params['id'] as string | undefined;
    if (!id) return this.rpcError(ERR_OBJECT_NOT_FOUND, 'Transaction id required');

    const payment = await this.findPaymentByProviderTxId(id);
    if (!payment) return this.rpcError(ERR_OBJECT_NOT_FOUND, 'Transaction not found');

    return this.rpcOk({
      create_time: payment.createdAt.getTime(),
      perform_time: payment.performTime ? payment.performTime.getTime() : 0,
      cancel_time: payment.cancelTime ? payment.cancelTime.getTime() : 0,
      transaction: payment.id,
      state: payment.providerState,
      reason: payment.reason,
    });
  }

  private async getStatement(params: Record<string, unknown>) {
    const from = params['from'] as number | undefined;
    const to = params['to'] as number | undefined;
    if (!from || !to) return this.rpcError(-32600, 'from and to are required');

    const payments = await this.paymentRepo.find({
      where: {
        provider: 'payme',
        createdAt: Between(new Date(from), new Date(to)),
      },
    });

    const transactions = payments.map((p) => ({
      id: p.providerTransactionId,
      time: p.createdAt.getTime(),
      amount: p.amount * 100,
      account: { order_id: p.orderId },
      create_time: p.createdAt.getTime(),
      perform_time: p.performTime ? p.performTime.getTime() : 0,
      cancel_time: p.cancelTime ? p.cancelTime.getTime() : 0,
      transaction: p.id,
      state: p.providerState,
      reason: p.reason,
    }));

    return this.rpcOk({ transactions });
  }
}
