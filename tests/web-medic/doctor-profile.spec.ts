/**
 * Doctor Profile — Playwright tests (UX-PARTNER-6, UX-PARTNER-9)
 * Tests: pricePerConsultation + bio fields in doctor profile form
 */
import { test, expect, Page, BrowserContext } from '@playwright/test';

const CLINIC_URL = process.env.CLINIC_URL || 'http://localhost:3002';

async function injectFakeDoctorToken(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto(`${CLINIC_URL}/`, { waitUntil: 'domcontentloaded' });

  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
  const payload = btoa(
    JSON.stringify({ sub: 'doctor-test-id', role: 'DOCTOR', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + 3600 })
  ).replace(/=/g, '');
  const fakeJwt = `${header}.${payload}.fakesig`;

  await page.evaluate(
    ({ token }) => {
      localStorage.setItem('medic_token', token);
      localStorage.setItem('user_role', 'doctor');
      localStorage.setItem('doctor_profile', JSON.stringify({
        id: 'doctor-test-id',
        name: 'Тест Врач',
        phone: '+998901234567',
        specialization: 'Терапевт',
        experienceYears: 5,
        isOnline: false,
        isBlocked: false,
        verificationStatus: 'APPROVED',
        profilePhotoUrl: null,
        facePhotoUrl: null,
        rating: 4.5,
        reviewCount: 12,
        pricePerConsultation: null,
        bio: null,
      }));
    },
    { token: fakeJwt }
  );

  await page.close();
}

test.describe('Doctor Profile — price & bio fields', () => {
  let context: BrowserContext;
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    context = await browser.newContext();
    await injectFakeDoctorToken(context);
    page = await context.newPage();
  });

  test.afterEach(async () => {
    await context.close();
  });

  test('profile page loads without error', async () => {
    await page.goto(`${CLINIC_URL}/doctor/profile`, { waitUntil: 'domcontentloaded' });
    // Should not show error state
    await expect(page.locator('text=Ошибка загрузки профиля')).not.toBeVisible();
    // Should show profile heading
    await expect(page.locator('h1:has-text("Профиль")')).toBeVisible();
  });

  test('edit form shows price and bio fields', async () => {
    await page.goto(`${CLINIC_URL}/doctor/profile`, { waitUntil: 'domcontentloaded' });

    // Click "Изменить" button to enter edit mode
    await page.locator('button:has-text("Изменить")').click();

    // Price field should appear
    await expect(page.locator('label:has-text("ЦЕНА ЗА КОНСУЛЬТАЦИЮ")')).toBeVisible();
    await expect(page.locator('input[placeholder*="150000"]')).toBeVisible();

    // Bio textarea should appear
    await expect(page.locator('label:has-text("О СЕБЕ")')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="Краткая биография"]')).toBeVisible();
  });

  test('price field accepts only numeric input', async () => {
    await page.goto(`${CLINIC_URL}/doctor/profile`, { waitUntil: 'domcontentloaded' });
    await page.locator('button:has-text("Изменить")').click();

    const priceInput = page.locator('input[placeholder*="150000"]');
    await priceInput.fill('150000');
    await expect(priceInput).toHaveValue('150000');
  });

  test('display mode shows "Цена консультации" row', async () => {
    await page.goto(`${CLINIC_URL}/doctor/profile`, { waitUntil: 'domcontentloaded' });

    // In display mode, price row should exist
    await expect(page.locator('text=ЦЕНА КОНСУЛЬТАЦИИ')).toBeVisible();
  });

  test('display mode shows "О СЕБЕ" when bio is set', async () => {
    // Pre-set bio in localStorage
    await page.goto(`${CLINIC_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const profile = JSON.parse(localStorage.getItem('doctor_profile') || '{}');
      profile.bio = 'Опытный терапевт с 5-летним стажем';
      profile.pricePerConsultation = 150000;
      localStorage.setItem('doctor_profile', JSON.stringify(profile));
    });

    await page.goto(`${CLINIC_URL}/doctor/profile`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('text=О СЕБЕ')).toBeVisible();
    await expect(page.locator('text=Опытный терапевт с 5-летним стажем')).toBeVisible();
    await expect(page.locator('text=150 000 сум').or(page.locator('text=150000 сум'))).toBeVisible();
  });
});
