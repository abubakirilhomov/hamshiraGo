import { test, expect } from '@playwright/test';
import { registerClient, authHeaders } from '../helpers/auth';

test.describe('Consultations API', () => {
  let clientToken: string;

  test.beforeAll(async ({ request }) => {
    const { token } = await registerClient(request);
    clientToken = token;
  });

  test('GET /consultations/doctors returns doctors list', async ({ request }) => {
    const res = await request.get('/consultations/doctors');
    expect(res.status()).toBe(200);
    const doctors = await res.json();
    expect(Array.isArray(doctors)).toBe(true);
    if (doctors.length > 0) {
      expect(doctors[0]).toHaveProperty('id');
      expect(doctors[0]).toHaveProperty('name');
      expect(doctors[0]).toHaveProperty('specialization');
      expect(doctors[0]).toHaveProperty('pricePerConsultation');
    }
  });

  test('GET /consultations/doctors?specialization= filters by spec', async ({ request }) => {
    const res = await request.get('/consultations/doctors?specialization=therapist');
    expect(res.status()).toBe(200);
    const doctors = await res.json();
    expect(Array.isArray(doctors)).toBe(true);
  });

  test('GET /consultations/my returns paginated list', async ({ request }) => {
    const res = await request.get('/consultations/my?page=1&limit=10', {
      headers: authHeaders(clientToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
  });

  test('POST /consultations/ai-chat returns AI response', async ({ request }) => {
    const res = await request.post('/consultations/ai-chat', {
      headers: authHeaders(clientToken),
      data: {
        messages: [{ role: 'user', content: 'У меня болит голова' }],
      },
    });
    // 200 if API key configured, or graceful error
    expect([200, 201]).toContain(res.status());
    const data = await res.json();
    expect(data).toHaveProperty('reply');
  });

  test('GET /consultations/prescriptions/my returns prescriptions', async ({ request }) => {
    const res = await request.get('/consultations/prescriptions/my?page=1&limit=10', {
      headers: authHeaders(clientToken),
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('data');
    expect(data).toHaveProperty('total');
  });
});
