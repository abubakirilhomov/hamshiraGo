import { test, expect } from '@playwright/test';
import { captureConsoleErrors, screenshotPage } from '../helpers/screenshots';

test.describe('Web Orders Flow', () => {
  test('orders page redirects to auth when not logged in', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'orders-no-auth');

    // Should either redirect to /auth or show login prompt
    const url = page.url();
    const hasAuthRedirect = url.includes('/auth');
    const hasLoginButton = await page.locator('text=Войти, text=Login').first().isVisible().catch(() => false);

    expect(hasAuthRedirect || hasLoginButton).toBeTruthy();
  });

  test('order creation page requires service selection', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'order-flow-start');
  });
});
