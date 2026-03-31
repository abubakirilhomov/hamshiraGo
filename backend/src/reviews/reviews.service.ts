import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async create(
    dto: CreateReviewDto,
    userId: string,
    role: 'client' | 'medic',
  ): Promise<Review> {
    // 1. Load order
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // 2. Order must be DONE
    if (order.status !== OrderStatus.DONE) {
      throw new BadRequestException('Reviews can only be submitted for completed orders');
    }

    // 3. Author must be a participant of this order
    if (role === 'client' && order.clientId !== userId) {
      throw new ForbiddenException('You are not the client of this order');
    }
    if (role === 'medic' && order.medicId !== userId) {
      throw new ForbiddenException('You are not the medic of this order');
    }

    // 4. targetRole must be the opposite of authorRole
    if (role === 'client' && dto.targetRole !== 'medic') {
      throw new BadRequestException('Client can only review a medic');
    }
    if (role === 'medic' && dto.targetRole !== 'client') {
      throw new BadRequestException('Medic can only review a client');
    }

    // 5. Resolve targetId
    const targetId =
      dto.targetRole === 'medic'
        ? (order.medicId ?? null)
        : order.clientId;

    if (!targetId) {
      throw new BadRequestException('No target participant found for this order');
    }

    // 6. Check not already reviewed (unique constraint will catch it too, but give a friendly error)
    const existing = await this.reviewRepo.findOne({
      where: { orderId: dto.orderId, authorRole: role },
    });
    if (existing) {
      throw new BadRequestException('You have already submitted a review for this order');
    }

    // 7. Save review
    const review = this.reviewRepo.create({
      orderId: dto.orderId,
      authorId: userId,
      authorRole: role,
      targetId,
      targetRole: dto.targetRole,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    const saved = await this.reviewRepo.save(review);

    // 8. Recalculate average rating asynchronously (don't block the response)
    this.recalcAverageRating(targetId, dto.targetRole).catch((err) => {
      console.error('[ReviewsService] recalcAverageRating error:', err);
    });

    return saved;
  }

  /**
   * Recalculate and persist the average rating for a medic or client.
   * Uses try/catch around the user update so that if `averageRating` column
   * doesn't exist on the users table yet, it doesn't crash the app.
   */
  async recalcAverageRating(
    targetId: string,
    targetRole: 'medic' | 'client',
  ): Promise<void> {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(*)', 'cnt')
      .where('r.targetId = :targetId', { targetId })
      .andWhere('r.targetRole = :targetRole', { targetRole })
      .getRawOne<{ avg: string | null; cnt: string }>();

    const avg = result?.avg != null ? parseFloat(result.avg) : null;
    const cnt = result?.cnt ? parseInt(result.cnt, 10) : 0;

    if (avg == null) return;

    if (targetRole === 'medic') {
      // medics.rating column exists for sure
      await this.dataSource
        .createQueryBuilder()
        .update('medics')
        .set({ rating: avg, reviewCount: cnt } as Record<string, unknown>)
        .where('id = :id', { id: targetId })
        .execute();
    } else {
      // users.averageRating may not exist on Railway yet — tolerate missing column
      try {
        await this.dataSource
          .createQueryBuilder()
          .update('users')
          .set({ averageRating: avg } as Record<string, unknown>)
          .where('id = :id', { id: targetId })
          .execute();
      } catch (err) {
        // Column doesn't exist yet — safe to ignore until migration adds it
        console.warn('[ReviewsService] users.averageRating column not ready, skipping update');
      }
    }
  }

  /** Paginated list of reviews targeting a medic, newest first */
  async findByMedic(
    medicId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: Review[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepo.findAndCount({
      where: { targetId: medicId, targetRole: 'medic' },
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return { data, total, page, limit };
  }

  /** Paginated list of reviews targeting a client, newest first */
  async findByClient(
    clientId: string,
    query: PaginationQueryDto,
  ): Promise<{ data: Review[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await this.reviewRepo.findAndCount({
      where: { targetId: clientId, targetRole: 'client' },
      order: { createdAt: 'DESC' },
      take: limit,
      skip,
    });

    return { data, total, page, limit };
  }

  /** Return both reviews for a given order (client→medic and medic→client) */
  async findByOrder(orderId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }
}
