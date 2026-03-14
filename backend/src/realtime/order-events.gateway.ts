import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/entities/order-status.enum';

export type OrderStatusPayload = { orderId: string; status: string };
export type MedicLocationPayload = {
  orderId: string;
  medicId: string;
  latitude: number;
  longitude: number;
  heading?: number | null;
  updatedAt: string;
  source?: 'socket' | 'rest';
};

@WebSocketGateway({
  cors: {
    origin: [
      'https://hamshirago-web.vercel.app',
      'https://hamshirago-web-medic.vercel.app',
      'https://hamshirago-admin.vercel.app',
      'https://web-production-d365f.up.railway.app',
      'https://admin-production-9727.up.railway.app',
      'https://web-medic-production.up.railway.app',
      'https://hamshirago.uz',
      'https://www.hamshirago.uz',
      'https://app.hamshirago.uz',
      'https://medic.hamshirago.uz',
      'https://admin.hamshirago.uz',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:8081',
      'http://localhost:8082',
    ],
    credentials: true,
  },
})
export class OrderEventsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrderEventsGateway.name);
  private clientOrderRooms = new Map<string, Set<string>>(); // socketId -> Set of orderIds
  private readonly clientConnectedAt = new Map<string, number>();

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    setInterval(() => {
      const cutoff = Date.now() - 30 * 60 * 1000;
      for (const [socketId, connectedAt] of this.clientConnectedAt.entries()) {
        if (connectedAt < cutoff) {
          this.clientOrderRooms.delete(socketId);
          this.clientConnectedAt.delete(socketId);
        }
      }
    }, 5 * 60 * 1000);
  }

  private async canAccessOrderRoom(
    userId: string,
    role: 'client' | 'medic' | 'admin',
    orderId: string,
  ): Promise<boolean> {
    if (role === 'admin') return true;
    if (role === 'client') {
      const exists = await this.orderRepo.exist({ where: { id: orderId, clientId: userId } });
      return exists;
    }
    if (role === 'medic') {
      const exists = await this.orderRepo.exist({ where: { id: orderId, medicId: userId } });
      return exists;
    }
    return false;
  }

  private async isMedicAssignedToActiveOrder(medicId: string, orderId: string): Promise<boolean> {
    return this.orderRepo.exist({
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
  }

  async handleConnection(client: any) {
    try {
      const token = client.handshake?.auth?.token ?? client.handshake?.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token, { secret: this.configService.get('JWT_SECRET') });
      (client as any).userId = payload.sub;
      (client as any).role = payload.role;
      if (payload.role === 'medic') {
        // Feed room for broadcast new_order (fallback list)
        client.join('medics_feed');
        // Personal room for targeted dispatch invites
        client.join(`medic:${payload.sub}`);
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
    if (!allowed) return;

    const room = `order:${orderId}`;
    client.join(room);
    let set = this.clientOrderRooms.get(client.id);
    if (!set) {
      set = new Set();
      this.clientOrderRooms.set(client.id, set);
    }
    set.add(orderId);
  }

  @SubscribeMessage('unsubscribe_order')
  handleUnsubscribeOrder(client: any, orderId: string) {
    client.leave(`order:${orderId}`);
    this.clientOrderRooms.get(client.id)?.delete(orderId);
  }

  /** Call this from OrdersService when status changes to notify clients */
  emitOrderStatus(orderId: string, status: string) {
    this.server.to(`order:${orderId}`).emit('order_status', { orderId, status });
    this.logger.log(`Emitted order_status orderId=${orderId} status=${status}`);
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
  }

  /** Send dispatch invite to a specific medic's personal room */
  emitDispatchInvite(medicId: string, payload: Record<string, unknown>) {
    this.server.to(`medic:${medicId}`).emit('dispatch_invite', payload);
    this.logger.log(`Emitted dispatch_invite to medic=${medicId} order=${payload['orderId']}`);
  }

  /** Notify a medic that their invite expired or was revoked */
  emitDispatchInviteExpired(medicId: string, payload: { orderId: string }) {
    this.server.to(`medic:${medicId}`).emit('dispatch_invite_expired', payload);
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
  }

  emitMedicLocation(
    orderId: string,
    medicId: string,
    latitude: number,
    longitude: number,
    source: 'socket' | 'rest' = 'socket',
    heading: number | null = null,
  ) {
    const payload: MedicLocationPayload = {
      orderId,
      medicId,
      latitude,
      longitude,
      heading,
      updatedAt: new Date().toISOString(),
      source,
    };
    this.server.to(`order:${orderId}`).emit('medic_location', payload);
  }
}
