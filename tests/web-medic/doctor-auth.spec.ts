/**
 * Doctor Auth — Playwright tests
 * Tests the doctor login redirect bug fix:
 * - Already logged-in doctor should go to /doctor/consultations, not /
 * - Visiting / as a doctor should redirect to /doctor/consultations
 */
import { test, expect, BrowserContext, Page } from '@playwright/test';

const CLINIC_URL = process.env.CLINIC_URL || 'http://localhost:3002';

async function injectDoctorSession(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto(`${CLINIC_URL}/`, { waitUntil: 'domcontentloaded' });

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    sub: 'doc-id-1', role: 'DOCTOR',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).replace(/=/g, '');
  const fakeJwt = `${header}.${payload}.fakesig`;

  await page.evaluate(({ token }) => {
    localStorage.setItem('medic_token', token);
    localStorage.setItem('user_role', 'doctor');
    localStorage.setItem('doctor', JSON.stringify({
      id: 'doc-id-1', name: 'Test Doctor', phone: '+998901234567',
      specialization: 'Therapist', experienceYears: 3,
      isOnline: false, isBlocked: false, verificationStatus: 'APPROVED',
      profilePhotoUrl: null, facePhotoUrl: null, rating: null, reviewCount: 0,
      pricePerConsultation: null, bio: null,
    }));
  }, { token: fakeJwt });

  await page.close();
}

async function injectMedicSession(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto(`${CLINIC_URL}/`, { waitUntil: 'domcontentloaded' });

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(JSON.stringify({
    sub: 'medic-id-1', role: 'MEDIC',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  })).replace(/=/g, '');

  await page.evaluate(({ token }) => {
    localStorage.setItem('medic_token', token);
    localStorage.setItem('user_role', 'medic');
  }, { token: `${header}.${payload}.fakesig` });

  await page.close();
}

test.describe('Doctor auth redirect', () => {
  test('auth page redirects logged-in doctor to /doctor/consultations', async ({ browser }) => {
    const context = await browser.newContext();
    await injectDoctorSession(context);

    const page = await context.newPage();
    await page.goto(`${CLINIC_URL}/auth`, { waitUntil: 'domcontentloaded' });

    // Should redirect to /doctor/consultations, not /
    await page.waitForURL(/\/doctor\/consultations/, { timeout: 5000 }).catch(() => {});
    expect(page.url()).toContain('/doctor/consultations');

    await context.close();
  });

  test('root page (/) redirects doctor to /doctor/consultations', async ({ browser }) => {
    const context = await browser.newContext();
    await injectDoctorSession(context);

    const page = await context.newPage();
    await page.goto(`${CLINIC_URL}/`, { waitUntil: 'domcontentloaded' });

    // Should redirect to /doctor/consultations
    await page.waitForURL(/\/doctor\/consultations/, { timeout: 5000 }).catch(() => {});
    expect(page.url()).toContain('/doctor/consultations');

    await context.close();
  });

  test('auth page redirects logged-in medic to / (not doctor route)', async ({ browser }) => {
    const context = await browser.newContext();
    await injectMedicSession(context);

    const page = await context.newPage();
    await page.goto(`${CLINIC_URL}/auth`, { waitUntil: 'domcontentloaded' });

    // Medic should NOT go to /doctor/consultations
    await page.waitForURL(/^(?!.*\/doctor\/).*$/, { timeout: 5000 }).catch(() => {});
    expect(page.url()).not.toContain('/doctor/');

    await context.close();
  });

  test('auth page shows both medic and doctor role tabs', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(`${CLINIC_URL}/auth`, { waitUntil: 'domcontentloaded' });

    // Should show role selector
    await expect(page.locator('button:has-text("Медик"), text=Медик').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button:has-text("Врач"), text=Врач').first()).toBeVisible({ timeout: 5000 });

    await context.close();
  });
});
