/**
 * Clinic Portal — Production smoke tests
 * Target: https://medic.hamshirago.uz
 *
 * Run with:
 *   CLINIC_URL=https://medic.hamshirago.uz npx playwright test web-medic/clinic-production.spec.ts --reporter=list
 */
import { test, expect, Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const CLINIC_URL = process.env.CLINIC_URL || 'https://medic.hamshirago.uz';
const SCREENSHOTS_DIR = path.resolve(__dirname, '../../test-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function saveScreenshot(page: Page, name: string) {
  const filePath = path.join(SCREENSHOTS_DIR, `prod-${name}.png`);
  await page.screenshot({ path: filePath, fullPage: true });
  console.log(`Screenshot saved: ${filePath}`);
}

// ─── 1. Root URL returns 200 ───────────────────────────────────────────────────

test.describe('Production — Root URL', () => {
  test('GET / returns 200', async ({ request }) => {
    const res = await request.get(CLINIC_URL + '/');
    expect(res.status()).toBe(200);
  });

  test('/ loads in browser without crashing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(CLINIC_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    expect(response?.status()).toBe(200);

    await saveScreenshot(page, '01-root');
    expect(errors).toHaveLength(0);
  });
});

// ─── 2. /clinic/auth — login form ─────────────────────────────────────────────

test.describe('Production — /clinic/auth login form', () => {
  const consoleErrors: string[] = [];

  test.beforeEach(async ({ context, page }) => {
    consoleErrors.length = 0;
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push(`[pageerror] ${err.message}`));

    // Inject a structurally valid (fake) JWT so the clinic layout
    // renders children instead of a spinner / redirect loop.
    const setupPage = await context.newPage();
    await setupPage.goto(CLINIC_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });

    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64').replace(/=/g, '');
    const payload = Buffer.from(
      JSON.stringify({
        sub: 'test-id',
        role: 'CEO',
        phone: '+998901234567',
        companyId: 'test-co',
        exp: Math.floor(Date.now() / 1000) + 3600,
      })
    ).toString('base64').replace(/=/g, '');
    const fakeToken = `${header}.${payload}.fake-signature`;

    await setupPage.evaluate(
      ([token, user]) => {
        localStorage.setItem('clinic_token', token);
        localStorage.setItem('clinic_user', user);
      },
      [fakeToken, JSON.stringify({ id: 'test-id', name: 'Test CEO', role: 'CEO', companyId: 'test-co' })]
    );
    await setupPage.close();
  });

  test('phone input (tel) is visible on /clinic/auth', async ({ page }) => {
    await page.goto(CLINIC_URL + '/clinic/auth', { waitUntil: 'networkidle', timeout: 30000 });
    await saveScreenshot(page, '02-clinic-auth');

    const phoneInput = page.locator('input[type="tel"]');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
  });

  test('password input is visible on /clinic/auth', async ({ page }) => {
    await page.goto(CLINIC_URL + '/clinic/auth', { waitUntil: 'networkidle', timeout: 30000 });

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test('submit/login button is visible on /clinic/auth', async ({ page }) => {
    await page.goto(CLINIC_URL + '/clinic/auth', { waitUntil: 'networkidle', timeout: 30000 });

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
  });

  test('no hydration errors on /clinic/auth', async ({ page }) => {
    await page.goto(CLINIC_URL + '/clinic/auth', { waitUntil: 'networkidle', timeout: 30000 });

    const hydrationErrors = consoleErrors.filter(
      (e) =>
        e.toLowerCase().includes('hydration') ||
        e.includes('did not match') ||
        e.includes('server rendered') ||
        e.includes('Text content does not match')
    );

    if (hydrationErrors.length > 0) {
      console.log('Hydration errors found:\n' + hydrationErrors.join('\n'));
    }
    expect(hydrationErrors, `Hydration errors:\n${hydrationErrors.join('\n')}`).toHaveLength(0);
  });

  test('no critical console errors on /clinic/auth', async ({ page }) => {
    await page.goto(CLINIC_URL + '/clinic/auth', { waitUntil: 'networkidle', timeout: 30000 });

    const critical = consoleErrors.filter(
      (e) =>
        !e.includes('Warning:') &&
        !e.includes('favicon') &&
        !e.includes('DevTools') &&
        !e.includes('net::ERR_ABORTED') // font/resource preload abort is non-critical
    );

    if (critical.length > 0) {
      console.log('Critical console errors:\n' + critical.join('\n'));
    }
    expect(critical, `Critical errors:\n${critical.join('\n')}`).toHaveLength(0);
  });

  test('no broken /_next/ static assets on /clinic/auth', async ({ page }) => {
    const broken: string[] = [];
    page.on('response', (resp) => {
      if (
        resp.status() === 404 &&
        (resp.url().includes('/_next/') ||
          resp.url().endsWith('.js') ||
          resp.url().endsWith('.css') ||
          resp.url().endsWith('.woff2'))
      ) {
        broken.push(`${resp.status()} ${resp.url()}`);
      }
    });

    await page.goto(CLINIC_URL + '/clinic/auth', { waitUntil: 'networkidle', timeout: 30000 });
    expect(broken, `Broken assets:\n${broken.join('\n')}`).toHaveLength(0);
  });
});

// ─── 3. /clinic/settings — redirect when not logged in ────────────────────────

test.describe('Production — /clinic/settings redirect', () => {
  test('redirects to /clinic/auth when no token in localStorage', async ({ page }) => {
    // Start clean — no token
    await page.goto(CLINIC_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
    });

    await page.goto(CLINIC_URL + '/clinic/settings', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000); // allow client-side redirect to complete

    await saveScreenshot(page, '03-clinic-settings-no-token');

    const currentUrl = page.url();
    console.log(`Final URL after navigating to /clinic/settings without token: ${currentUrl}`);

    // Should have redirected to /clinic/auth
    expect(currentUrl).toContain('/clinic/auth');
  });

  test('/clinic/settings shows spinner (not blank) while redirecting', async ({ page }) => {
    await page.goto(CLINIC_URL + '/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.evaluate(() => {
      localStorage.removeItem('clinic_token');
      localStorage.removeItem('clinic_user');
    });

    await page.goto(CLINIC_URL + '/clinic/settings');
    await page.waitForTimeout(500); // catch the loading state before redirect

    const bodyHtml = await page.locator('body').innerHTML();
    // Page must not be blank
    expect(bodyHtml.trim().length).toBeGreaterThan(50);
  });

  test.skip('settings page shows "Настройки клиники" when logged in (auth required — skipped)', async ({ page }) => {
    // Skipped: real credentials would be needed to test the authenticated view.
    // Use CLINIC_URL + real clinic credentials to enable this test.
    await page.goto(CLINIC_URL + '/clinic/settings', { waitUntil: 'networkidle', timeout: 30000 });
    await expect(page.locator('text=Настройки клиники')).toBeVisible();
  });
});
