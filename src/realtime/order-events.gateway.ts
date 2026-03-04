import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Logger } from '@nestjs/common';
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
  updatedAt: string;
  source?: 'socket' | 'rest';
};

@WebSocketGateway({
  cors: { origin: true },
})
export class OrderEventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(OrderEventsGateway.name);
  private clientOrderRooms = new Map<string, Set<string>>(); // socketId -> Set of orderIds

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
      this.logger.log(`Client connected: ${client.id} user=${payload.sub} role=${payload.role}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: any) {
    this.clientOrderRooms.delete(client.id);
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
    payload: { orderId: string; latitude: number; longitude: number },
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
  emitDispatchUpdate(orderId: string, payload: Record<string, unknown>) {
    this.server.to(`order:${orderId}`).emit('dispatch_update', { orderId, ...payload });
  }

  emitMedicLocation(
    orderId: string,
    medicId: string,
    latitude: number,
    longitude: number,
    source: 'socket' | 'rest' = 'socket',
  ) {
    const payload: MedicLocationPayload = {
      orderId,
      medicId,
      latitude,
      longitude,
      updatedAt: new Date().toISOString(),
      source,
    };
    this.server.to(`order:${orderId}`).emit('medic_location', payload);
  }
}
