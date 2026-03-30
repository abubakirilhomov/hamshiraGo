import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { MedicalCard } from './entities/medical-card.entity';
import { UpsertMedicalCardDto } from './dto/upsert-medical-card.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.ASSIGNED,
  OrderStatus.ACCEPTED,
  OrderStatus.ON_THE_WAY,
  OrderStatus.ARRIVED,
  OrderStatus.SERVICE_STARTED,
];

@Injectable()
export class MedicalCardService {
  constructor(
    @InjectRepository(MedicalCard)
    private cardRepo: Repository<MedicalCard>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) {}

  /** Create or update medical card for user */
  async upsert(userId: string, dto: UpsertMedicalCardDto): Promise<MedicalCard> {
    let card = await this.cardRepo.findOne({ where: { userId } });
    if (card) {
      Object.assign(card, dto);
      return this.cardRepo.save(card);
    }
    card = this.cardRepo.create({ userId, ...dto });
    return this.cardRepo.save(card);
  }

  /** Returns card or null */
  async findByUserId(userId: string): Promise<MedicalCard | null> {
    return this.cardRepo.findOne({ where: { userId } });
  }

  /** Medic can only read client's card if assigned to an active order for this client */
  async findByUserIdForMedic(clientId: string, medicId: string): Promise<MedicalCard | null> {
    const activeOrder = await this.orderRepo.findOne({
      where: {
        clientId,
        medicId,
        status: In(ACTIVE_ORDER_STATUSES),
      },
    });

    if (!activeOrder) {
      throw new ForbiddenException('You are not assigned to an active order for this client');
    }

    return this.cardRepo.findOne({ where: { userId: clientId } });
  }
}
