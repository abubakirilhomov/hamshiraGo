import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentLedger } from './entities/payment-ledger.entity';

@Injectable()
export class PaymentLedgerService {
  constructor(
    @InjectRepository(PaymentLedger)
    private repo: Repository<PaymentLedger>,
  ) {}

  async record(data: {
    orderId?: string;
    consultationId?: string;
    medicId?: string;
    doctorId?: string;
    companyId?: string;
    amount: number;
    type: 'EARNING' | 'COMMISSION' | 'REFUND' | 'LEAD_COMMISSION';
    description?: string;
  }): Promise<PaymentLedger> {
    const entity = this.repo.create(data as Partial<PaymentLedger>);
    return this.repo.save(entity);
  }

  async findAll(
    page = 1,
    limit = 50,
    filters?: {
      type?: string;
      medicId?: string;
      doctorId?: string;
      companyId?: string;
      from?: string;
      to?: string;
    },
  ) {
    const qb = this.repo
      .createQueryBuilder('l')
      .orderBy('l.createdAt', 'DESC');

    if (filters?.type)
      qb.andWhere('l.type = :type', { type: filters.type });
    if (filters?.medicId)
      qb.andWhere('l.medicId = :medicId', { medicId: filters.medicId });
    if (filters?.doctorId)
      qb.andWhere('l.doctorId = :doctorId', { doctorId: filters.doctorId });
    if (filters?.companyId)
      qb.andWhere('l.companyId = :companyId', {
        companyId: filters.companyId,
      });
    if (filters?.from)
      qb.andWhere('l.createdAt >= :from', { from: filters.from });
    if (filters?.to)
      qb.andWhere('l.createdAt <= :to', { to: filters.to });

    const take = Math.min(Math.max(limit, 1), 100);
    const skip = (Math.max(page, 1) - 1) * take;
    const [data, total] = await qb.take(take).skip(skip).getManyAndCount();

    return { data, total, page, totalPages: Math.ceil(total / take) };
  }

  async getSummary(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.repo
      .createQueryBuilder('l')
      .select('l.type', 'type')
      .addSelect('SUM(l.amount)', 'total')
      .addSelect('COUNT(*)', 'count')
      .where('l.createdAt >= :since', { since })
      .groupBy('l.type')
      .getRawMany();

    return rows.map((r) => ({
      type: r.type,
      total: parseInt(r.total, 10),
      count: parseInt(r.count, 10),
    }));
  }
}
