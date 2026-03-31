import {
  Injectable,
  Logger,
  ForbiddenException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, MoreThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DispatchAttempt, DispatchResult } from './entities/dispatch-attempt.entity';
import { Order } from './entities/order.entity';
import { OrderStatus } from './entities/order-status.enum';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { TelegramService } from '../common/telegram.service';
import { MedicsService } from '../medics/medics.service';
import { UsersService } from '../users/users.service';
import { FavoritesService } from '../favorites/favorites.service';
import { ReviewsService } from '../reviews/reviews.service';
import { Medic } from '../medics/entities/medic.entity';
import { haversineKm } from '../utils/geo';

@Injectable()
export class DispatchService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DispatchService.name);
  private readonly DISPATCH_TIMEOUT_MS = 60_000;
  private readonly DISPATCH_RADIUS_KM = 15;
  private readonly MAX_DISPATCH_ATTEMPTS = 10;

  /** In-memory timers: orderId → timeout handle */
  private timers = new Map<string, NodeJS.Timeout>();

  constructor(
    @InjectRepository(DispatchAttempt)
    private attemptRepo: Repository<DispatchAttempt>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private gateway: OrderEventsGateway,
    private pushService: PushNotificationsService,
    private telegramService: TelegramService,
    private medicsService: MedicsService,
    private usersService: UsersService,
    private favoritesService: FavoritesService,
    private reviewsService: ReviewsService,
    private configService: ConfigService,
  ) {}

  /** On startup: recover stale PENDING attempts left from before a Railway restart */
  async onApplicationBootstrap() {
    try {
      const stale = await this.attemptRepo.find({
        where: { result: DispatchResult.PENDING, expiresAt: LessThan(new Date()) },
      });
      for (const attempt of stale) {
        this.logger.log(`Recovering stale attempt ${attempt.id} for order ${attempt.orderId}`);
        await this.attemptRepo.update(attempt.id, { result: DispatchResult.TIMEOUT });
        await this.advanceDispatch(attempt.orderId);
      }

      // Recover PENDING attempts whose expiresAt is still in the future — re-create timers
      const pending = await this.attemptRepo.find({
        where: { result: DispatchResult.PENDING, expiresAt: MoreThan(new Date()) },
      });
      for (const attempt of pending) {
        const remainingMs = attempt.expiresAt.getTime() - Date.now();
        this.logger.log(
          `Recovering pending attempt ${attempt.id} for order ${attempt.orderId}, ${remainingMs}ms remaining`,
        );
        const timer = setTimeout(async () => {
          this.timers.delete(attempt.orderId);
          await this.attemptRepo.update(attempt.id, { result: DispatchResult.TIMEOUT });
          await this.advanceDispatch(attempt.orderId);
        }, remainingMs);
        this.timers.set(attempt.orderId, timer);
      }
    } catch (err) {
      this.logger.error(`onApplicationBootstrap error: ${err}`);
    }
  }

  /** Called from OrdersService.create() — kicks off dispatch for a new order */
  async startDispatch(orderId: string): Promise<void> {
    await this.orderRepo.update(orderId, { dispatchStatus: 'SEARCHING' });
    this.gateway.emitDispatchUpdate(orderId, { status: 'searching' });
    await this.advanceDispatch(orderId);
  }

  /** Select the best available medic and invite them. Recurses on timeout/decline. */
  private async advanceDispatch(orderId: string): Promise<void> {
    // Re-check order is still CREATED
    const order = await this.orderRepo.findOne({
      where: { id: orderId, status: OrderStatus.CREATED },
      relations: { location: true },
    });
    if (!order) return; // Order was cancelled or already assigned

    // Build exclusion list from all previous attempts for this order
    const prev = await this.attemptRepo.find({
      where: { orderId },
      select: ['medicId'],
    });
    const excludedIds = prev.map((a) => a.medicId);

    // Hard cap: stop after MAX_DISPATCH_ATTEMPTS to avoid infinite loops
    if (excludedIds.length >= this.MAX_DISPATCH_ATTEMPTS) {
      await this.handleNoMedics(order, excludedIds.length);
      return;
    }

    const medic = await this.selectBestMedic(order, excludedIds, order.clientId);
    if (!medic) {
      await this.handleNoMedics(order, excludedIds.length);
      return;
    }

    // Save dispatch attempt
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.DISPATCH_TIMEOUT_MS);
    const attempt = this.attemptRepo.create({
      orderId,
      medicId: medic.id,
      expiresAt,
      result: DispatchResult.PENDING,
    });
    const savedAttempt = await this.attemptRepo.save(attempt);

    // Fetch client rating stats (non-blocking — dispatch continues even if this fails)
    let clientStats: { averageRating: number | null; reviewCount: number } = {
      averageRating: null,
      reviewCount: 0,
    };
    try {
      clientStats = await this.reviewsService.getTargetRatingStats(order.clientId, 'client');
    } catch (err) {
      this.logger.warn(`Failed to fetch client rating for order ${orderId}: ${err}`);
    }

    // Notify medic via WebSocket (dispatch_invite)
    this.gateway.emitDispatchInvite(medic.id, {
      orderId,
      order: {
        id: order.id,
        serviceTitle: order.serviceTitle,
        priceAmount: order.priceAmount,
        discountAmount: order.discountAmount,
        location: order.location,
      },
      client: {
        averageRating: clientStats.averageRating,
        reviewCount: clientStats.reviewCount,
      },
      expiresAt: expiresAt.toISOString(),
    });

    // Push to medic (for background/closed app)
    if (medic.pushToken) {
      const netPrice = (order.priceAmount ?? 0) - (order.discountAmount ?? 0);
      this.pushService
        .send([medic.pushToken], {
          title: '🚨 Новый заказ рядом с вами',
          body: `${order.serviceTitle} — ${netPrice.toLocaleString('ru-RU')} UZS`,
          sound: 'default',
          data: { orderId, type: 'dispatch_invite' },
          channelId: 'new_orders',
          priority: 'high',
        })
        .catch(() => {});
    }

    // Notify client (dispatch_update: contacting)
    this.gateway.emitDispatchUpdate(orderId, {
      status: 'contacting',
      medic: {
        name: medic.name,
        latitude: medic.latitude != null ? Number(medic.latitude) : null,
        longitude: medic.longitude != null ? Number(medic.longitude) : null,
        rating: medic.rating != null ? Number(medic.rating) : null,
        profilePhotoUrl: medic.profilePhotoUrl ?? null,
      },
    });

    // Set 60s timeout
    const timer = setTimeout(async () => {
      this.timers.delete(orderId);
      await this.attemptRepo.update(savedAttempt.id, { result: DispatchResult.TIMEOUT });
      this.gateway.emitDispatchInviteExpired(medic.id, { orderId });
      await this.advanceDispatch(orderId);
    }, this.DISPATCH_TIMEOUT_MS);

    this.timers.set(orderId, timer);
    this.logger.log(`Dispatch: invited medic ${medic.id} for order ${orderId}, expires ${expiresAt.toISOString()}`);
  }

  private async handleNoMedics(order: Order, attemptCount: number): Promise<void> {
    if (attemptCount > 0) {
      // We tried some medics but none available now — wait and alert
      await this.orderRepo.update(order.id, { dispatchStatus: 'NO_MEDICS' });
      this.gateway.emitDispatchUpdate(order.id, { status: 'no_medics' });

      const expoToken = await this.usersService.getPushToken(order.clientId);
      if (expoToken) {
        this.pushService
          .send([expoToken], {
            title: '⏳ Ищем медика',
            body: 'Медики заняты, продолжаем поиск. Вам сообщим.',
            sound: 'default',
            data: { orderId: order.id, status: 'no_medics' },
            channelId: 'order_updates',
            priority: 'high',
          })
          .catch(() => {});
      }
      this.notifyAdmin(`⚠️ Нет медиков для заказа #${order.id.slice(0, 8)}`);

      // Auto-retry in 5 minutes — store in this.timers so cancelOrder can clear it
      const retryTimer = setTimeout(() => {
        this.timers.delete(order.id);
        this.advanceDispatch(order.id).catch((err) =>
          this.logger.warn(`NO_MEDICS retry failed for order ${order.id}: ${String(err)}`),
        );
      }, 5 * 60 * 1000);
      this.timers.set(order.id, retryTimer);
    } else {
      // Zero attempts — no medics at all in radius → auto-cancel
      await this.orderRepo.update(order.id, {
        status: OrderStatus.CANCELED,
        dispatchStatus: 'FAILED',
        cancelReason: 'Нет доступных медиков в вашем районе',
      });
      this.gateway.emitOrderStatus(order.id, OrderStatus.CANCELED);

      const expoToken = await this.usersService.getPushToken(order.clientId);
      if (expoToken) {
        this.pushService
          .send([expoToken], {
            title: '❌ Медики недоступны',
            body: 'Нет медиков в вашем районе. Попробуйте позже.',
            sound: 'default',
            data: { orderId: order.id, status: 'canceled' },
            channelId: 'order_updates',
            priority: 'high',
          })
          .catch(() => {});
      }
      this.notifyAdmin(`❌ Заказ #${order.id.slice(0, 8)} отменён — нет медиков в радиусе`);
    }
  }

  /** Called when medic accepts the invite — or self-claims from available orders list.
   *  If a PENDING invite exists for this medic → mark it ACCEPTED (normal dispatch flow).
   *  If no invite → self-claim: cancel any other medic's pending timer/invite and proceed.
   *  Race condition safety is guaranteed by the atomic UPDATE WHERE status=CREATED in acceptOrder.
   */
  async onMedicAccept(orderId: string, medicId: string): Promise<void> {
    const attempt = await this.attemptRepo.findOne({
      where: { orderId, medicId, result: DispatchResult.PENDING },
    });

    // Always clear the dispatch timer for this order (no-op if none)
    this.clearTimer(orderId);

    if (attempt) {
      // Normal dispatch flow: invited medic accepted
      await this.attemptRepo.update(attempt.id, { result: DispatchResult.ACCEPTED });
    } else {
      // Self-claim from available orders list: cancel any other pending invite
      await this.attemptRepo
        .createQueryBuilder()
        .update()
        .set({ result: DispatchResult.TIMEOUT })
        .where('"orderId" = :orderId', { orderId })
        .andWhere('result = :result', { result: DispatchResult.PENDING })
        .execute();
    }

    await this.orderRepo.update(orderId, { dispatchStatus: 'ASSIGNED' });
  }

  /** Called when medic declines — validates, clears timer, advances to next medic */
  async onMedicDecline(orderId: string, medicId: string): Promise<void> {
    const attempt = await this.getActivePendingAttempt(orderId, medicId);
    this.clearTimer(orderId);
    await this.attemptRepo.update(attempt.id, { result: DispatchResult.DECLINED });
    this.gateway.emitDispatchInviteExpired(medicId, { orderId });
    await this.advanceDispatch(orderId);
  }

  /** Called when order is cancelled — clears timer and marks pending attempt as TIMEOUT */
  async cancelDispatch(orderId: string): Promise<void> {
    this.clearTimer(orderId);
    await this.attemptRepo
      .createQueryBuilder()
      .update()
      .set({ result: DispatchResult.TIMEOUT })
      .where('"orderId" = :orderId', { orderId })
      .andWhere('result = :result', { result: DispatchResult.PENDING })
      .execute();
  }

  private async getActivePendingAttempt(
    orderId: string,
    medicId: string,
  ): Promise<DispatchAttempt> {
    const attempt = await this.attemptRepo.findOne({
      where: { orderId, medicId, result: DispatchResult.PENDING },
    });
    if (!attempt) {
      throw new ForbiddenException('No active dispatch invite for this order');
    }
    if (attempt.expiresAt < new Date()) {
      throw new ForbiddenException('Dispatch invite has expired');
    }
    return attempt;
  }

  private clearTimer(orderId: string): void {
    const timer = this.timers.get(orderId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(orderId);
    }
  }

  private async selectBestMedic(order: Order, excludedIds: string[], clientId: string): Promise<Medic | null> {
    const rawCandidates = await this.medicsService.findCandidatesForDispatch(excludedIds);
    if (!rawCandidates.length) return null;

    const orderLat =
      order.location?.latitude != null ? Number(order.location.latitude) : null;
    const orderLng =
      order.location?.longitude != null ? Number(order.location.longitude) : null;

    // Geofence filter: exclude medics whose work zone does not contain the order location
    const candidates = rawCandidates.filter((m) => {
      const radius = m.workZoneRadius != null ? Number(m.workZoneRadius) : null;
      if (radius === null) return true; // no restriction
      if (orderLat === null || orderLng === null) return true; // no order location — include
      const zoneLat = Number(m.workZoneLat!);
      const zoneLng = Number(m.workZoneLng!);
      const dist = haversineKm(zoneLat, zoneLng, orderLat, orderLng);
      return dist <= radius;
    });

    if (!candidates.length) return null;

    // Use the already-computed orderLat/orderLng (reuse as lat/lng aliases)
    const lat = orderLat;
    const lng = orderLng;

    // Check if client has a favorite medic among candidates
    const favoriteMedicId = await this.favoritesService.findActiveFavoriteMedicId(clientId);
    if (favoriteMedicId) {
      const favCandidate = candidates.find((m) => m.id === favoriteMedicId);
      if (favCandidate) {
        // Additional radius check for favorite medic
        if (lat != null && lng != null) {
          const dist = haversineKm(lat, lng, Number(favCandidate.latitude!), Number(favCandidate.longitude!));
          if (dist <= this.DISPATCH_RADIUS_KM) {
            this.logger.log(`Dispatch: prioritizing favorite medic ${favoriteMedicId} for order ${order.id}`);
            return favCandidate;
          }
        } else {
          // No location — favorite takes priority regardless
          this.logger.log(`Dispatch: prioritizing favorite medic ${favoriteMedicId} for order ${order.id} (no location)`);
          return favCandidate;
        }
      }
    }

    if (lat == null || lng == null) {
      // No order location — pick best by rating then reviews
      return (
        candidates.sort((a, b) => {
          const rd = Number(b.rating ?? 0) - Number(a.rating ?? 0);
          if (rd !== 0) return rd;
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
        })[0] ?? null
      );
    }

    const withDist = candidates
      .map((m) => ({
        medic: m,
        dist: haversineKm(lat, lng, Number(m.latitude!), Number(m.longitude!)),
      }))
      .filter(({ dist }) => dist <= this.DISPATCH_RADIUS_KM)
      .sort((a, b) => a.dist - b.dist);

    return withDist[0]?.medic ?? null;
  }

  private notifyAdmin(msg: string): void {
    const adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');
    if (!adminChatId) return;
    this.telegramService.sendMessage(adminChatId, msg).catch(() => {});
  }
}
