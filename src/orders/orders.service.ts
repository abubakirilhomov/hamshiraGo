import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { OrderStatus } from './entities/order-status.enum';
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
  /** Platform commission rate — 10% of the net order price */
  private static readonly COMMISSION_RATE = 0.10;

  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    @InjectRepository(OrderLocation)
    private locationRepo: Repository<OrderLocation>,
    private orderEventsGateway: OrderEventsGateway,
    private pushService: PushNotificationsService,
    private webPushService: WebPushService,
    private telegramService: TelegramService,
    private medicsService: MedicsService,
    private usersService: UsersService,
    private servicesService: ServicesService,
    private dispatchService: DispatchService,
  ) {}

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
  }

  async create(clientId: string, dto: CreateOrderDto): Promise<Order> {
    // ── Fetch & validate service from catalog ────────────────────────────────
    const service = await this.servicesService.getActiveServiceOrThrow(dto.serviceId);

    const discountAmount = dto.discountAmount ?? 0;
    if (discountAmount > service.price) {
      throw new BadRequestException('Discount cannot exceed the service price');
    }

    const netPrice = service.price - discountAmount;
    const platformFee = Math.round(netPrice * OrdersService.COMMISSION_RATE);

    const order = this.orderRepo.create({
      clientId,
      serviceId: service.id,
      serviceTitle: service.title,     // snapshot from catalog
      priceAmount: service.price,      // price locked from catalog, client cannot override
      discountAmount,
      platformFee,
      status: OrderStatus.CREATED,
    });
    const saved = await this.orderRepo.save(order);
    const location = this.locationRepo.create({
      orderId: saved.id,
      latitude: dto.location.latitude,
      longitude: dto.location.longitude,
      house: dto.location.house,
      floor: dto.location.floor ?? null,
      apartment: dto.location.apartment ?? null,
      phone: dto.location.phone,
    });
    await this.locationRepo.save(location);
    const fullOrder = await this.findOne(saved.id);

    // Start automatic dispatch (Yandex-taxi-style push-based assignment)
    this.dispatchService.startDispatch(saved.id).catch((err) => {
      this.logger.error(`startDispatch failed for order ${saved.id}: ${err}`);
    });

    return fullOrder;
  }

  async findOne(id: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { location: true, medic: true },
    });
    if (!order) throw new NotFoundException('Order not found');
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
    throw new ForbiddenException('You do not have access to this order');
  }

  /** Client cancels their own order — only allowed while CREATED or ASSIGNED */
  async cancelOrder(orderId: string, clientId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.clientId !== clientId) throw new ForbiddenException('Not your order');
    const cancellable: OrderStatus[] = [OrderStatus.CREATED, OrderStatus.ASSIGNED];
    if (!cancellable.includes(order.status)) {
      throw new BadRequestException(
        `Cannot cancel an order with status "${order.status}". Only CREATED or ASSIGNED orders can be cancelled.`,
      );
    }
    // Cancel any active dispatch search
    if (order.status === OrderStatus.CREATED) {
      this.dispatchService.cancelDispatch(orderId).catch(() => {});
    }
    await this.orderRepo.update(orderId, { status: OrderStatus.CANCELED });
    this.orderEventsGateway.emitOrderStatus(orderId, OrderStatus.CANCELED);
    const updated = await this.findOne(orderId);
    this.notifyClient(updated, OrderStatus.CANCELED);
    return updated;
  }

  /** Client rates the medic after order is DONE */
  async rateOrder(orderId: string, clientId: string, dto: RateOrderDto): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.clientId !== clientId) throw new ForbiddenException('Not your order');
    if (order.status !== OrderStatus.DONE) throw new BadRequestException('Can only rate a completed order');
    if (order.clientRating !== null) throw new BadRequestException('Order already rated');
    if (!order.medicId) throw new BadRequestException('No medic assigned to this order');

    // Save rating on the order
    await this.orderRepo.update(orderId, { clientRating: dto.rating });

    // Recalculate medic's weighted average rating
    const medic = await this.medicsService.findById(order.medicId);
    if (medic) {
      const currentCount = medic.reviewCount ?? 0;
      const currentRating = Number(medic.rating ?? 0);
      const newCount = currentCount + 1;
      const newRating = Number(((currentRating * currentCount + dto.rating) / newCount).toFixed(2));
      await this.medicsService.updateRating(order.medicId, newRating, newCount);
    }

    return this.findOne(orderId);
  }

  async updateStatusByClient(
    id: string,
    clientId: string,
    dto: UpdateOrderStatusDto,
  ): Promise<Order> {
    const order = await this.findOne(id);
    if (order.clientId !== clientId) {
      throw new ForbiddenException('Not your order');
    }
    // Client can only confirm completion once medic started service.
    if (dto.status !== OrderStatus.DONE || order.status !== OrderStatus.SERVICE_STARTED) {
      throw new BadRequestException(
        `Client cannot transition from "${order.status}" to "${dto.status}"`,
      );
    }
    order.status = OrderStatus.DONE;
    await this.orderRepo.save(order);
    this.orderEventsGateway.emitOrderStatus(id, OrderStatus.DONE);
    this.notifyClient(order, OrderStatus.DONE);
    return this.findOne(id);
  }

  async findByClient(
    clientId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Order[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const [data, total] = await this.orderRepo.findAndCount({
      where: { clientId },
      relations: { location: true, medic: true },
      order: { created_at: 'DESC' },
      take,
      skip,
    });
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
    const orders = await this.orderRepo.find({
      where: { status: OrderStatus.CREATED },
      relations: { location: true },
      order: { created_at: 'ASC' },
    });

    const medic = await this.medicsService.findById(medicId);
    if (!medic || medic.latitude == null || medic.longitude == null) {
      // No location data — return all orders (fallback)
      return orders;
    }

    const MAX_KM = 10;
    const medicLat = Number(medic.latitude);
    const medicLon = Number(medic.longitude);

    const withDistance = orders
      .filter((o) => o.location?.latitude != null && o.location?.longitude != null)
      .map((o) => ({
        order: o,
        distanceKm: this.haversineKm(
          medicLat, medicLon,
          Number(o.location!.latitude),
          Number(o.location!.longitude),
        ),
      }))
      .filter(({ distanceKm }) => distanceKm <= MAX_KM)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    return withDistance.map(({ order }) => order);
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

  /** Medic accepts a CREATED order → status becomes ASSIGNED */
  async acceptOrder(orderId: string, medicId: string): Promise<Order> {
    const medic = await this.medicsService.findById(medicId);
    if (!medic) throw new ForbiddenException('Medic not found');
    if (medic.verificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Your account is not yet verified. Upload your documents and wait for approval.',
      );
    }
    if (medic.isBlocked) throw new ForbiddenException('Your account has been blocked.');

    // Validate that this medic has an active dispatch invite, clear timer, mark ACCEPTED
    await this.dispatchService.onMedicAccept(orderId, medicId);

    // Atomic update: only succeeds if order is still CREATED (prevents race condition)
    const result = await this.orderRepo.update(
      { id: orderId, status: OrderStatus.CREATED },
      { medicId, status: OrderStatus.ASSIGNED },
    );
    if (!result.affected) {
      throw new BadRequestException('Order is no longer available');
    }
    this.orderEventsGateway.emitOrderStatus(orderId, OrderStatus.ASSIGNED);
    const updated = await this.findOne(orderId);
    this.notifyClient(updated, OrderStatus.ASSIGNED);
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
    const order = await this.findOne(orderId);
    if (order.medicId !== medicId) throw new ForbiddenException('Order not assigned to you');

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
        `Cannot transition from "${order.status}" to "${status}"`,
      );
    }

    order.status = status;
    await this.orderRepo.save(order);
    this.orderEventsGateway.emitOrderStatus(orderId, status);

    // Credit medic balance when order is completed (net price minus platform commission)
    if (status === OrderStatus.DONE) {
      const netPrice = (order.priceAmount ?? 0) - (order.discountAmount ?? 0);
      const medicEarned = netPrice - (order.platformFee ?? 0);
      await this.medicsService.addBalance(medicId, medicEarned);
    }

    const updated = await this.findOne(orderId);
    this.notifyClient(updated, status);
    return updated;
  }

  /** All orders assigned to a medic */
  async findByMedic(
    medicId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: Order[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const [data, total] = await this.orderRepo.findAndCount({
      where: { medicId },
      relations: { location: true },
      order: { created_at: 'DESC' },
      take,
      skip,
    });
    return { data, total, page, totalPages: Math.ceil(total / take) };
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  /** All orders with optional status filter — for admin dashboard */
  async findAllAdmin(
    page = 1,
    limit = 20,
    status?: OrderStatus,
  ): Promise<{ data: Order[]; total: number; page: number; totalPages: number }> {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const where = status ? { status } : {};
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
  async adminCancelOrder(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);
    if (order.status === OrderStatus.DONE || order.status === OrderStatus.CANCELED) {
      throw new BadRequestException(`Order is already ${order.status}`);
    }
    if (order.status === OrderStatus.CREATED) {
      this.dispatchService.cancelDispatch(orderId).catch(() => {});
    }
    order.status = OrderStatus.CANCELED;
    await this.orderRepo.save(order);
    this.orderEventsGateway.emitOrderStatus(orderId, OrderStatus.CANCELED);
    const updated = await this.findOne(orderId);
    this.notifyClient(updated, OrderStatus.CANCELED);
    return updated;
  }
}
