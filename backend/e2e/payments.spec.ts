/**
 * Playwright API E2E tests — Payments module (Payme + Click).
 *
 * Pure HTTP tests; no NestJS imports.
 * The test-server (e2e/test-server.ts) is started by Playwright's webServer config.
 * Tests run serially to share in-memory DB state across the full payment flow.
 */

import { test, expect } from '@playwright/test';
import * as crypto from 'crypto';
import * as jwt from 'jsonwebtoken';

// ── Constants (must match test-server.ts) ─────────────────────────────────────

const ORDER_ID = 'order-uuid-1';
const ORDER_PRICE = 200000;
const TEST_SECRET = 'test-jwt-secret';
const PAYME_KEY = 'test-payme-key';
const CLICK_SECRET = 'test-click-secret';
const CLICK_SERVICE_ID = '12345';

// ── Helpers ───────────────────────────────────────────────────────────────────

const JWT_TOKEN = (jwt.sign as (p: object, s: string) => string)(
  { sub: 'client-uuid-1', role: 'client' },
  TEST_SECRET,
);

function paymeAuth(key = PAYME_KEY): string {
  return `Basic ${Buffer.from(`Paycom:${key}`).toString('base64')}`;
}

function md5(...parts: string[]): string {
  return crypto.createHash('md5').update(parts.join('')).digest('hex');
}

const SIGN_TIME = '2026-01-01 00:00:00';
const CLICK_TX_ID = 'click_tx_1';

// ── Shared state ──────────────────────────────────────────────────────────────

let clickPrepareId = ''; // captured from Click prepare response

// ── Serial mode ───────────────────────────────────────────────────────────────

test.describe.configure({ mode: 'serial' });

// ── 1. JWT Auth guard ─────────────────────────────────────────────────────────

test('POST /payments/:id/initiate — 401 without Bearer token', async ({ request }) => {
  const res = await request.post(`/payments/${ORDER_ID}/initiate`);
  expect(res.status()).toBe(401);
});

test('GET /payments/:id/status — 401 without Bearer token', async ({ request }) => {
  const res = await request.get(`/payments/${ORDER_ID}/status`);
  expect(res.status()).toBe(401);
});

// ── 2. initiatePayment ────────────────────────────────────────────────────────

test('POST /payments/:id/initiate — 404 for unknown order', async ({ request }) => {
  const res = await request.post('/payments/no-such-order/initiate', {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  });
  expect(res.status()).toBe(404);
});

test('POST /payments/:id/initiate — 200 with paymeUrl + clickUrl', async ({ request }) => {
  const res = await request.post(`/payments/${ORDER_ID}/initiate`, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  });
  expect(res.ok()).toBeTruthy();

  const body = await res.json() as Record<string, unknown>;
  expect(typeof body['paymeUrl']).toBe('string');
  expect(body['paymeUrl'] as string).toContain('paycom.uz');
  expect(typeof body['clickUrl']).toBe('string');
  expect(body['clickUrl'] as string).toContain('click.uz');

  const payment = body['payment'] as Record<string, unknown>;
  expect(payment['status']).toBe('pending');
  expect(payment['amount']).toBe(ORDER_PRICE);
  expect(payment['orderId']).toBe(ORDER_ID);
});

// ── 3. getPaymentStatus ───────────────────────────────────────────────────────

test('GET /payments/:id/status — returns pending payment', async ({ request }) => {
  const res = await request.get(`/payments/${ORDER_ID}/status`, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  });
  expect(res.ok()).toBeTruthy();

  const body = await res.json() as Record<string, unknown>;
  expect(body['orderId']).toBe(ORDER_ID);
  expect(body['status']).toBe('pending');
});

// ── 4. Payme JSON-RPC webhook ─────────────────────────────────────────────────

test('POST /payments/payme — 401 with wrong Basic auth', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: 'Basic d3Jvbmc=' },
    data: { method: 'CheckPerformTransaction', params: {}, id: 1 },
  });
  expect(res.status()).toBe(401);
});

test('POST /payments/payme CheckPerformTransaction — error -32001 (unknown order)', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'CheckPerformTransaction',
      params: { amount: ORDER_PRICE * 100, account: { order_id: 'UNKNOWN' } },
      id: 2,
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json() as Record<string, unknown>;
  expect((body['error'] as Record<string, unknown>)['code']).toBe(-32001);
});

test('POST /payments/payme CheckPerformTransaction — allow: true (valid order)', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'CheckPerformTransaction',
      params: { amount: ORDER_PRICE * 100, account: { order_id: ORDER_ID } },
      id: 3,
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json() as Record<string, unknown>;
  expect((body['result'] as Record<string, unknown>)['allow']).toBe(true);
});

test('POST /payments/payme CreateTransaction — creates, state=1', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'CreateTransaction',
      params: { id: 'payme_tx_1', time: Date.now(), amount: ORDER_PRICE * 100, account: { order_id: ORDER_ID } },
      id: 4,
    },
  });
  expect(res.ok()).toBeTruthy();
  const result = (await res.json() as Record<string, unknown>)['result'] as Record<string, unknown>;
  expect(result['state']).toBe(1);
  expect(typeof result['transaction']).toBe('string');
});

test('POST /payments/payme CancelTransaction — cancels pending tx, state=-1', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'CancelTransaction',
      params: { id: 'payme_tx_1', reason: 1 },
      id: 5,
    },
  });
  expect(res.ok()).toBeTruthy();
  const result = (await res.json() as Record<string, unknown>)['result'] as Record<string, unknown>;
  expect(result['state']).toBe(-1);
  expect(result['cancel_time']).toBeTruthy();
});

