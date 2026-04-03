import { test, expect } from '@playwright/test';
import { registerClient, authHeaders } from '../helpers/auth';

test.describe('NPS API', () => {
  let clientToken: string;

  test.beforeAll(async ({ request }) => {
    const { token } = await registerClient(request);
    clientToken = token;
  });

  test('GET /nps/check returns shouldShow boolean', async ({ request }) => {
    const res = await request.get('/nps/check', {
      headers: authHeaders(clientToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('shouldShow');
    expect(typeof data.shouldShow).toBe('boolean');
  });

  test('POST /nps/submit accepts valid score', async ({ request }) => {
    const res = await request.post('/nps/submit', {
      headers: authHeaders(clientToken),
      data: { score: 9, comment: 'Great service!' },
    });
    expect(res.status()).toBe(201);
    const data = await res.json();
    expect(data).toHaveProperty('id');
    expect(data.score).toBe(9);
  });

  test('POST /nps/submit rejects duplicate in same month', async ({ request }) => {
    const res = await request.post('/nps/submit', {
      headers: authHeaders(clientToken),
      data: { score: 8 },
    });
    expect(res.status()).toBe(400);
  });

  test('POST /nps/submit validates score range', async ({ request }) => {
    const { token } = await registerClient(request);
    const res = await request.post('/nps/submit', {
      headers: authHeaders(token),
      data: { score: 11 },
    });
    expect(res.status()).toBe(400);
  });

  test('GET /nps/check returns 401 without token', async ({ request }) => {
    const res = await request.get('/nps/check');
    expect(res.status()).toBe(401);
  });
});
