import { test, expect } from '@playwright/test';
import { captureConsoleErrors, screenshotPage } from '../helpers/screenshots';

test.describe('Admin Orders Page', () => {
  test('orders page requires authentication', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'admin-dashboard-no-auth');

    // Should redirect to login
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('screenshot admin pages audit', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    const pages = [
      '/login',
      '/',
      '/orders',
      '/medics',
      '/clients',
      '/services',
      '/reviews',
      '/settings',
    ];

    for (const p of pages) {
      try {
        await page.goto(p, { waitUntil: 'networkidle', timeout: 10000 });
        await screenshotPage(page, testInfo, `admin${p.replace(/\//g, '_') || '_home'}`);
      } catch {
        await screenshotPage(page, testInfo, `admin_error${p.replace(/\//g, '_')}`);
      }
    }

    if (errors.length > 0) {
      testInfo.annotations.push({
        type: 'console-errors',
        description: errors.join('\n'),
      });
    }
  });
});
