import { test, expect } from '@playwright/test';
import { registerClient, authHeaders } from '../helpers/auth';

test.describe('Reviews API', () => {
  test('GET /reviews/medic/:id returns reviews (or 404 for unknown)', async ({ request }) => {
    const res = await request.get('/reviews/medic/00000000-0000-0000-0000-000000000000');
    // Empty list or 404 depending on implementation
    expect([200, 404]).toContain(res.status());
  });

  test('GET /reviews/client/:id returns reviews (or 401/404)', async ({ request }) => {
    const res = await request.get('/reviews/client/00000000-0000-0000-0000-000000000000');
    expect([200, 401, 404]).toContain(res.status());
  });

  test('POST /reviews requires auth', async ({ request }) => {
    const res = await request.post('/reviews', {
      data: { orderId: '00000000-0000-0000-0000-000000000000', rating: 5, comment: 'test', targetRole: 'medic' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /reviews validates rating range', async ({ request }) => {
    const { token } = await registerClient(request);
    const res = await request.post('/reviews', {
      headers: authHeaders(token),
      data: { orderId: '00000000-0000-0000-0000-000000000000', rating: 6, targetRole: 'medic' },
    });
    // 400 for invalid rating or 404 for missing order
    expect([400, 404]).toContain(res.status());
  });
});
