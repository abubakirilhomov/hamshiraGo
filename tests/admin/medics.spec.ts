import { test, expect } from '@playwright/test';
import { captureConsoleErrors, screenshotPage } from '../helpers/screenshots';

test.describe('Admin Medics Page', () => {
  test('medics verification page redirects without auth', async ({ page }, testInfo) => {
    await page.goto('/verification');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'admin-verification-no-auth');

    const url = page.url();
    expect(url).toContain('/login');
  });

  test('medics list page redirects without auth', async ({ page }, testInfo) => {
    await page.goto('/medics');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'admin-medics-no-auth');

    const url = page.url();
    expect(url).toContain('/login');
  });
});