test('POST /payments/payme CreateTransaction — new tx (payme_tx_2), state=1', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'CreateTransaction',
      params: { id: 'payme_tx_2', time: Date.now(), amount: ORDER_PRICE * 100, account: { order_id: ORDER_ID } },
      id: 6,
    },
  });
  expect(res.ok()).toBeTruthy();
  const result = (await res.json() as Record<string, unknown>)['result'] as Record<string, unknown>;
  expect(result['state']).toBe(1);
});

test('POST /payments/payme PerformTransaction — state=2 (paid)', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'PerformTransaction',
      params: { id: 'payme_tx_2' },
      id: 7,
    },
  });
  expect(res.ok()).toBeTruthy();
  const result = (await res.json() as Record<string, unknown>)['result'] as Record<string, unknown>;
  expect(result['state']).toBe(2);
  expect(result['perform_time']).toBeGreaterThan(0);
});

test('POST /payments/payme CheckTransaction — state=2 after perform', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'CheckTransaction',
      params: { id: 'payme_tx_2' },
      id: 8,
    },
  });
  expect(res.ok()).toBeTruthy();
  const result = (await res.json() as Record<string, unknown>)['result'] as Record<string, unknown>;
  expect(result['state']).toBe(2);
});

test('POST /payments/payme CancelTransaction — error -32300 (cannot cancel performed)', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'CancelTransaction',
      params: { id: 'payme_tx_2', reason: 1 },
      id: 9,
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json() as Record<string, unknown>;
  expect((body['error'] as Record<string, unknown>)['code']).toBe(-32300);
});

test('POST /payments/payme GetStatement — returns transactions array', async ({ request }) => {
  const res = await request.post('/payments/payme', {
    headers: { Authorization: paymeAuth(), 'Content-Type': 'application/json' },
    data: {
      method: 'GetStatement',
      params: { from: Date.now() - 60_000, to: Date.now() + 60_000 },
      id: 10,
    },
  });
  expect(res.ok()).toBeTruthy();
  const result = (await res.json() as Record<string, unknown>)['result'] as Record<string, unknown>;
  expect(Array.isArray(result['transactions'])).toBe(true);
  expect((result['transactions'] as unknown[]).length).toBeGreaterThan(0);
});

// ── 5. Click webhooks ─────────────────────────────────────────────────────────

test('POST /payments/click/prepare — error -1 (wrong signature)', async ({ request }) => {
  const res = await request.post('/payments/click/prepare', {
    data: {
      click_trans_id: CLICK_TX_ID,
      service_id: CLICK_SERVICE_ID,
      click_paydoc_id: '111',
      merchant_trans_id: ORDER_ID,
      amount: String(ORDER_PRICE),
      action: '0',
      sign_time: SIGN_TIME,
      sign_string: 'bad_signature',
    },
  });
  expect(res.ok()).toBeTruthy();
  expect(((await res.json()) as Record<string, unknown>)['error']).toBe(-1);
});

test('POST /payments/click/prepare — creates payment (error: 0)', async ({ request }) => {
  const sign = md5(CLICK_TX_ID, CLICK_SERVICE_ID, CLICK_SECRET, ORDER_ID, String(ORDER_PRICE), '0', SIGN_TIME);

  const res = await request.post('/payments/click/prepare', {
    data: {
      click_trans_id: CLICK_TX_ID,
      service_id: CLICK_SERVICE_ID,
      click_paydoc_id: '111',
      merchant_trans_id: ORDER_ID,
      amount: String(ORDER_PRICE),
      action: '0',
      sign_time: SIGN_TIME,
      sign_string: sign,
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json() as Record<string, unknown>;
  expect(body['error']).toBe(0);
  expect(typeof body['merchant_prepare_id']).toBe('string');
  clickPrepareId = body['merchant_prepare_id'] as string;
});

test('POST /payments/click/complete — error -1 (wrong signature)', async ({ request }) => {
  const res = await request.post('/payments/click/complete', {
    data: {
      click_trans_id: CLICK_TX_ID,
      service_id: CLICK_SERVICE_ID,
      click_paydoc_id: '111',
      merchant_trans_id: ORDER_ID,
      merchant_prepare_id: clickPrepareId,
      amount: String(ORDER_PRICE),
      action: '1',
      sign_time: SIGN_TIME,
      sign_string: 'bad_signature',
      error: '0',
    },
  });
  expect(res.ok()).toBeTruthy();
  expect(((await res.json()) as Record<string, unknown>)['error']).toBe(-1);
});

test('POST /payments/click/complete — marks payment paid (error: 0)', async ({ request }) => {
  const sign = md5(
    CLICK_TX_ID, CLICK_SERVICE_ID, CLICK_SECRET,
    ORDER_ID, clickPrepareId, String(ORDER_PRICE),
    '1', SIGN_TIME,
  );

  const res = await request.post('/payments/click/complete', {
    data: {
      click_trans_id: CLICK_TX_ID,
      service_id: CLICK_SERVICE_ID,
      click_paydoc_id: '111',
      merchant_trans_id: ORDER_ID,
      merchant_prepare_id: clickPrepareId,
      amount: String(ORDER_PRICE),
      action: '1',
      sign_time: SIGN_TIME,
      sign_string: sign,
      error: '0',
    },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json() as Record<string, unknown>;
  expect(body['error']).toBe(0);
  expect(body['click_trans_id']).toBe(CLICK_TX_ID);
});

// ── 6. Verify final status after full Payme flow ──────────────────────────────

test('GET /payments/:id/status — order has payments after full flow', async ({ request }) => {
  const res = await request.get(`/payments/${ORDER_ID}/status`, {
    headers: { Authorization: `Bearer ${JWT_TOKEN}` },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json() as Record<string, unknown>;
  expect(body['orderId']).toBe(ORDER_ID);
});
