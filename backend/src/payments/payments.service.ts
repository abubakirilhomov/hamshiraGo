import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymeService } from './payme.service';
import { ClickService } from './click.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private paymeService: PaymeService,
    private clickService: ClickService,
  ) {}

  async initiatePayment(orderId: string): Promise<{
    paymeUrl: string;
    clickUrl: string;
    payment: Payment;
  }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const amount = order.priceAmount ?? 0;

    // Upsert payment record (find pending or create new)
    let payment = await this.paymentRepo.findOne({
      where: { orderId, status: 'pending' },
    });

    if (!payment) {
      payment = this.paymentRepo.create({
        orderId,
        provider: 'payme',
        status: 'pending',
        amount,
      });
      await this.paymentRepo.save(payment);
    } else {
      // Update amount in case price changed
      payment.amount = amount;
      await this.paymentRepo.save(payment);
    }

    const paymeUrl = this.paymeService.buildPaymeUrl(orderId, amount);
    const clickUrl = this.clickService.buildClickUrl(orderId, amount);

    return { paymeUrl, clickUrl, payment };
  }

  async getPaymentStatus(orderId: string): Promise<Payment | null> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    return this.paymentRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }
}
