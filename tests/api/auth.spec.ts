import { test, expect } from '@playwright/test';

/**
 * Auth tests — registration and login for both client and medic.
 * Uses unique phone numbers based on timestamp to avoid conflicts.
 */

const timestamp = Date.now();
const CLIENT_PHONE = `+99890${String(timestamp).slice(-7)}`;
const MEDIC_PHONE = `+99891${String(timestamp).slice(-7)}`;
const PASSWORD = 'Test1234!';

test.describe('Client Auth', () => {
  test('POST /auth/register — creates new client and returns token', async ({ request }) => {
    const res = await request.post('/auth/register', {
      data: { phone: CLIENT_PHONE, password: PASSWORD },
    });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty('access_token');
    expect(typeof body.access_token).toBe('string');
    expect(body.access_token.length).toBeGreaterThan(0);

    expect(body).toHaveProperty('user');
    expect(body.user.phone).toBe(CLIENT_PHONE);
    expect(body.user).toHaveProperty('id');
  });

  test('POST /auth/login — returns token for existing client', async ({ request }) => {
    // Ensure client exists
    await request.post('/auth/register', {
      data: { phone: CLIENT_PHONE, password: PASSWORD },
    });

    const res = await request.post('/auth/login', {
      data: { phone: CLIENT_PHONE, password: PASSWORD },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('access_token');
    expect(body.user.phone).toBe(CLIENT_PHONE);
  });

  test('POST /auth/login — returns 401 for wrong password', async ({ request }) => {
    const res = await request.post('/auth/login', {
      data: { phone: CLIENT_PHONE, password: 'wrongpassword' },
    });

    expect(res.status()).toBe(401);
  });

  test('POST /auth/register — returns 400 for invalid phone format', async ({ request }) => {
    const res = await request.post('/auth/register', {
      data: { phone: '12345', password: PASSWORD },
    });

    expect(res.status()).toBe(400);
  });
});

test.describe('Medic Auth', () => {
  test('POST /medics/register — creates new medic and returns token', async ({ request }) => {
    const res = await request.post('/medics/register', {
      data: {
        phone: MEDIC_PHONE,
        password: PASSWORD,
        name: 'Тест Медик',
        experienceYears: 3,
      },
    });

    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty('access_token');
    expect(typeof body.access_token).toBe('string');

    expect(body).toHaveProperty('medic');
    expect(body.medic.phone).toBe(MEDIC_PHONE);
    expect(body.medic.name).toBe('Тест Медик');
    expect(body.medic.verificationStatus).toBe('PENDING');
    expect(body.medic.balance).toBe(0);
    expect(body.medic.isOnline).toBe(false);
  });

  test('POST /medics/login — returns token for existing medic', async ({ request }) => {
    // Ensure medic exists
    await request.post('/medics/register', {
      data: {
        phone: MEDIC_PHONE,
        password: PASSWORD,
        name: 'Тест Медик',
        experienceYears: 3,
      },
    });

    const res = await request.post('/medics/login', {
      data: { phone: MEDIC_PHONE, password: PASSWORD },
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('access_token');
    expect(body.medic.phone).toBe(MEDIC_PHONE);
  });

  test('POST /medics/login — returns 401 for wrong password', async ({ request }) => {
    const res = await request.post('/medics/login', {
      data: { phone: MEDIC_PHONE, password: 'wrongpassword' },
    });

    expect(res.status()).toBe(401);
  });
});

test.describe('Protected endpoints require auth', () => {
  test('GET /orders — returns 401 without token', async ({ request }) => {
    const res = await request.get('/orders');
    expect(res.status()).toBe(401);
  });

  test('GET /medics/me — returns 401 without token', async ({ request }) => {
    const res = await request.get('/medics/me');
    expect(res.status()).toBe(401);
  });
});
