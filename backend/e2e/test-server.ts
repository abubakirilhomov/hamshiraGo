/**
 * Test NestJS server — run via ts-node (which supports emitDecoratorMetadata).
 * Uses in-memory mock repos so no real DB is needed.
 *
 * Command: npx ts-node e2e/test-server.ts
 */

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { Controller, Get } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable } from '@nestjs/common';
import { Between } from 'typeorm';

import { PaymentsController } from '../src/payments/payments.controller';
import { PaymentsService } from '../src/payments/payments.service';
import { PaymeService } from '../src/payments/payme.service';
import { ClickService } from '../src/payments/click.service';
import { Payment } from '../src/payments/entities/payment.entity';
import { Order } from '../src/orders/entities/order.entity';

// ── Constants ─────────────────────────────────────────────────────────────────

export const TEST_PORT = 13579;
export const TEST_SECRET = 'test-jwt-secret';
export const PAYME_KEY = 'test-payme-key';
export const CLICK_SECRET = 'test-click-secret';
export const CLICK_SERVICE_ID = '12345';
export const ORDER_ID = 'order-uuid-1';
export const ORDER_PRICE = 200000;

// Set env vars before module init
process.env['JWT_SECRET'] = TEST_SECRET;
process.env['PAYME_MERCHANT_ID'] = 'test-merchant';
process.env['PAYME_MERCHANT_KEY'] = PAYME_KEY;
process.env['PAYME_TEST_MODE'] = 'true';
process.env['CLICK_MERCHANT_ID'] = '67890';
process.env['CLICK_SERVICE_ID'] = CLICK_SERVICE_ID;
process.env['CLICK_SECRET_KEY'] = CLICK_SECRET;
process.env['APP_URL'] = 'https://test.example.com';

// ── Minimal health endpoint ───────────────────────────────────────────────────

@Controller('health')
class HealthController {
  @Get()
  health() {
    return { status: 'ok' };
  }
}

// ── Lightweight JWT strategy (no DB lookup) ───────────────────────────────────

@Injectable()
class TestJwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: TEST_SECRET,
    });
  }
  validate(payload: { sub: string; role: string }) {
    return { id: payload.sub, role: payload.role };
  }
}

// ── In-memory mock repositories ───────────────────────────────────────────────

const mockOrders = new Map<string, Record<string, unknown>>([
  [
    ORDER_ID,
    {
      id: ORDER_ID,
      clientId: 'client-uuid-1',
      priceAmount: ORDER_PRICE,
      status: 'CREATED',
    },
  ],
]);

const mockPayments = new Map<string, Record<string, unknown>>();
let paymentCounter = 0;

function matchWhere(entity: Record<string, unknown>, where: Record<string, unknown>): boolean {
  for (const [key, value] of Object.entries(where)) {
    if (value !== null && typeof value === 'object' && !(value instanceof Date)) continue;
    if (entity[key] !== value) return false;
  }
  return true;
}

const mockPaymentRepo = {
  findOne: async (opts: { where: Record<string, unknown> }) => {
    for (const p of mockPayments.values()) {
      if (matchWhere(p, opts.where)) return p;
    }
    return null;
  },
  create: (data: Record<string, unknown>) => ({
    id: `payment-uuid-${++paymentCounter}`,
    providerState: null,
    performTime: null,
    cancelTime: null,
    reason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data,
  }),
  save: async (payment: Record<string, unknown>) => {
    payment['updatedAt'] = new Date();
    mockPayments.set(payment['id'] as string, payment);
    return payment;
  },
  find: async () => Array.from(mockPayments.values()),
};

const mockOrderRepo = {
  findOne: async (opts: { where: Record<string, unknown> }) => {
    const id = opts.where['id'] as string;
    return mockOrders.get(id) ?? null;
  },
};

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function bootstrap() {
  const moduleRef = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({ isGlobal: true }),
      PassportModule.register({ defaultStrategy: 'jwt' }),
      JwtModule.register({ secret: TEST_SECRET, signOptions: { expiresIn: '1h' } }),
    ],
    controllers: [HealthController, PaymentsController],
    providers: [
      PaymentsService,
      PaymeService,
      ClickService,
      TestJwtStrategy,
      { provide: getRepositoryToken(Payment), useValue: mockPaymentRepo },
      { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
    ],
  }).compile();

  const app = moduleRef.createNestApplication();
  await app.init();
  await app.listen(TEST_PORT);
  console.log(`[test-server] listening on http://localhost:${TEST_PORT}`);
}

bootstrap().catch((err) => {
  console.error('[test-server] failed to start:', err);
  process.exit(1);
});
