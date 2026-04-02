import { test, expect } from '@playwright/test';
import { registerClient, authHeaders } from '../helpers/auth';

test.describe('Loyalty API', () => {
  let clientToken: string;

  test.beforeAll(async ({ request }) => {
    const { token } = await registerClient(request);
    clientToken = token;
  });

  test('GET /loyalty/my returns balance and tier', async ({ request }) => {
    const res = await request.get('/loyalty/my', {
      headers: authHeaders(clientToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('points');
    expect(data).toHaveProperty('tier');
  });

  test('GET /loyalty/history returns paginated history', async ({ request }) => {
    const res = await request.get('/loyalty/history?page=1&limit=10', {
      headers: authHeaders(clientToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('page', 1);
  });

  test('POST /loyalty/redeem fails with 0 points', async ({ request }) => {
    const res = await request.post('/loyalty/redeem', {
      headers: authHeaders(clientToken),
      data: { points: 100 },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /loyalty/my returns 401 without token', async ({ request }) => {
    const res = await request.get('/loyalty/my');
    expect(res.status()).toBe(401);
  });
});
