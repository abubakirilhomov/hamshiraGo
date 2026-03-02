import { test, expect } from '@playwright/test';

/**
 * Health check — verify the API is alive and services catalog is accessible.
 * GET /services — public endpoint, no auth required.
 */
test.describe('Health Check', () => {
  test('GET /services returns 200 and a non-empty array', async ({ request }) => {
    const res = await request.get('/services');

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(Array.isArray(body)).toBeTruthy();
    expect(body.length).toBeGreaterThan(0);

    // Each service must have id and title
    const service = body[0];
    expect(service).toHaveProperty('id');
    expect(service).toHaveProperty('title');
    expect(typeof service.id).toBe('string');
    expect(typeof service.title).toBe('string');
  });

  test('GET /services returns services with priceAmount', async ({ request }) => {
    const res = await request.get('/services');
    const services = await res.json();

    for (const service of services) {
      expect(service).toHaveProperty('priceAmount');
      expect(typeof service.priceAmount).toBe('number');
      expect(service.priceAmount).toBeGreaterThan(0);
    }
  });
});
