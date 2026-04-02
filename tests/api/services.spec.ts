import { test, expect } from '@playwright/test';

test.describe('Services API', () => {
  test('GET /services returns active services list', async ({ request }) => {
    const res = await request.get('/services');
    expect(res.status()).toBe(200);
    const services = await res.json();
    expect(Array.isArray(services)).toBe(true);
    if (services.length > 0) {
      expect(services[0]).toHaveProperty('id');
      expect(services[0]).toHaveProperty('title');
      expect(services[0]).toHaveProperty('price');
      expect(services[0]).toHaveProperty('isActive', true);
    }
  });

  test('GET /services/:id returns single service', async ({ request }) => {
    const listRes = await request.get('/services');
    const services = await listRes.json();
    if (services.length === 0) return test.skip();

    const res = await request.get(`/services/${services[0].id}`);
    expect(res.status()).toBe(200);
    const service = await res.json();
    expect(service.id).toBe(services[0].id);
  });

  test('GET /services/:id returns 404 for invalid id', async ({ request }) => {
    const res = await request.get('/services/00000000-0000-0000-0000-000000000000');
    expect(res.status()).toBe(404);
  });
});
