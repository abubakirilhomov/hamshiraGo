import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Inject, Logger, OnModuleDestroy, OnModuleInit, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderLocation } from '../orders/entities/order-location.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';
import { ALLOWED_ORIGINS } from '../common/cors.config';
import { UsersService } from '../users/users.service';
import { MedicsService } from '../medics/medics.service';
import { haversineKm } from '../utils/geo';

export type OrderStatusPayload = { orderId: string; status: string };
export type MedicLocationPayload = {
  orderId: string;
  medicId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  updatedAt: string;
  source?: 'socket' | 'rest';
  etaMinutes?: number | null;
};

@WebSocketGateway({
  cors: {
    origin: ALLOWED_ORIGINS,
    credentials: true,
  },
})
export class OrderEventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrderEventsGateway.name);
  private clientOrderRooms = new Map<string, Set<string>>(); // socketId -> Set of orderIds
  private readonly clientConnectedAt = new Map<string, number>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  /** BE-M7: In-memory cache for order access checks (key: "userId-orderId", value: {allowed, ts}) */
  private readonly accessCache = new Map<string, { allowed: boolean; ts: number }>();
  private readonly ACCESS_CACHE_TTL = 30_000;

  /** BE-M8: In-memory cache for medic-to-active-order mapping (key: "medicId-orderId", value: {ok, ts}) */
  private readonly medicOrderCache = new Map<string, { ok: boolean; ts: number }>();
  private readonly MEDIC_ORDER_CACHE_TTL = 30_000;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderLocation)
    private readonly orderLocationRepo: Repository<OrderLocation>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    @Inject(forwardRef(() => MedicsService))
    private medicsService: MedicsService,
  ) {}

  /**
   * Calculate ETA in minutes from medic position to order location.
   * Tries OSRM first (3s timeout), falls back to haversine / 30 km/h.
   */
  private async calculateEta(
    medicLat: number,
    medicLng: number,
    orderLat: number,
    orderLng: number,
  ): Promise<number | null> {
    const osrmUrl = this.configService.get<string>('OSRM_URL');
    if (osrmUrl) {
      try {
        const url = `${osrmUrl}/route/v1/driving/${medicLng},${medicLat};${orderLng},${orderLat}?overview=false`;
        const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
        const data = (await res.json()) as { routes?: { duration: number }[] };
        if (data.routes?.[0]?.duration) {
          return Math.ceil(data.routes[0].duration / 60);
        }
      } catch {
        // OSRM unavailable — fall through to haversine
      }
    }
    // Fallback: haversine distance / average city speed (30 km/h)
    const dist = haversineKm(medicLat, medicLng, orderLat, orderLng);
    return Math.max(1, Math.ceil((dist / 30) * 60));
  }

  /** Fetch the order location for ETA calculation (cached per request, not long-term) */
  private async getOrderLocation(orderId: string): Promise<{ latitude: number; longitude: number } | null> {
    const loc = await this.orderLocationRepo.findOne({
      where: { orderId },
      select: ['latitude', 'longitude'],
    });
    if (!loc) return null;
    return { latitude: Number(loc.latitude), longitude: Number(loc.longitude) };
  }

  onModuleInit() {
    this.cleanupInterval = setInterval(() => {
      const cutoff = Date.now() - 30 * 60 * 1000;
      for (const [socketId, connectedAt] of this.clientConnectedAt.entries()) {
        if (connectedAt < cutoff) {
          this.clientOrderRooms.delete(socketId);
          this.clientConnectedAt.delete(socketId);
        }
      }
    }, 5 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval !== null) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  private async canAccessOrderRoom(
    userId: string,
    role: 'client' | 'medic' | 'admin',
    orderId: string,
  ): Promise<boolean> {
    if (role === 'admin') return true;

    const cacheKey = `${userId}-${orderId}`;
    const cached = this.accessCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.ACCESS_CACHE_TTL) {
      return cached.allowed;
    }

    let allowed = false;
    if (role === 'client') {
      allowed = await this.orderRepo.exist({ where: { id: orderId, clientId: userId } });
    } else if (role === 'medic') {
      allowed = await this.orderRepo.exist({ where: { id: orderId, medicId: userId } });
    }

    this.accessCache.set(cacheKey, { allowed, ts: Date.now() });
    return allowed;
  }

  private async isMedicAssignedToActiveOrder(medicId: string, orderId: string): Promise<boolean> {
    const cacheKey = `${medicId}-${orderId}`;
    const cached = this.medicOrderCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < this.MEDIC_ORDER_CACHE_TTL) {
      return cached.ok;
    }

    const ok = await this.orderRepo.exist({
      where: {
        id: orderId,
        medicId,
        status: In([
          OrderStatus.ASSIGNED,
          OrderStatus.ACCEPTED,
          OrderStatus.ON_THE_WAY,
          OrderStatus.ARRIVED,
          OrderStatus.SERVICE_STARTED,
        ]),
      },
    });

    this.medicOrderCache.set(cacheKey, { ok, ts: Date.now() });
    return ok;
  }

  async handleConnection(client: any) {
    try {
      const token = client.handshake?.auth?.token ?? client.handshake?.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, { secret: this.configService.get('JWT_SECRET') });

      // Block check: disconnect blocked users even if JWT is still valid
      if (payload.role === 'client') {
        const user = await this.usersService.findById(payload.sub);
        if (!user || user.isBlocked) { client.disconnect(); return; }
      } else if (payload.role === 'medic') {
        const medic = await this.medicsService.findById(payload.sub);
        if (!medic || medic.isBlocked) { client.disconnect(); return; }
      }

      (client as any).userId = payload.sub;
      (client as any).role = payload.role;
      if (payload.role === 'medic') {
        // Feed room for broadcast new_order (fallback list)
        client.join('medics_feed');
        // Personal room for targeted dispatch invites
        client.join(`medic:${payload.sub}`);
      }
      if (payload.role === 'doctor') {
        client.join(`doctor:${payload.sub}`);
      }
      if (payload.role === 'clinic') {
        client.join(`clinic:${payload.companyId}`);
        this.logger.log(`Clinic user connected: company=${payload.companyId} role=${payload.clinicRole}`);
      }
      this.clientConnectedAt.set(client.id, Date.now());
      this.logger.log(`Client connected: ${client.id} user=${payload.sub} role=${payload.role}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: any) {
    this.clientOrderRooms.delete(client.id);
    this.clientConnectedAt.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe_order')
  async handleSubscribeOrder(client: any, orderId: string) {
    if (!orderId) return;
    const role = (client as any).role as 'client' | 'medic' | 'admin';
    const userId = (client as any).userId as string;
    const allowed = await this.canAccessOrderRoom(userId, role, orderId);
    if (!allowed) {
      this.logger.warn(`subscribe_order denied user=${userId} role=${role} orderId=${orderId}`);
      return;
    }

    const room = `order:${orderId}`;
    client.join(room);
    let set = this.clientOrderRooms.get(client.id);
    if (!set) {
      set = new Set();
      this.clientOrderRooms.set(client.id, set);
    }
    set.add(orderId);
    this.logger.log(`subscribe_order user=${userId} role=${role} orderId=${orderId}`);
  }

  @SubscribeMessage('unsubscribe_order')
  handleUnsubscribeOrder(client: any, orderId: string) {
    client.leave(`order:${orderId}`);
    this.clientOrderRooms.get(client.id)?.delete(orderId);
    this.logger.log(`unsubscribe_order user=${(client as any).userId} orderId=${orderId}`);
  }

  /** Call this from OrdersService when status changes to notify clients */
  async emitOrderStatus(orderId: string, status: string, medicId?: string | null) {
    const payload: Record<string, unknown> = { orderId, status };

    // When medic starts travelling, calculate initial ETA and include it
    if (status === OrderStatus.ON_THE_WAY && medicId) {
      try {
        const medic = await this.medicsService.findById(medicId);
        const orderLoc = await this.getOrderLocation(orderId);
        if (medic?.latitude != null && medic?.longitude != null && orderLoc) {
          const eta = await this.calculateEta(
            Number(medic.latitude), Number(medic.longitude),
            orderLoc.latitude, orderLoc.longitude,
          );
          payload.etaMinutes = eta;
        }
      } catch {
        // ETA calculation failed — emit without it
      }
    }

    this.server.to(`order:${orderId}`).emit('order_status', payload);
    this.logger.log(`Emitted order_status orderId=${orderId} status=${status}`);

    // Invalidate medic-order cache entries for this order on status change
    for (const [key] of this.medicOrderCache) {
      if (key.endsWith(`-${orderId}`)) {
        this.medicOrderCache.delete(key);
      }
    }
  }

  /** Broadcast a new order to all online medics */
  emitNewOrder(order: Record<string, unknown>) {
    this.server.to('medics_feed').emit('new_order', order);
    this.logger.log(`Emitted new_order id=${order['id']}`);
  }

  @SubscribeMessage('medic_location')
  async handleMedicLocation(
    client: any,
    payload: { orderId: string; latitude: number; longitude: number; heading?: number | null },
  ) {
    if ((client as any).role !== 'medic') return;
    if (!payload?.orderId) return;
    if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) return;
    const medicId = (client as any).userId as string;
    const canEmit = await this.isMedicAssignedToActiveOrder(medicId, payload.orderId);
    if (!canEmit) return;

    this.emitMedicLocation(
      payload.orderId,
      medicId,
      payload.latitude,
      payload.longitude,
      'socket',
      payload.heading ?? null,
    );
    this.logger.debug(`medic_location received medic=${medicId} orderId=${payload.orderId}`);
  }

  /** Notify doctor about new pending consultation */
  emitNewConsultation(doctorId: string, payload: Record<string, unknown>) {
    this.server.to(`doctor:${doctorId}`).emit('new_consultation', payload);
    this.logger.log(`Emitted new_consultation to doctor=${doctorId}`);
  }

  /** Send dispatch invite to a specific medic's personal room */
  emitDispatchInvite(medicId: string, payload: Record<string, unknown>) {
    this.server.to(`medic:${medicId}`).emit('dispatch_invite', payload);
    this.logger.log(`Emitted dispatch_invite to medic=${medicId} order=${payload['orderId']}`);
  }

  /** Notify a medic that their invite expired or was revoked */
  emitDispatchInviteExpired(medicId: string, payload: { orderId: string }) {
    this.server.to(`medic:${medicId}`).emit('dispatch_invite_expired', payload);
    this.logger.log(`Emitted dispatch_invite_expired medic=${medicId} orderId=${payload.orderId}`);
  }

  /** Notify the client (order room) about current dispatch state */
  emitDispatchUpdate(
    orderId: string,
    payload: {
      status: string;
      medic?: {
        name: string;
        latitude: number | null;
        longitude: number | null;
        rating: number | null;
        profilePhotoUrl?: string | null;
      } | null;
    },
  ) {
    this.server.to(`order:${orderId}`).emit('dispatch_update', { orderId, ...payload });
    this.logger.log(`Emitted dispatch_update orderId=${orderId} status=${payload.status}`);
  }

  /** Notify clinic about new lead from Salomat */
  emitNewLead(companyId: string, payload: Record<string, unknown>) {
    this.server.to(`clinic:${companyId}`).emit('clinic:new_lead', payload);
    this.logger.log(`Emitted clinic:new_lead to company=${companyId}`);
  }

  /** Notify clinic about appointment status change */
  emitAppointmentUpdate(companyId: string, payload: Record<string, unknown>) {
    this.server.to(`clinic:${companyId}`).emit('clinic:appointment_update', payload);
    this.logger.log(`Emitted clinic:appointment_update to company=${companyId}`);
  }

  async emitMedicLocation(
    orderId: string,
    medicId: string,
    latitude: number,
    longitude: number,
    source: 'socket' | 'rest' = 'socket',
    heading: number | null = null,
  ) {
    // Calculate ETA asynchronously — do not block if it fails
    let etaMinutes: number | null = null;
    try {
      const orderLoc = await this.getOrderLocation(orderId);
      if (orderLoc) {
        etaMinutes = await this.calculateEta(
          latitude, longitude,
          orderLoc.latitude, orderLoc.longitude,
        );
      }
    } catch {
      // ETA calculation failed — emit without it
    }

    const payload: MedicLocationPayload = {
      orderId,
      medicId,
      latitude,
      longitude,
      heading,
      updatedAt: new Date().toISOString(),
      source,
      etaMinutes,
    };
    this.server.to(`order:${orderId}`).emit('medic_location', payload);
  }
}
