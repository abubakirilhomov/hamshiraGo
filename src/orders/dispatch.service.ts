import {
  Injectable,
  Logger,
  ForbiddenException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { DispatchAttempt, DispatchResult } from './entities/dispatch-attempt.entity';
import { Order } from './entities/order.entity';
import { OrderStatus } from './entities/order-status.enum';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { TelegramService } from '../common/telegram.service';
import { MedicsService } from '../medics/medics.service';
import { UsersService } from '../users/users.service';
import { Medic } from '../medics/entities/medic.entity';

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

    const medic = await this.selectBestMedic(order, excludedIds);
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
    } else {
      // Zero attempts — no medics at all in radius → auto-cancel
      await this.orderRepo.update(order.id, {
        status: OrderStatus.CANCELED,
        dispatchStatus: 'FAILED',
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

  /** Called when medic accepts the invite — validates attempt, clears timer */
  async onMedicAccept(orderId: string, medicId: string): Promise<void> {
    const attempt = await this.getActivePendingAttempt(orderId, medicId);
    this.clearTimer(orderId);
    await this.attemptRepo.update(attempt.id, { result: DispatchResult.ACCEPTED });
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

  private async selectBestMedic(order: Order, excludedIds: string[]): Promise<Medic | null> {
    const candidates = await this.medicsService.findCandidatesForDispatch(excludedIds);
    if (!candidates.length) return null;

    const lat =
      order.location?.latitude != null ? Number(order.location.latitude) : null;
    const lng =
      order.location?.longitude != null ? Number(order.location.longitude) : null;

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
        dist: this.haversineKm(lat, lng, Number(m.latitude!), Number(m.longitude!)),
      }))
      .filter(({ dist }) => dist <= this.DISPATCH_RADIUS_KM)
      .sort((a, b) => a.dist - b.dist);

    return withDist[0]?.medic ?? null;
  }

  private haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private notifyAdmin(msg: string): void {
    const adminChatId = this.configService.get<string>('TELEGRAM_ADMIN_CHAT_ID');
    if (!adminChatId) return;
    this.telegramService.sendMessage(adminChatId, msg).catch(() => {});
  }
}
