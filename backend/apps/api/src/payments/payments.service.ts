import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Order } from '../orders/entities/order.entity';
import { Consultation } from '../consultations/entities/consultation.entity';
import { PaymeService } from './payme.service';
import { ClickService } from './click.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(Consultation)
    private consultationRepo: Repository<Consultation>,
    private paymeService: PaymeService,
    private clickService: ClickService,
    private dataSource: DataSource,
  ) {}

  async verifyOrderOwnership(orderId: string, userId: string): Promise<void> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
    if (order.clientId !== userId) throw new ForbiddenException('NOT_YOUR_ORDER');
  }

  async initiatePayment(orderId: string): Promise<{
    paymeUrl: string;
    clickUrl: string;
    payment: Payment;
  }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

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
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');

    return this.paymentRepo.findOne({
      where: { orderId },
      order: { createdAt: 'DESC' },
    });
  }

  // ── Consultation Payments ──────────────────────────────────────────────

  async verifyConsultationOwnership(consultationId: string, userId: string): Promise<void> {
    const consultation = await this.consultationRepo.findOne({ where: { id: consultationId } });
    if (!consultation) throw new NotFoundException('CONSULTATION_NOT_FOUND');
    if (consultation.clientId !== userId) throw new ForbiddenException('NOT_YOUR_CONSULTATION');
  }

  async initiateConsultationPayment(consultationId: string): Promise<{
    paymeUrl: string;
    clickUrl: string;
    payment: Payment;
  }> {
    const consultation = await this.consultationRepo.findOne({ where: { id: consultationId } });
    if (!consultation) throw new NotFoundException('CONSULTATION_NOT_FOUND');
    if (consultation.paymentStatus === 'paid')
      throw new BadRequestException('ALREADY_PAID');

    const amount = consultation.price;

    const payment = await this.dataSource.transaction(async (manager) => {
      let p = await manager.findOne(Payment, {
        where: { consultationId, status: 'pending' },
        lock: { mode: 'pessimistic_write' },
      });
      if (!p) {
        p = manager.create(Payment, {
          consultationId,
          orderId: null,
          provider: 'payme',
          status: 'pending',
          amount,
        });
      } else {
        p.amount = amount;
      }
      return manager.save(Payment, p);
    });

    // Use consultation_id prefix in account so webhooks can distinguish
    const paymeUrl = this.paymeService.buildPaymeUrl(
      consultationId,
      amount,
      'consultation',
    );
    const clickUrl = this.clickService.buildClickUrl(
      consultationId,
      amount,
      'consultation',
    );

    return { paymeUrl, clickUrl, payment };
  }

  async getConsultationPaymentStatus(consultationId: string): Promise<Payment | null> {
    const consultation = await this.consultationRepo.findOne({ where: { id: consultationId } });
    if (!consultation) throw new NotFoundException('CONSULTATION_NOT_FOUND');

    return this.paymentRepo.findOne({
      where: { consultationId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Called by webhook handlers when consultation payment completes */
  async markConsultationPaid(consultationId: string): Promise<void> {
    await this.consultationRepo.update(consultationId, { paymentStatus: 'paid' });
  }
}
