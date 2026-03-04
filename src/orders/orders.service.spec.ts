import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderLocation } from './entities/order-location.entity';
import { OrderStatus } from './entities/order-status.enum';
import { OrderEventsGateway } from '../realtime/order-events.gateway';
import { PushNotificationsService } from '../realtime/push-notifications.service';
import { WebPushService } from '../realtime/web-push.service';
import { TelegramService } from '../common/telegram.service';
import { MedicsService } from '../medics/medics.service';
import { UsersService } from '../users/users.service';
import { ServicesService } from '../services/services.service';
import { DispatchService } from './dispatch.service';

const ORDER_ID = 'order-uuid-1';
const CLIENT_ID = 'client-uuid-1';
const MEDIC_ID = 'medic-uuid-1';
const SERVICE_ID = 'service-uuid-1';

function makeOrder(partial: Partial<Order> = {}): Order {
  return {
    id: ORDER_ID,
    clientId: CLIENT_ID,
    medicId: null,
    serviceId: SERVICE_ID,
    serviceTitle: 'Капельница',
    priceAmount: 200000,
    discountAmount: 0,
    platformFee: 20000,
    status: OrderStatus.CREATED,
    clientRating: null,
    location: null,
    medic: null,
    dispatchStatus: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  } as unknown as Order;
}

const mockOrderRepo = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockLocationRepo = {
  create: jest.fn(),
  save: jest.fn(),
};

const mockGateway = {
  emitOrderStatus: jest.fn(),
};

const mockPush = { send: jest.fn().mockResolvedValue(undefined) };
const mockWebPush = { sendToSubscriber: jest.fn().mockResolvedValue(undefined) };
const mockTelegram = { sendToAdmin: jest.fn() };
const mockMedics = { findCandidatesForDispatch: jest.fn(), findById: jest.fn(), updateRating: jest.fn() };
const mockUsers = { getPushToken: jest.fn().mockResolvedValue(null) };
const mockServices = { getActiveServiceOrThrow: jest.fn() };
const mockDispatch = {
  startDispatch: jest.fn().mockResolvedValue(undefined),
  cancelDispatch: jest.fn().mockResolvedValue(undefined),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(OrderLocation), useValue: mockLocationRepo },
        { provide: OrderEventsGateway, useValue: mockGateway },
        { provide: PushNotificationsService, useValue: mockPush },
        { provide: WebPushService, useValue: mockWebPush },
        { provide: TelegramService, useValue: mockTelegram },
        { provide: MedicsService, useValue: mockMedics },
        { provide: UsersService, useValue: mockUsers },
        { provide: ServicesService, useValue: mockServices },
        { provide: DispatchService, useValue: mockDispatch },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  // ── create ────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates an order and starts dispatch', async () => {
      const mockService = { id: SERVICE_ID, title: 'Капельница', price: 200000, isActive: true };
      mockServices.getActiveServiceOrThrow.mockResolvedValue(mockService);

      const savedOrder = makeOrder();
      mockOrderRepo.create.mockReturnValue(savedOrder);
      mockOrderRepo.save.mockResolvedValue(savedOrder);
      mockLocationRepo.create.mockReturnValue({});
      mockLocationRepo.save.mockResolvedValue({});
      mockOrderRepo.findOne.mockResolvedValue(savedOrder);

      const result = await service.create(CLIENT_ID, {
        serviceId: SERVICE_ID,
        location: {
          latitude: 41.2995,
          longitude: 69.2401,
          house: 'ул. Тестовая 1',
          phone: '+998901234567',
        },
      });

      expect(result.id).toBe(ORDER_ID);
      expect(result.status).toBe(OrderStatus.CREATED);
      expect(mockDispatch.startDispatch).toHaveBeenCalledWith(ORDER_ID);
    });

    it('throws BadRequestException when discount exceeds service price', async () => {
      mockServices.getActiveServiceOrThrow.mockResolvedValue({
        id: SERVICE_ID,
        title: 'Капельница',
        price: 200000,
        isActive: true,
      });

      await expect(
        service.create(CLIENT_ID, {
          serviceId: SERVICE_ID,
          discountAmount: 999999,
          location: {
            latitude: 41.2995,
            longitude: 69.2401,
            house: 'ул. Тестовая 1',
            phone: '+998901234567',
          },
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  // ── cancelOrder ───────────────────────────────────────────────────────────

  describe('cancelOrder', () => {
    it('cancels a CREATED order', async () => {
      const order = makeOrder({ status: OrderStatus.CREATED });
      mockOrderRepo.findOne.mockResolvedValue(order);
      mockOrderRepo.update.mockResolvedValue({ affected: 1 });

      const cancelledOrder = makeOrder({ status: OrderStatus.CANCELED });
      // Second call returns the updated order
      mockOrderRepo.findOne
        .mockResolvedValueOnce(order)
        .mockResolvedValueOnce(cancelledOrder);

      const result = await service.cancelOrder(ORDER_ID, CLIENT_ID);
      expect(result.status).toBe(OrderStatus.CANCELED);
      expect(mockGateway.emitOrderStatus).toHaveBeenCalledWith(ORDER_ID, OrderStatus.CANCELED);
      expect(mockDispatch.cancelDispatch).toHaveBeenCalledWith(ORDER_ID);
    });

    it('throws ForbiddenException when another client tries to cancel', async () => {
      const order = makeOrder({ status: OrderStatus.CREATED });
      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(service.cancelOrder(ORDER_ID, 'other-client-id')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('throws BadRequestException when order is not cancellable (e.g. ON_THE_WAY)', async () => {
      const order = makeOrder({ status: OrderStatus.ON_THE_WAY });
      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(service.cancelOrder(ORDER_ID, CLIENT_ID)).rejects.toThrow(BadRequestException);
    });
  });

  // ── findOneForActor ───────────────────────────────────────────────────────

  describe('findOneForActor', () => {
    it('returns order for the owner client', async () => {
      const order = makeOrder();
      mockOrderRepo.findOne.mockResolvedValue(order);

      const result = await service.findOneForActor(ORDER_ID, CLIENT_ID, 'client');
      expect(result.id).toBe(ORDER_ID);
    });

    it('returns order for admin regardless of ownership', async () => {
      const order = makeOrder();
      mockOrderRepo.findOne.mockResolvedValue(order);

      const result = await service.findOneForActor(ORDER_ID, 'admin-id', 'admin');
      expect(result.id).toBe(ORDER_ID);
    });

    it('throws ForbiddenException for unrelated client', async () => {
      const order = makeOrder();
      mockOrderRepo.findOne.mockResolvedValue(order);

      await expect(
        service.findOneForActor(ORDER_ID, 'stranger-id', 'client'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when order does not exist', async () => {
      mockOrderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneForActor('nonexistent-id', CLIENT_ID, 'client'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
