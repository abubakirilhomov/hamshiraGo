import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PromoCode } from './entities/promo-code.entity';

@Injectable()
export class PromoService {
  constructor(
    @InjectRepository(PromoCode)
    private readonly promoRepo: Repository<PromoCode>,
  ) {}

  /** Admin: create a promo code */
  async create(data: Partial<PromoCode>): Promise<PromoCode> {
    const existing = await this.promoRepo.findOne({ where: { code: data.code } });
    if (existing) throw new BadRequestException('Promo code already exists');
    const promo = this.promoRepo.create({
      ...data,
      code: data.code?.toUpperCase(),
    });
    return this.promoRepo.save(promo);
  }

  /** Admin: list all promo codes */
  async findAll(): Promise<PromoCode[]> {
    return this.promoRepo.find({ order: { createdAt: 'DESC' } });
  }

  /** Admin: deactivate a promo code */
  async deactivate(id: string): Promise<PromoCode> {
    const promo = await this.promoRepo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    promo.isActive = false;
    return this.promoRepo.save(promo);
  }

  /** Validate and apply a promo code — returns discount amount in UZS */
  async validate(code: string, servicePrice: number): Promise<{ valid: boolean; discountAmount: number; promoId: string | null }> {
    const promo = await this.promoRepo.findOne({ where: { code: code.toUpperCase() } });
    if (!promo || !promo.isActive) {
      return { valid: false, discountAmount: 0, promoId: null };
    }
    if (promo.expiresAt && new Date() > promo.expiresAt) {
      return { valid: false, discountAmount: 0, promoId: null };
    }
    if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) {
      return { valid: false, discountAmount: 0, promoId: null };
    }

    let discount = promo.discountAmount;
    if (!discount && promo.discountPercent > 0) {
      discount = Math.round(servicePrice * promo.discountPercent / 100);
    }

    return { valid: true, discountAmount: discount, promoId: promo.id };
  }

  /** Increment usage count after order created */
  async incrementUsage(promoId: string): Promise<void> {
    await this.promoRepo
      .createQueryBuilder()
      .update(PromoCode)
      .set({ usedCount: () => '"usedCount" + 1' })
      .where('id = :id', { id: promoId })
      .execute();
  }
}
