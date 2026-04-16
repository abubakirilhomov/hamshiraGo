import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './entities/order-status.enum';
import { ChatMessage } from '../consultations/entities/chat-message.entity';
import { OrderLocation } from './entities/order-location.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { RateOrderDto } from './dto/rate-order.dto';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { WebPushService } from '../realtime/web-push.service';
import { TelegramService } from '../common/telegram.service';
import { MedicsService } from '../medics/medics.service';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';
import { DispatchService } from './dispatch.service';
import { AppSettingsService } from '../app-settings/app-settings.service';
import { LoyaltyService } from '../loyalty/loyalty.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Medic } from '../medics/entities/medic.entity';
import { User } from '../users/entities/user.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { TelegramBotService } from '../telegram/telegram-bot.service';
import { CloudinaryService } from '../common/cloudinary.service';
import { PaymentLedgerService } from '../admin/payment-ledger.service';
import { haversineKm } from '../utils/geo';

/** Safely convert a DB value (possibly string from decimal columns) to a number.
 *  Returns `fallback` when the value is null, undefined, NaN, or not numeric. */
function safeNumber(val: unknown, fallback = 0): number {
  if (val == null) return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

const MEDIC_PUSH_MESSAGES: Partial<Record<string, { title: string; body: string }>> = {
  CANCELED: { title: '❌ Заказ отменён клиентом', body: 'Клиент отменил заказ. Вы можете принять другой.' },
  DONE:     { title: '✅ Заказ подтверждён',       body: 'Клиент подтвердил завершение услуги.' },
};

const CLIENT_PUSH_MESSAGES: Partial<Record<string, { title: string; body: string }>> = {
  ASSIGNED:        { title: '👤 Медик назначен',      body: 'Медик принял ваш заказ и скоро выедет' },
  ACCEPTED:        { title: '✅ Медик подтвердил',     body: 'Медик подтвердил выезд к вам' },
  ON_THE_WAY:      { title: '🚗 Медик едет',           body: 'Медик едет к вам' },
  ARRIVED:         { title: '📍 Медик прибыл!',        body: 'Откройте дверь — медик у вашего дома' },
  SERVICE_STARTED: { title: '💉 Услуга начата',        body: 'Медик начал оказание услуги' },
  DONE:            { title: '✅ Заказ выполнен',       body: 'Спасибо, что выбрали HamshiraGo!' },
  CANCELED:        { title: '❌ Заказ отменён',        body: 'Ваш заказ был отменён' },
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderLocation)
    private locationRepo: Repository<OrderLocation>,
    @InjectRepository(Referral)
    private referralRepo: Repository<Referral>,
    @InjectRepository(ChatMessage)
    private chatMessageRepo: Repository<ChatMessage>,
    private orderEventsGateway: OrderEventsGateway,
    private pushService: PushNotificationsService,
    private webPushService: WebPushService,
    private telegramService: TelegramService,
    private medicsService: MedicsService,
    private usersService: UsersService,
    private servicesService: ServicesService,
    private dispatchService: DispatchService,
    private appSettingsService: AppSettingsService,
    private loyaltyService: LoyaltyService,
    private subscriptionsService: SubscriptionsService,
    @Inject(forwardRef(() => TelegramBotService))
    private telegramBotService: TelegramBotService,
    private dataSource: DataSource,
    private cloudinaryService: CloudinaryService,
    private paymentLedgerService: PaymentLedgerService,
  ) {}

  private isMissingColumnError(err: unknown): boolean {
    return err instanceof Error && /column .* does not exist/i.test(err.message);
  }

  private mapLegacyOrderRow(
    row: Record<string, unknown>,
    withMedic: boolean,
  ): Order {
    return {
      id: String(row['o_id']),
      clientId: String(row['o_clientId']),
      medicId: row['o_medicId'] ? String(row['o_medicId']) : null,
      serviceId: row['o_serviceId'] ? String(row['o_serviceId']) : null,
      serviceTitle: row['o_serviceTitle'] ? String(row['o_serviceTitle']) : null,
      priceAmount: row['o_priceAmount'] == null ? null : Number(row['o_priceAmount']),
      discountAmount: row['o_discountAmount'] == null ? 0 : Number(row['o_discountAmount']),
      platformFee: row['o_platformFee'] == null ? 0 : Number(row['o_platformFee']),
      status: String(row['o_status']) as OrderStatus,
      // Legacy fallback for deployments where newer columns may not exist yet.
      dispatchStatus: null,
      cancelReason: null,
      isUrgent: false,
      urgentFee: 0,
      clientRating: null,
      clientReview: null,
      created_at: new Date(String(row['o_created_at'])),
      updated_at: new Date(String(row['o_updated_at'])),
      location: {
        id: String(row['l_id']),
        orderId: String(row['l_orderId']),
        latitude: safeNumber(row['l_latitude'], 0),
        longitude: safeNumber(row['l_longitude'], 0),
        house: row['l_house'] ? String(row['l_house']) : '',
        floor: row['l_floor'] == null ? null : String(row['l_floor']),
        apartment: row['l_apartment'] == null ? null : String(row['l_apartment']),
        phone: row['l_phone'] ? String(row['l_phone']) : '',
      } as OrderLocation,
      medic: withMedic && row['m_id']
        ? ({
            id: String(row['m_id']),
            name: row['m_name'] == null ? null : String(row['m_name']),
            phone: row['m_phone'] == null ? '' : String(row['m_phone']),
            rating: row['m_rating'] == null ? null : Number(row['m_rating']),
            reviewCount: row['m_reviewCount'] == null ? 0 : Number(row['m_reviewCount']),
            latitude: row['m_latitude'] == null ? null : safeNumber(row['m_latitude'], 0),
            longitude: row['m_longitude'] == null ? null : safeNumber(row['m_longitude'], 0),
          } as Medic)
        : null,
    } as Order;
  }

  private async findOneLegacy(id: string, withMedic: boolean): Promise<Order | null> {
    const qb = this.orderRepo
      .createQueryBuilder('o')
      .leftJoin(OrderLocation, 'l', 'l.orderId = o.id')
      .where('o.id = :id', { id })
      .select([
        'o.id AS o_id',
        'o.clientId AS o_clientId',
        'o.medicId AS o_medicId',
        'o.serviceId AS o_serviceId',
        'o.serviceTitle AS o_serviceTitle',
        'o.priceAmount AS o_priceAmount',
        'o.discountAmount AS o_discountAmount',
        'o.platformFee AS o_platformFee',
        'o.status AS o_status',
        'o.created_at AS o_created_at',
        'o.updated_at AS o_updated_at',
        'l.id AS l_id',
        'l.orderId AS l_orderId',
        'l.latitude AS l_latitude',
        'l.longitude AS l_longitude',
        'l.house AS l_house',
        'l.floor AS l_floor',
        'l.apartment AS l_apartment',
        'l.phone AS l_phone',
      ]);

    if (withMedic) {
      qb.leftJoin(Medic, 'm', 'm.id = o.medicId').addSelect([
        'm.id AS m_id',
        'm.name AS m_name',
        'm.phone AS m_phone',
        'm.rating AS m_rating',
        'm.reviewCount AS m_reviewCount',
        'm.latitude AS m_latitude',
        'm.longitude AS m_longitude',
      ]);
    }

    const row = await qb.getRawOne<Record<string, unknown>>();
    return row ? this.mapLegacyOrderRow(row, withMedic) : null;
  }

  /** Retry a notification function once after 2 seconds on failure */
  private async notifyWithRetry(fn: () => Promise<void>): Promise<void> {
    try {
      await fn();
    } catch {
      // Retry once after 2s
      setTimeout(async () => {
        try { await fn(); } catch (e) { this.logger.error('Push retry failed:', e); }
      }, 2000);
    }
  }

  /** Send Expo + Web Push notifications to the client of a given order */
  private async notifyClient(order: Order, status: string): Promise<void> {
    const msg = CLIENT_PUSH_MESSAGES[status];
    if (!msg || !order.clientId) return;

    // Expo push (mobile app)
    const expoToken = await this.usersService.getPushToken(order.clientId);
    if (expoToken) {
      await this.pushService.send([expoToken], {
        title: msg.title,
        body: msg.body,
        sound: 'default',
        data: { orderId: order.id, status },
        channelId: 'order_updates',
        priority: 'high',
      });
    }

    // Web push (browser)
    await this.webPushService.sendToSubscriber('client', order.clientId, {
      title: msg.title,
      body: msg.body,
      data: { orderId: order.id, status },
      url: `/orders/${order.id}`,
    });

    // Telegram notification
    this.telegramBotService
      .notifyClientStatus(order.clientId, order.id, status, order.serviceTitle ?? undefined)
      .catch(() => {});
  }

  /** Send Expo push notification to the medic of a given order */
  private async notifyMedic(order: Order, status: string): Promise<void> {
    const msg = MEDIC_PUSH_MESSAGES[status];
    if (!msg || !order.medicId) return;
    const medic = await this.medicsService.findById(order.medicId);
    if (!medic?.pushToken) return;
    this.pushService.send([medic.pushToken], {
      title: msg.title,
      body: msg.body,
      sound: 'default',
      data: { orderId: order.id, status },
      channelId: 'order_updates',
      priority: 'high',
    }).catch((err) => this.logger.error('Push failed:', err));
  }

  async create(clientId: string, dto: CreateOrderDto): Promise<Order> {
    // ── Fetch & validate service from catalog ────────────────────────────────
    const service = await this.servicesService.getActiveServiceOrThrow(dto.serviceId);

    // ── Multi-service support ───────────────────────────────────────────────
    let totalServicePrice = service.price;
    const allTitles = [service.title];
    const allIds = [service.id];

    if (dto.serviceIds?.length) {
      const extraIds = dto.serviceIds.filter((sid) => sid !== dto.serviceId);
      if (extraIds.length) {
        const extras = await this.servicesService.getActiveServicesByIds(extraIds);
        for (const extra of extras) {
          totalServicePrice += extra.price;
          allTitles.push(extra.title);
          allIds.push(extra.id);
        }
      }
    }

    // Apply pending referral discount (auto-added, bypasses 20% cap)
    const clientUser = await this.usersService.findById(clientId);
    const referralBonus = clientUser?.pendingReferralDiscount ?? 0;

    const discountAmount = (dto.discountAmount ?? 0) + referralBonus;
    if (discountAmount > totalServicePrice) {
      throw new BadRequestException('DISCOUNT_EXCEEDS_PRICE');
    }
    // TODO: replace this first-order check with a real promo-code/coupon system
    // For now: only first-time clients (0 DONE orders) may use a discount, capped at 15% of price.
    const clientDiscount = dto.discountAmount ?? 0;
    if (clientDiscount > 0) {
      const doneCount = await this.orderRepo.count({
        where: { clientId, status: OrderStatus.DONE },
      });
      if (doneCount > 0) {
        throw new BadRequestException(
          'FIRST_ORDER_DISCOUNT_ONLY',
        );
      }
      const FIRST_ORDER_DISCOUNT_PERCENT = 15;
      const maxDiscount = Math.round(totalServicePrice * FIRST_ORDER_DISCOUNT_PERCENT / 100);
      if (clientDiscount > maxDiscount) {
        throw new BadRequestException(
          'FIRST_ORDER_DISCOUNT_LIMIT',
        );
      }
    }

    // Zero out pending referral discount after applying it
    if (referralBonus > 0) {
      await this.usersService.setPendingReferralDiscount(clientId, 0);
    }

    const appSettings = await this.appSettingsService.get();
    const commissionRate = appSettings.commissionRate ?? 10;

    // Determine if order is urgent: explicit flag OR current hour is in the night window
    const nowHour = new Date().getUTCHours() + 5; // Tashkent UTC+5 (simplified, no DST)
    const normalizedHour = ((nowHour % 24) + 24) % 24;
    const urgentStartHour = appSettings.urgentStartHour ?? 22;
    const urgentEndHour = appSettings.urgentEndHour ?? 7;
    const urgentFeePercent = appSettings.urgentFeePercent ?? 50;
    const isNightHour =
      urgentStartHour > urgentEndHour
        ? normalizedHour >= urgentStartHour || normalizedHour < urgentEndHour // wraps midnight
        : normalizedHour >= urgentStartHour && normalizedHour < urgentEndHour;
    const isUrgent = dto.isUrgent === true || isNightHour;
    const urgentFee = isUrgent ? Math.round(totalServicePrice * urgentFeePercent / 100) : 0;

    // Apply subscription discount (if user has an active subscription with remaining orders)
    let subDiscount = { discountPercent: 0, subscriptionId: null as string | null };
    try {
      subDiscount = await this.subscriptionsService.getSubscriptionDiscount(clientId);
    } catch (err) {
      this.logger.warn(`Subscription discount check failed: ${err}`);
    }
    let totalDiscount = discountAmount;
    if (subDiscount.discountPercent > 0) {
      const subDiscountAmount = Math.round(totalServicePrice * subDiscount.discountPercent / 100);
      totalDiscount += subDiscountAmount;
    }
    // Cap total discount at total service price + urgentFee
    if (totalDiscount > totalServicePrice + urgentFee) {
      totalDiscount = totalServicePrice + urgentFee;
    }

    const netPrice = totalServicePrice + urgentFee - totalDiscount;
    const platformFee = Math.round(netPrice * commissionRate / 100);

    const saved = await this.dataSource.transaction(async (manager) => {
      const savedOrder = await manager.save(Order, manager.create(Order, {
        clientId,
        serviceId: service.id,
        serviceTitle: service.title,
        serviceIds: allIds.length > 1 ? allIds : null,
        serviceTitles: allTitles.length > 1 ? allTitles : null,
        priceAmount: totalServicePrice,
        discountAmount: totalDiscount,
        isUrgent,
        urgentFee,
        platformFee,
        status: OrderStatus.CREATED,
      }));
      await manager.save(OrderLocation, manager.create(OrderLocation, {
        orderId: savedOrder.id,
        latitude: dto.location.latitude,
        longitude: dto.location.longitude,
        house: dto.location.house,
        floor: dto.location.floor ?? null,
        apartment: dto.location.apartment ?? null,
        phone: dto.location.phone,
      }));
      return savedOrder;
    });
    const fullOrder = await this.findOne(saved.id);

    // Increment subscription usage after successful order creation
    if (subDiscount.subscriptionId) {
      this.subscriptionsService.incrementOrdersUsed(subDiscount.subscriptionId).catch((err) => {
        this.logger.error(`Failed to increment subscription usage: ${err}`);
      });
    }

    // Start automatic dispatch (Yandex-taxi-style push-based assignment)
    this.dispatchService.startDispatch(saved.id).catch((err) => {
      this.logger.error(`startDispatch failed for order ${saved.id}: ${err}`);
    });

    return fullOrder;
  }

  async findOne(id: string): Promise<Order> {
    let order: Order | null = null;
    try {
      order = await this.orderRepo.findOne({
        where: { id },
        relations: { location: true, medic: true },
      });
    } catch (err) {
      if (!this.isMissingColumnError(err)) throw err;
      order = await this.findOneLegacy(id, true);
    }
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
    return order;
  }

  /** Internal use only — no medic JOIN (status checks, dispatch, post-update fetches) */
  async findOneBasic(id: string): Promise<Order> {
    let order: Order | null = null;
    try {
      order = await this.orderRepo.findOne({
        where: { id },
        relations: { location: true },
      });
    } catch (err) {
      if (!this.isMissingColumnError(err)) throw err;
      order = await this.findOneLegacy(id, false);
    }
    if (!order) throw new NotFoundException('ORDER_NOT_FOUND');
    return order;
  }

  async findOneForActor(
    id: string,
    actorId: string,
    role: 'client' | 'medic' | 'admin',
  ): Promise<Order> {
    const order = await this.findOne(id);
    if (role === 'admin') return order;
    if (role === 'client' && order.clientId === actorId) return order;
    if (role === 'medic' && order.medicId === actorId) return order;
    throw new ForbiddenException('NO_ORDER_ACCESS');
  }

  /** Client cancels their own order — only allowed while CREATED or ASSIGNED */
  async cancelOrder(orderId: string, clientId: string, reason?: string): Promise<Order> {
    const order = await this.findOneBasic(orderId);
    if (order.clientId !== clientId) throw new ForbiddenException('NOT_YOUR_ORDER');
    const cancellable: OrderStatus[] = [OrderStatus.CREATED, OrderStatus.ASSIGNED];
    // Atomic UPDATE with WHERE status IN (cancellable) prevents race condition:
    // if a medic transitions the order to SERVICE_STARTED between the read above
    // and the update below, the UPDATE will affect 0 rows and we throw ConflictException.
    const cancelReason = reason ?? 'Отменено клиентом';
    const cancelResult = await this.orderRepo.update(
      { id: orderId, clientId, status: In(cancellable) },
      { status: OrderStatus.CANCELED, cancelReason },
    );
    if (!cancelResult.affected) {
      // Re-fetch to give the client an accurate error message
      const fresh = await this.findOneBasic(orderId);
      if (fresh.clientId !== clientId) throw new ForbiddenException('NOT_YOUR_ORDER');
      throw new ConflictException(
        'CANNOT_CANCEL_ORDER_STATUS',
      );
    }
    // Cancel any active dispatch search
    this.dispatchService.cancelDispatch(orderId).catch(() => {});

    // Refund platform fee to medic if order was accepted (commission was deducted)
    if (order.medicId && order.platformFee && order.platformFee > 0) {
      this.dataSource
        .createQueryBuilder()
        .update(Medic)
        .set({ balance: () => `balance + ${Number(order.platformFee)}` })
        .where('id = :id', { id: order.medicId })
        .execute()
        .catch((err) => this.logger.error(`Failed to refund medic commission: ${err.message}`));
    }

    this.orderEventsGateway.emitOrderStatus(orderId, OrderStatus.CANCELED);
    const updated = await this.findOne(orderId);
    this.notifyWithRetry(() => this.notifyClient(updated, OrderStatus.CANCELED)).catch((err) => this.logger.warn(`Notify error: ${err}`));
    // Notify medic with cancellation reason
    if (updated.medicId) {
      const medic = await this.medicsService.findById(updated.medicId);
      if (medic?.pushToken) {
        this.pushService.send([medic.pushToken], {
          title: '❌ Заказ отменён клиентом',
          body: cancelReason,
          sound: 'default',
          data: { orderId: updated.id, status: OrderStatus.CANCELED },
          channelId: 'order_updates',
          priority: 'high',
        }).catch((err) => this.logger.error('Push failed:', err));
      }
    }
    return updated;
  }

  /** Reorder — create a new order from a previous one (same service + location) */
  async reorder(orderId: string, clientId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.clientId !== clientId) throw new ForbiddenException('NOT_YOUR_ORDER');
    if (!order.serviceId) throw new BadRequestException('ORDER_NO_SERVICE');
    if (!order.location) throw new BadRequestException('ORDER_NO_LOCATION');

    return this.create(clientId, {
      serviceId: order.serviceId,
      location: {
        latitude: Number(order.location.latitude),
        longitude: Number(order.location.longitude),
        house: order.location.house,
        floor: order.location.floor ?? undefined,
        apartment: order.location.apartment ?? undefined,
        phone: order.location.phone,
      },
    });
  }

  /** Client rates the medic after order is DONE */
  async rateOrder(orderId: string, clientId: string, dto: RateOrderDto): Promise<Order> {
    const order = await this.findOneBasic(orderId);
    if (order.clientId !== clientId) throw new ForbiddenException('NOT_YOUR_ORDER');
    if (order.status !== OrderStatus.DONE) throw new BadRequestException('RATE_ORDER_NOT_COMPLETED');
    if (!order.medicId) throw new BadRequestException('ORDER_NO_MEDIC');

    // Fetch medic before transaction so we can calculate new rating
    const medic = await this.medicsService.findById(order.medicId);

    // Wrap both the order rating update and medic rating recalculation in a single
    // transaction so a crash between the two steps cannot leave them inconsistent.
    await this.dataSource.transaction(async (manager) => {
      // Atomic: only saves if rating is still NULL (prevents concurrent double-rating)
      const rateResult = await manager.update(
        Order,
        { id: orderId, clientRating: IsNull() },
        { clientRating: dto.rating, clientReview: dto.review ?? null },
      );
      if (!rateResult.affected) throw new BadRequestException('ORDER_ALREADY_RATED');

      // Recalculate medic's weighted average rating inline (mirrors medicsService.updateRating)
      if (medic) {
        const currentCount = medic.reviewCount ?? 0;
        const currentRating = Number(medic.rating ?? 0);
        const newCount = currentCount + 1;
        const newRating = Number(((currentRating * currentCount + dto.rating) / newCount).toFixed(2));
        await manager.update(Medic, { id: order.medicId }, { rating: newRating, reviewCount: newCount });
      }
    });

    return this.findOne(orderId);
  }

  async updateStatusByClient(
    id: string,
    clientId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOneBasic(id);
    if (order.clientId !== clientId) {
      throw new ForbiddenException('NOT_YOUR_ORDER');
    }
    // Client can only confirm completion once medic started service.
    if (dto.status !== OrderStatus.DONE || order.status !== OrderStatus.SERVICE_STARTED) {
      throw new BadRequestException(
        'ORDER_INVALID_TRANSITION',
      );
    }
    const netPrice = safeNumber(order.priceAmount) + safeNumber(order.urgentFee) - safeNumber(order.discountAmount);
    const earnings = netPrice - safeNumber(order.platformFee);
    // Credit earnings (netPrice minus platformFee) — commission already deducted at accept-time
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        Order,
        { id, clientId, status: OrderStatus.SERVICE_STARTED },
        { status: OrderStatus.DONE },
      );
      if (!result.affected) {
        throw new BadRequestException('ORDER_STATUS_CHANGED_RETRY');
      }
      if (order.medicId) {
        await manager.increment(Medic, { id: order.medicId }, 'earnings', earnings);
        await manager.increment(Medic, { id: order.medicId }, 'balance', earnings);
      }
    });
    this.orderEventsGateway.emitOrderStatus(id, OrderStatus.DONE);
    const doneOrder = await this.findOne(id);
    this.notifyWithRetry(() => this.notifyClient(doneOrder, OrderStatus.DONE)).catch((err) => this.logger.warn(`Notify error: ${err}`));
    this.notifyWithRetry(() => this.notifyMedic(doneOrder, OrderStatus.DONE)).catch((err) => this.logger.warn(`Notify error: ${err}`));

    // Referral bonus: check if this is the referred user's first DONE order
    this.applyReferralBonusIfEligible(clientId).catch((err) =>
      this.logger.error('Referral bonus error:', err),
    );

    // Award loyalty points
    this.loyaltyService.awardPoints(clientId, id, netPrice).catch((err) =>
      this.logger.error('Loyalty award failed:', err),
    );

    // Record in payment ledger (same as medic path)
    if (order.medicId) {
      this.paymentLedgerService
        .record({
          orderId: order.id,
          medicId: order.medicId,
          amount: earnings,
          type: 'EARNING',
          description: `Order ${order.id.slice(0, 8)} — ${order.serviceTitle ?? 'service'}`,
        })
        .catch((err) => this.logger.warn('Ledger EARNING record failed', err));
      this.paymentLedgerService
        .record({
          orderId: order.id,
          amount: safeNumber(order.platformFee),
          type: 'COMMISSION',
          description: `Commission for order ${order.id.slice(0, 8)}`,
        })
        .catch((err) => this.logger.warn('Ledger COMMISSION record failed', err));
    }

    return doneOrder;
  }

  /** Award 10 000 UZS discount to both referrer and referee on referee's first DONE order.
   *  Uses a transaction with pessimistic_write lock on the user row to prevent
   *  double-award when two concurrent DONE transitions race. */
  private async applyReferralBonusIfEligible(clientId: string): Promise<void> {
    const BONUS = 10_000; // 10 000 UZS

    await this.dataSource.transaction(async (manager) => {
      // Lock the user row to serialize concurrent calls for the same client
      const user = await manager
        .createQueryBuilder(User, 'u')
        .setLock('pessimistic_write')
        .where('u.id = :id', { id: clientId })
        .getOne();

      if (!user || user.referralBonusUsed || !user.referredBy) return;

      // Check this is truly the first DONE order
      const doneCount = await manager.count(Order, {
        where: { clientId, status: OrderStatus.DONE },
      });
      if (doneCount !== 1) return; // not the first DONE order

      // Mark bonus used on the referred user (within the same transaction)
      await manager.update(User, clientId, {
        referralBonusUsed: true,
        pendingReferralDiscount: BONUS,
      });

      // Find the referral record to get referrer ID and mark it paid
      const referral = await manager.findOne(Referral, {
        where: { referredId: clientId, bonusPaid: false },
      });
      if (referral) {
        await manager.update(Referral, referral.id, { bonusPaid: true, bonusAmount: BONUS });
        // Award bonus to referrer as well (increment, don't overwrite)
        await manager
          .createQueryBuilder()
          .update(User)
          .set({ pendingReferralDiscount: () => `"pendingReferralDiscount" + ${BONUS}` })
          .where('id = :id', { id: referral.referrerId })
          .execute();
      }
    });
  }

  async findByClient(
    clientId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Order[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    let data: Order[] = [];
    let total = 0;
    try {
      [data, total] = await this.orderRepo.findAndCount({
        where: { clientId },
        relations: { location: true, medic: true },
        order: { created_at: 'DESC' },
        take,
        skip,
      });
    } catch (err) {
      if (!this.isMissingColumnError(err)) throw err;
      const qb = this.orderRepo
        .createQueryBuilder('o')
        .leftJoin(OrderLocation, 'l', 'l.orderId = o.id')
        .leftJoin(Medic, 'm', 'm.id = o.medicId')
        .where('o.clientId = :clientId', { clientId })
        .orderBy('o.created_at', 'DESC')
        .take(take)
        .skip(skip)
        .select([
          'o.id AS o_id',
          'o.clientId AS o_clientId',
          'o.medicId AS o_medicId',
          'o.serviceId AS o_serviceId',
          'o.serviceTitle AS o_serviceTitle',
          'o.priceAmount AS o_priceAmount',
          'o.discountAmount AS o_discountAmount',
          'o.platformFee AS o_platformFee',
          'o.status AS o_status',
          'o.created_at AS o_created_at',
          'o.updated_at AS o_updated_at',
          'l.id AS l_id',
          'l.orderId AS l_orderId',
          'l.latitude AS l_latitude',
          'l.longitude AS l_longitude',
          'l.house AS l_house',
          'l.floor AS l_floor',
          'l.apartment AS l_apartment',
          'l.phone AS l_phone',
          'm.id AS m_id',
          'm.name AS m_name',
          'm.phone AS m_phone',
          'm.rating AS m_rating',
          'm.reviewCount AS m_reviewCount',
          'm.latitude AS m_latitude',
          'm.longitude AS m_longitude',
        ]);
      const rows = await qb.getRawMany<Record<string, unknown>>();
      data = rows.map((row) => this.mapLegacyOrderRow(row, true));
      total = await this.orderRepo
        .createQueryBuilder('o')
        .where('o.clientId = :clientId', { clientId })
        .getCount();
    }
    return { data, total, page, totalPages: Math.ceil(total / take) };
  }

  // ── Medic-facing ──────────────────────────────────────────────────────────

  /** All CREATED orders available for medics to pick up */
  /**
   * Returns CREATED orders visible to the medic.
   * If the medic has a known location, only orders within MAX_DISPATCH_KM are returned,
   * sorted by distance (nearest first). If the medic has no location, all orders are shown.
   */
  async findAvailable(medicId: string): Promise<Order[]> {
    const medic = await this.medicsService.findById(medicId);
    if (!medic || medic.verificationStatus !== 'APPROVED' || medic.isBlocked) {
      return [];
    }

    const orders = await this.orderRepo.find({
      where: { status: OrderStatus.CREATED },
      relations: { location: true },
      order: { created_at: 'ASC' },
      take: 50,
    });

    if (medic.latitude == null || medic.longitude == null) {
      // No location data — return all orders (fallback)
      return orders;
    }

    const MAX_KM = 10;
    const medicLat = safeNumber(medic.latitude, NaN);
    const medicLon = safeNumber(medic.longitude, NaN);
    if (!Number.isFinite(medicLat) || !Number.isFinite(medicLon)) {
      // Corrupted medic location — return all orders as fallback
      return orders;
    }

    const withDistance = orders
      .filter((o) => {
        if (o.location?.latitude == null || o.location?.longitude == null) return false;
        const lat = safeNumber(o.location.latitude, NaN);
        const lng = safeNumber(o.location.longitude, NaN);
        return Number.isFinite(lat) && Number.isFinite(lng);
      })
      .map((o) => ({
        order: o,
        distanceKm: haversineKm(
          medicLat, medicLon,
          safeNumber(o.location!.latitude),
          safeNumber(o.location!.longitude),
        ),
      }))
      .filter(({ distanceKm }) => distanceKm <= MAX_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance.map(({ order }) => order);
  }

  /** Medic accepts a CREATED order → status becomes ACCEPTED (skips ASSIGNED) */
  async acceptOrder(orderId: string, medicId: string): Promise<Order> {
    const medic = await this.medicsService.findById(medicId);
    if (!medic) throw new ForbiddenException('MEDIC_NOT_FOUND');
    if (medic.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'MEDIC_NOT_VERIFIED',
      );
    }
    if (medic.isBlocked) throw new ForbiddenException('ACCOUNT_BLOCKED');
    if (!medic.profilePhotoUrl) {
      throw new ForbiddenException('PROFILE_PHOTO_REQUIRED');
    }

    const order = await this.findOneBasic(orderId);

    // Geofence check: if medic has a work zone, verify order is within it
    const zoneRadius = medic.workZoneRadius != null ? Number(medic.workZoneRadius) : null;
    if (zoneRadius !== null && order.location) {
      const orderLat = Number(order.location.latitude);
      const orderLng = Number(order.location.longitude);
      if (Number.isFinite(orderLat) && Number.isFinite(orderLng)) {
        const zoneLat = Number(medic.workZoneLat!);
        const zoneLng = Number(medic.workZoneLng!);
        const dist = haversineKm(zoneLat, zoneLng, orderLat, orderLng);
        if (dist > zoneRadius) {
          throw new BadRequestException(
            'MEDIC_ORDER_OUTSIDE_ZONE',
          );
        }
      }
    }

    // Validate dispatch invite first (before touching any money or order state)
    await this.dispatchService.onMedicAccept(orderId, medicId);

    const paidMode = await this.appSettingsService.isPaidMode();
    const commissionRate = paidMode ? await this.appSettingsService.getCommissionRate() : 0;

    // ── Transaction: assign order first, then deduct commission ─────────────
    // Order update happens first (WHERE status=CREATED) — if two medics race,
    // only one succeeds. If balance is insufficient, the whole transaction rolls
    // back and the order reverts to CREATED automatically.
    await this.dataSource.transaction(async (manager) => {
      const result = await manager.update(
        Order,
        { id: orderId, status: OrderStatus.CREATED },
        { medicId, status: OrderStatus.ACCEPTED },
      );
      if (!result.affected) {
        throw new BadRequestException('ORDER_NOT_AVAILABLE');
      }

      if (paidMode) {
        const netPrice = safeNumber(order.priceAmount) + safeNumber(order.urgentFee) - safeNumber(order.discountAmount);
        const fee = Math.round(netPrice * commissionRate / 100);
        const deductResult = await manager
          .createQueryBuilder()
          .update(Medic)
          .set({ balance: () => 'balance - :fee' })
          .setParameter('fee', fee)
          .where('id = :id', { id: medicId })
          .andWhere('balance >= :fee', { fee })
          .execute();
        if (!deductResult.affected) {
          const fresh = await this.medicsService.findById(medicId);
          const err: any = new ForbiddenException('Insufficient wallet balance');
          err.code = 'INSUFFICIENT_WALLET';
          err.required = fee;
          err.current = fresh?.balance ?? 0;
          throw err;
        }
      }
    });

    this.orderEventsGateway.emitOrderStatus(orderId, OrderStatus.ACCEPTED);
    const updated = await this.findOne(orderId);
    this.notifyWithRetry(() => this.notifyClient(updated, OrderStatus.ACCEPTED)).catch((err) => this.logger.warn(`Notify error: ${err}`));
    return updated;
  }

  /** Medic declines a dispatch invite → dispatch advances to next medic */
  async declineOrder(orderId: string, medicId: string): Promise<void> {
    await this.dispatchService.onMedicDecline(orderId, medicId);
  }

  /** Medic updates status of their own order */
  async updateStatusByMedic(
    orderId: string,
    medicId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.findOneBasic(orderId);
    if (order.medicId !== medicId) throw new ForbiddenException('ORDER_NOT_ASSIGNED_TO_YOU');

    const allowedTransitions: Partial<Record<OrderStatus, OrderStatus[]>> = {
      [OrderStatus.ASSIGNED]:        [OrderStatus.ACCEPTED, OrderStatus.CANCELED],
      [OrderStatus.ACCEPTED]:        [OrderStatus.ON_THE_WAY],
      [OrderStatus.ON_THE_WAY]:      [OrderStatus.ARRIVED],
      [OrderStatus.ARRIVED]:         [OrderStatus.SERVICE_STARTED],
      [OrderStatus.SERVICE_STARTED]: [OrderStatus.DONE],
    };
    const allowed = allowedTransitions[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        'ORDER_INVALID_STATUS_TRANSITION',
      );
    }

    const currentStatus = order.status;

    // DONE: status update + earnings credit in a single transaction
    if (status === OrderStatus.DONE) {
      const netPrice = safeNumber(order.priceAmount) + safeNumber(order.urgentFee) - safeNumber(order.discountAmount);
      const earnings = netPrice - safeNumber(order.platformFee);
      // Credit earnings (netPrice minus platformFee) — commission already deducted at accept
      await this.dataSource.transaction(async (manager) => {
        const result = await manager.update(
          Order,
          { id: orderId, medicId, status: currentStatus },
          { status: OrderStatus.DONE },
        );
        if (!result.affected) {
          throw new BadRequestException('ORDER_STATUS_CHANGED_RETRY');
        }
        await manager.increment(Medic, { id: medicId }, 'earnings', earnings);
        await manager.increment(Medic, { id: medicId }, 'balance', earnings);
      });

      // Record in payment ledger (fire-and-forget)
      this.paymentLedgerService
        .record({
          orderId: order.id,
          medicId: order.medicId ?? undefined,
          amount: earnings,
          type: 'EARNING',
          description: `Order ${order.id.slice(0, 8)} — ${order.serviceTitle ?? 'service'}`,
        })
        .catch((err) => this.logger.warn('Ledger EARNING record failed', err));

      this.paymentLedgerService
        .record({
          orderId: order.id,
          amount: safeNumber(order.platformFee),
          type: 'COMMISSION',
          description: `Commission for order ${order.id.slice(0, 8)}`,
        })
        .catch((err) => this.logger.warn('Ledger COMMISSION record failed', err));

      // Referral bonus + loyalty (same as client DONE path)
      this.applyReferralBonusIfEligible(order.clientId).catch((err) =>
        this.logger.error('Referral bonus error:', err),
      );
      this.loyaltyService.awardPoints(order.clientId, orderId, netPrice).catch((err) =>
        this.logger.error('Loyalty award failed:', err),
      );
    } else {
      // Atomic: only succeeds if status hasn't changed since we read it
      const result = await this.orderRepo.update(
        { id: orderId, medicId, status: currentStatus },
        { status },
      );
      if (!result.affected) {
        throw new BadRequestException('ORDER_STATUS_CHANGED_RETRY');
      }
    }

    this.orderEventsGateway.emitOrderStatus(orderId, status, medicId);
    const updated = await this.findOne(orderId);
    this.notifyWithRetry(() => this.notifyClient(updated, status)).catch((err) => this.logger.warn(`Notify error: ${err}`));
    return updated;
  }

  /** Upload a before/after photo for an order (medic only) */
  async uploadOrderPhoto(
    orderId: string,
    medicId: string,
    file: Express.Multer.File,
    type: 'before' | 'after',
  ): Promise<{ url: string }> {
    const order = await this.findOneBasic(orderId);
    if (order.medicId !== medicId) throw new ForbiddenException('NOT_YOUR_ORDER');

    // Validate order is in a status where photos make sense
    const allowedStatuses = [
      OrderStatus.ARRIVED,
      OrderStatus.SERVICE_STARTED,
      OrderStatus.DONE,
    ];
    if (!allowedStatuses.includes(order.status)) {
      throw new BadRequestException('ORDER_STATUS_DOES_NOT_ALLOW_PHOTO');
    }

    const url = await this.cloudinaryService.uploadBuffer(
      file.buffer,
      'hamshirago/order-photos',
      `${type}-${orderId}`,
    );

    if (type === 'before') {
      await this.orderRepo.update(orderId, { beforePhotoUrl: url });
    } else {
      await this.orderRepo.update(orderId, { afterPhotoUrl: url });
    }

    return { url };
  }

  /** All orders assigned to a medic */
  async findByMedic(
    medicId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Order[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    let data: Order[] = [];
    let total = 0;
    try {
      [data, total] = await this.orderRepo.findAndCount({
        where: { medicId },
        relations: { location: true },
        order: { created_at: 'DESC' },
        take,
        skip,
      });
    } catch (err) {
      if (!this.isMissingColumnError(err)) throw err;
      const qb = this.orderRepo
        .createQueryBuilder('o')
        .leftJoin(OrderLocation, 'l', 'l.orderId = o.id')
        .where('o.medicId = :medicId', { medicId })
        .orderBy('o.created_at', 'DESC')
        .take(take)
        .skip(skip)
        .select([
          'o.id AS o_id',
          'o.clientId AS o_clientId',
          'o.medicId AS o_medicId',
          'o.serviceId AS o_serviceId',
          'o.serviceTitle AS o_serviceTitle',
          'o.priceAmount AS o_priceAmount',
          'o.discountAmount AS o_discountAmount',
          'o.platformFee AS o_platformFee',
          'o.status AS o_status',
          'o.created_at AS o_created_at',
          'o.updated_at AS o_updated_at',
          'l.id AS l_id',
          'l.orderId AS l_orderId',
          'l.latitude AS l_latitude',
          'l.longitude AS l_longitude',
          'l.house AS l_house',
          'l.floor AS l_floor',
          'l.apartment AS l_apartment',
          'l.phone AS l_phone',
        ]);
      const rows = await qb.getRawMany<Record<string, unknown>>();
      data = rows.map((row) => this.mapLegacyOrderRow(row, false));
      total = await this.orderRepo
        .createQueryBuilder('o')
        .where('o.medicId = :medicId', { medicId })
        .getCount();
    }
    return { data, total, page, totalPages: Math.ceil(total / take) };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** All orders with optional status/isUrgent filters — for admin dashboard */
  async findAllAdmin(
    page = 1,
    limit = 20,
    status?: OrderStatus,
    isUrgent?: boolean,
  ): Promise<{ data: Order[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const where: Record<string, unknown> = {};
    if (status) where['status'] = status;
    if (isUrgent !== undefined) where['isUrgent'] = isUrgent;
    const [data, total] = await this.orderRepo.findAndCount({
      where,
      relations: { location: true },
      order: { created_at: 'DESC' },
      take,
      skip,
    });
    return { data, total, page, totalPages: Math.ceil(total / take) };
  }

  /** Admin force-cancels any order regardless of current status */
  async adminCancelOrder(orderId: string, reason?: string): Promise<Order> {
    const cancelReason = reason ?? 'Отменено администратором';
    // Atomic update: only cancel if not already DONE or CANCELED
    const cancelResult = await this.orderRepo.update(
      { id: orderId, status: Not(In([OrderStatus.DONE, OrderStatus.CANCELED])) },
      { status: OrderStatus.CANCELED, cancelReason },
    );
    if (!cancelResult.affected) {
      throw new BadRequestException('ORDER_FINAL_OR_NOT_FOUND');
    }
    // Best-effort cancel dispatch (may have already been CREATED)
    this.dispatchService.cancelDispatch(orderId).catch(() => {});
    this.orderEventsGateway.emitOrderStatus(orderId, OrderStatus.CANCELED);
    const updated = await this.findOne(orderId);
    // Notify client with cancellation reason
    const expoToken = await this.usersService.getPushToken(updated.clientId);
    if (expoToken) {
      await this.pushService.send([expoToken], {
        title: '❌ Заказ отменён',
        body: cancelReason,
        sound: 'default',
        data: { orderId: updated.id, status: OrderStatus.CANCELED },
        channelId: 'order_updates',
        priority: 'high',
      });
    }
    await this.webPushService.sendToSubscriber('client', updated.clientId, {
      title: '❌ Заказ отменён',
      body: cancelReason,
      data: { orderId: updated.id, status: OrderStatus.CANCELED },
      url: `/orders/${updated.id}`,
    });
    return updated;
  }

  /* ------------------------------------------------------------------ */
  /*  Order Chat                                                         */
  /* ------------------------------------------------------------------ */

  /** Send a chat message in an order */
  async sendMessage(
    orderId: string,
    userId: string,
    role: 'client' | 'medic',
    content: string,
  ): Promise<ChatMessage> {
    const order = await this.findOneBasic(orderId);
    if (role === 'client' && order.clientId !== userId) {
      throw new ForbiddenException('NOT_YOUR_ORDER');
    }
    if (role === 'medic' && order.medicId !== userId) {
      throw new ForbiddenException('NOT_YOUR_ORDER');
    }
    const terminal = [OrderStatus.DONE, OrderStatus.CANCELED];
    if (terminal.includes(order.status)) {
      throw new BadRequestException('MESSAGE_COMPLETED_ORDER');
    }

    const message = this.chatMessageRepo.create({
      orderId,
      userId,
      role: role === 'client' ? 'user' : 'doctor',
      content,
    });
    const saved = await this.chatMessageRepo.save(message);

    // Emit via Socket.IO for real-time delivery
    this.orderEventsGateway.server
      .to(`order_${orderId}`)
      .emit('order_message', {
        orderId,
        message: { id: saved.id, userId, role: saved.role, content, createdAt: saved.createdAt },
      });

    return saved;
  }

  /** Get chat messages for an order */
  async getMessages(
    orderId: string,
    userId: string,
    role: string,
  ): Promise<ChatMessage[]> {
    const order = await this.findOneBasic(orderId);
    if (role === 'client' && order.clientId !== userId) {
      throw new ForbiddenException('NOT_YOUR_ORDER');
    }
    if (role === 'medic' && order.medicId !== userId) {
      throw new ForbiddenException('NOT_YOUR_ORDER');
    }

    return this.chatMessageRepo.find({
      where: { orderId },
      order: { createdAt: 'ASC' },
    });
  }

  async getClientStats(clientId: string): Promise<{ total: number; active: number; completed: number; canceled: number }> {
    const rows = await this.orderRepo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('o.clientId = :clientId', { clientId })
      .groupBy('o.status')
      .getRawMany();

    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.status] = parseInt(r.count, 10);

    const active = (counts['CREATED'] || 0) + (counts['ASSIGNED'] || 0) + (counts['ACCEPTED'] || 0) +
      (counts['ON_THE_WAY'] || 0) + (counts['ARRIVED'] || 0) + (counts['SERVICE_STARTED'] || 0);

    return {
      total: Object.values(counts).reduce((a, b) => a + b, 0),
      active,
      completed: counts['DONE'] || 0,
      canceled: counts['CANCELED'] || 0,
    };
  }

  async softDelete(orderId: string): Promise<void> {
    await this.orderRepo.softDelete(orderId);
  }
}
