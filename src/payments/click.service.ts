import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';

export interface ClickPrepareDto {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id: string;
  merchant_trans_id: string;
  amount: string;
  action: string;
  sign_time: string;
  sign_string: string;
}

export interface ClickCompleteDto {
  click_trans_id: string;
  service_id: string;
  click_paydoc_id: string;
  merchant_trans_id: string;
  merchant_prepare_id: string;
  amount: string;
  action: string;
  sign_time: string;
  sign_string: string;
  error: string;
}

@Injectable()
export class ClickService {
  private readonly logger = new Logger(ClickService.name);

  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private config: ConfigService,
  ) {}

  buildClickUrl(orderId: string, amountUzs: number): string {
    const serviceId = this.config.get<string>('CLICK_SERVICE_ID', '');
    const merchantId = this.config.get<string>('CLICK_MERCHANT_ID', '');
    const appUrl = this.config.get<string>('APP_URL', '');
    return `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amountUzs}&transaction_param=${orderId}&return_url=${appUrl}/payment/success`;
  }

  async prepare(dto: ClickPrepareDto): Promise<Record<string, unknown>> {
    const secretKey = this.config.get<string>('CLICK_SECRET_KEY', '');
    const serviceId = this.config.get<string>('CLICK_SERVICE_ID', '');

    // Verify signature
    const signString = crypto
      .createHash('md5')
      .update(
        `${dto.click_trans_id}${serviceId}${secretKey}${dto.merchant_trans_id}${dto.amount}${dto.action}${dto.sign_time}`,
      )
      .digest('hex');

    if (signString !== dto.sign_string) {
      return { error: -1, error_note: 'SIGN CHECK FAILED!' };
    }

    if (dto.action !== '0') {
      return { error: -3, error_note: 'Action not found' };
    }

    const order = await this.orderRepo.findOne({ where: { id: dto.merchant_trans_id } });
    if (!order) {
      return { error: -5, error_note: 'User does not exist' };
    }

    const amount = parseFloat(dto.amount);
    const netPrice = (order.priceAmount ?? 0) - (order.discountAmount ?? 0);
    if (Math.round(amount) !== netPrice) {
      return { error: -2, error_note: 'Incorrect parameter amount' };
    }

    // Check if already paid
    const existingPaid = await this.paymentRepo.findOne({
      where: { orderId: order.id, provider: 'click', status: 'paid' },
    });
    if (existingPaid) {
      return { error: -4, error_note: 'Already paid' };
    }

    const payment = this.paymentRepo.create({
      orderId: order.id,
      provider: 'click',
      status: 'pending',
      amount: Math.round(amount),
      providerTransactionId: dto.click_trans_id,
      providerState: 1,
    });
    await this.paymentRepo.save(payment);

    return {
      error: 0,
      error_note: 'Success',
      click_trans_id: dto.click_trans_id,
      merchant_trans_id: dto.merchant_trans_id,
      merchant_prepare_id: payment.id,
    };
  }

  async complete(dto: ClickCompleteDto): Promise<Record<string, unknown>> {
    const secretKey = this.config.get<string>('CLICK_SECRET_KEY', '');
    const serviceId = this.config.get<string>('CLICK_SERVICE_ID', '');

    // Verify signature
    const signString = crypto
      .createHash('md5')
      .update(
        `${dto.click_trans_id}${serviceId}${secretKey}${dto.merchant_trans_id}${dto.merchant_prepare_id}${dto.amount}${dto.action}${dto.sign_time}`,
      )
      .digest('hex');

    if (signString !== dto.sign_string) {
      return { error: -1, error_note: 'SIGN CHECK FAILED!' };
    }

    if (dto.action !== '1') {
      return { error: -3, error_note: 'Action not found' };
    }

    // Find payment by prepare id
    const payment = await this.paymentRepo.findOne({ where: { id: dto.merchant_prepare_id, provider: 'click' } });
    if (!payment) {
      return { error: -6, error_note: 'Transaction does not exist' };
    }

    if (payment.providerTransactionId !== dto.click_trans_id) {
      return { error: -6, error_note: 'Transaction does not exist' };
    }

    if (parseInt(dto.error) < 0) {
      // Click cancelled payment
      payment.status = 'cancelled';
      payment.providerState = -1;
      payment.cancelTime = new Date();
      await this.paymentRepo.save(payment);
      return { error: 0, error_note: 'Success' };
    }

    payment.status = 'paid';
    payment.providerState = 2;
    payment.performTime = new Date();
    await this.paymentRepo.save(payment);

    return {
      error: 0,
      error_note: 'Success',
      click_trans_id: dto.click_trans_id,
      merchant_trans_id: dto.merchant_trans_id,
      merchant_confirm_id: payment.id,
    };
  }
}
