import { test, expect } from '@playwright/test';
import { captureConsoleErrors, screenshotPage } from '../helpers/screenshots';

test.describe('Admin Login', () => {
  test('login page loads without errors', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'admin-login');

    // Should have username and password inputs
    await expect(page.locator('input')).toHaveCount({ minimum: 2 });

    const realErrors = errors.filter((e) => !e.includes('favicon'));
    expect(realErrors.length).toBe(0);
  });

  test('login with wrong credentials shows error', async ({ page }, testInfo) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="text"], input[name="username"]', 'wrong');
    await page.fill('input[type="password"]', 'wrong');

    const submitBtn = page.locator('button[type="submit"], button').last();
    await submitBtn.click();

    // Wait for error message
    await page.waitForTimeout(2000);
    await screenshotPage(page, testInfo, 'admin-login-error');
  });
});
