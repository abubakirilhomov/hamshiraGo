import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    private dataSource: DataSource,
  ) {}

  async initiatePayment(orderId: string): Promise<{
    paymeUrl: string;
    clickUrl: string;
    payment: Payment;
  }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);

    const amount = (order.priceAmount ?? 0) - (order.discountAmount ?? 0); // netPrice: скидка уже вычтена

    // Pessimistic lock: prevents race condition creating duplicate pending payments
    const payment = await this.dataSource.transaction(async (manager) => {
      let p = await manager.findOne(Payment, {
        where: { orderId, status: 'pending' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!p) {
        p = manager.create(Payment, { orderId, provider: 'payme', status: 'pending', amount });
      } else {
        p.amount = amount;
      }
      return manager.save(Payment, p);
    });

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
