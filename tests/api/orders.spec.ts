import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * Orders tests — full create order flow.
 * Requires a registered client and at least one service in the catalog.
 */

const timestamp = Date.now();
const CLIENT_PHONE = `+99893${String(timestamp).slice(-7)}`;
const PASSWORD = 'Test1234!';

test.describe('Orders Flow', () => {
  let clientToken: string;
  let serviceId: string;

  test.beforeAll(async ({ playwright }) => {
    const request: APIRequestContext = await playwright.request.newContext({
      baseURL: process.env.API_URL || 'http://localhost:3000',
    });

    // Register client
    const registerRes = await request.post('/auth/register', {
      data: { phone: CLIENT_PHONE, password: PASSWORD },
    });
    // If already registered (409), fall through to login
    if (registerRes.status() !== 201 && registerRes.status() !== 409) {
      throw new Error(`Registration failed: ${registerRes.status()}`);
    }

    // Login to get token
    const loginRes = await request.post('/auth/login', {
      data: { phone: CLIENT_PHONE, password: PASSWORD },
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    clientToken = loginBody.access_token;

    // Get first available service
    const servicesRes = await request.get('/services');
    expect(servicesRes.status()).toBe(200);
    const services = await servicesRes.json();
    expect(services.length).toBeGreaterThan(0);
    serviceId = services[0].id;

    await request.dispose();
  });

  test('POST /orders — creates order with CREATED status', async ({ request }) => {
    const res = await request.post('/orders', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: {
        serviceId,
        discountAmount: 0,
        location: {
          house: 'ул. Навои 15',
          floor: '3',
          apartment: '12',
          phone: CLIENT_PHONE,
          latitude: 41.2995,
          longitude: 69.2401,
        },
      },
    });

    expect(res.status()).toBe(201);

    const order = await res.json();
    expect(order).toHaveProperty('id');
    expect(order.status).toBe('CREATED');
    expect(order.serviceId).toBe(serviceId);
    expect(typeof order.priceAmount).toBe('number');
    expect(order.priceAmount).toBeGreaterThan(0);
  });

  test('POST /orders — platformFee is 10% of netPrice', async ({ request }) => {
    const res = await request.post('/orders', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: {
        serviceId,
        discountAmount: 5000,
        location: {
          house: 'ул. Навои 15',
          floor: '1',
          apartment: '1',
          phone: CLIENT_PHONE,
          latitude: 41.2995,
          longitude: 69.2401,
        },
      },
    });

    expect(res.status()).toBe(201);

    const order = await res.json();
    // platformFee is 10% of netPrice (price + urgentFee - discount)
    const netPrice = Number(order.priceAmount) + Number(order.urgentFee ?? 0) - Number(order.discountAmount ?? 0);
    const expectedFee = Math.round(netPrice * 0.1);
    expect(Number(order.platformFee)).toBe(expectedFee);
  });

  test('GET /orders — returns list with pagination', async ({ request }) => {
    const res = await request.get('/orders?page=1&limit=20', {
      headers: { Authorization: `Bearer ${clientToken}` },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBeTruthy();
  });

  test('GET /orders/:id — returns order details', async ({ request }) => {
    // Create an order first
    const createRes = await request.post('/orders', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: {
        serviceId,
        discountAmount: 0,
        location: {
          house: 'ул. Навои 15',
          floor: '2',
          apartment: '5',
          phone: CLIENT_PHONE,
          latitude: 41.2995,
          longitude: 69.2401,
        },
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Fetch the order
    const res = await request.get(`/orders/${created.id}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });

    expect(res.status()).toBe(200);
    const order = await res.json();
    expect(order.id).toBe(created.id);
    // Dispatch may auto-cancel if no medics are available
    expect(['CREATED', 'CANCELED']).toContain(order.status);
  });

  test('POST /orders/:id/cancel — cancels a CREATED order', async ({ request }) => {
    // Create an order
    const createRes = await request.post('/orders', {
      headers: { Authorization: `Bearer ${clientToken}` },
      data: {
        serviceId,
        discountAmount: 0,
        location: {
          house: 'ул. Навои 15',
          floor: '4',
          apartment: '8',
          phone: CLIENT_PHONE,
          latitude: 41.2995,
          longitude: 69.2401,
        },
      },
    });
    expect(createRes.status()).toBe(201);
    const created = await createRes.json();

    // Cancel it (may already be canceled by dispatch if no medics)
    const cancelRes = await request.post(`/orders/${created.id}/cancel`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });

    // 200 = canceled, 400 = already canceled by dispatch, 409 = conflict
    expect([200, 400, 409]).toContain(cancelRes.status());

    // Verify status changed
    const getRes = await request.get(`/orders/${created.id}`, {
      headers: { Authorization: `Bearer ${clientToken}` },
    });
    const order = await getRes.json();
    expect(order.status).toBe('CANCELED');
  });

  test('POST /orders — returns 401 without token', async ({ request }) => {
    const res = await request.post('/orders', {
      data: { serviceId, location: {} },
    });
    expect(res.status()).toBe(401);
  });
});
