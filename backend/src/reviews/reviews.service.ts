import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Review } from './entities/review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { UsersService } from '../users/users.service';
import { MedicsService } from '../medics/medics.service';
import { TelegramService } from '../common/telegram.service';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,

    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectDataSource()
    private readonly dataSource: DataSource,

    private readonly pushService: PushNotificationsService,
    private readonly usersService: UsersService,
    private readonly medicsService: MedicsService,
    private readonly telegramService: TelegramService,
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

  /**
   * Get aggregated rating stats for a target (medic or client).
   * Used by dispatch to enrich invite payloads with client rating.
   */
  async getTargetRatingStats(
    targetId: string,
    targetRole: 'medic' | 'client',
  ): Promise<{ averageRating: number | null; reviewCount: number }> {
    const result = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .addSelect('COUNT(r.id)', 'cnt')
      .where('r.targetId = :targetId', { targetId })
      .andWhere('r.targetRole = :targetRole', { targetRole })
      .getRawOne();
    return {
      averageRating: result?.avg ? parseFloat(result.avg) : null,
      reviewCount: parseInt(result?.cnt ?? '0', 10),
    };
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

  /**
   * Cron: every 15 minutes — sends push/Telegram reminders for orders
   * completed ~1 hour ago where a review hasn't been left yet.
   *
   * Uses a 15-minute time window [75 min ago, 60 min ago] aligned with the
   * cron interval so each order is only processed once, without needing an
   * extra DB column.
   */
  @Cron('*/15 * * * *')
  async sendReviewReminders(): Promise<void> {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - 75 * 60_000); // 75 min ago
      const to = new Date(now.getTime() - 60 * 60_000);   // 60 min ago

      // Find DONE orders whose updated_at falls within the window
      const doneOrders = await this.orderRepo.find({
        where: {
          status: OrderStatus.DONE,
          updated_at: Between(from, to),
        },
        select: ['id', 'clientId', 'medicId'],
      });

      if (!doneOrders.length) return;

      // Load existing reviews for these orders in one query
      const orderIds = doneOrders.map((o) => o.id);
      const existingReviews = await this.reviewRepo
        .createQueryBuilder('r')
        .select(['r.orderId', 'r.authorRole'])
        .where('r.orderId IN (:...orderIds)', { orderIds })
        .getMany();

      // Build a Set of "orderId:authorRole" for fast lookup
      const reviewedSet = new Set(
        existingReviews.map((r) => `${r.orderId}:${r.authorRole}`),
      );

      let clientReminders = 0;
      let medicReminders = 0;

      for (const order of doneOrders) {
        // --- Client reminder ---
        if (!reviewedSet.has(`${order.id}:client`)) {
          try {
            const pushToken = await this.usersService.getPushToken(order.clientId);
            if (pushToken) {
              await this.pushService.send([pushToken], {
                title: 'Oцените медика',
                body: 'Расскажите о качестве обслуживания!',
                sound: 'default',
                data: { orderId: order.id, action: 'review' },
                channelId: 'order_updates',
                priority: 'high',
              });
              clientReminders++;
            }
          } catch (err) {
            this.logger.error(`Review reminder push to client ${order.clientId} failed: ${err}`);
          }
        }

        // --- Medic reminder ---
        if (order.medicId && !reviewedSet.has(`${order.id}:medic`)) {
          try {
            const medic = await this.medicsService.findById(order.medicId);
            if (medic?.pushToken) {
              await this.pushService.send([medic.pushToken], {
                title: 'Oцените клиента',
                body: 'Оставьте отзыв о клиенте',
                sound: 'default',
                data: { orderId: order.id, action: 'review' },
                channelId: 'order_updates',
                priority: 'high',
              });
              medicReminders++;
            }
            if (medic?.telegramChatId) {
              await this.telegramService.sendMessage(
                medic.telegramChatId,
                'Оцените клиента — оставьте отзыв о последнем заказе в приложении HamshiraGo.',
              );
            }
          } catch (err) {
            this.logger.error(`Review reminder to medic ${order.medicId} failed: ${err}`);
          }
        }
      }

      if (clientReminders || medicReminders) {
        this.logger.log(
          `Review reminders sent: ${clientReminders} to clients, ${medicReminders} to medics`,
        );
      }
    } catch (err) {
      this.logger.error(`sendReviewReminders cron failed: ${err}`);
    }
  }
}
