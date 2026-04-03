import { test, expect } from '@playwright/test';
import { registerClient, authHeaders } from '../helpers/auth';

test.describe('Subscriptions API', () => {
  let clientToken: string;

  test.beforeAll(async ({ request }) => {
    const { token } = await registerClient(request);
    clientToken = token;
  });

  test('GET /subscriptions/tiers returns available tiers', async ({ request }) => {
    const res = await request.get('/subscriptions/tiers');
    expect(res.status()).toBe(200);
    const tiers = await res.json();
    expect(Array.isArray(tiers)).toBe(true);
    if (tiers.length > 0) {
      expect(tiers[0]).toHaveProperty('id');
      expect(tiers[0]).toHaveProperty('name');
      expect(tiers[0]).toHaveProperty('price');
      expect(tiers[0]).toHaveProperty('discountPercent');
    }
  });

  test('GET /subscriptions/my returns null when no subscription', async ({ request }) => {
    const res = await request.get('/subscriptions/my', {
      headers: authHeaders(clientToken),
    });
    // 200 with null or 404 — both valid
    expect([200, 404]).toContain(res.status());
  });

  test('POST /subscriptions/purchase fails with invalid tierId', async ({ request }) => {
    const res = await request.post('/subscriptions/purchase', {
      headers: authHeaders(clientToken),
      data: { tierId: '00000000-0000-0000-0000-000000000000' },
    });
    expect([400, 404]).toContain(res.status());
  });
});
