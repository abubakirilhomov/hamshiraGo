import { test, expect } from '@playwright/test';
import { registerMedic, authHeaders } from '../helpers/auth';

test.describe('Medics API', () => {
  let medicToken: string;

  test.beforeAll(async ({ request }) => {
    const { token } = await registerMedic(request);
    medicToken = token;
  });

  test('GET /medics/me returns medic profile', async ({ request }) => {
    const res = await request.get('/medics/me', {
      headers: authHeaders(medicToken),
    });
    expect(res.status()).toBe(200);
    const medic = await res.json();
    expect(medic).toHaveProperty('id');
    expect(medic).toHaveProperty('name');
    expect(medic).toHaveProperty('verificationStatus', 'PENDING');
  });

  test('GET /medics/me returns 401 without token', async ({ request }) => {
    const res = await request.get('/medics/me');
    expect(res.status()).toBe(401);
  });

  test('PATCH /medics/location updates location', async ({ request }) => {
    const res = await request.patch('/medics/location', {
      headers: authHeaders(medicToken),
      data: { latitude: 41.2995, longitude: 69.2401, isOnline: true },
    });
    expect([200, 201]).toContain(res.status());
  });
});
