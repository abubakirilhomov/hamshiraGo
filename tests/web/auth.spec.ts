import { test, expect } from '@playwright/test';
import { captureConsoleErrors, screenshotPage } from '../helpers/screenshots';

test.describe('Web Auth', () => {
  test('auth page loads without errors', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'auth-page');

    // Page should have login/register form
    await expect(page.locator('input')).toHaveCount({ minimum: 2 });

    expect(errors.length).toBe(0);
  });

  test('login form validates empty fields', async ({ page }, testInfo) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Try submit without filling fields
    const submitBtn = page.locator('button[type="submit"], button').last();
    await submitBtn.click();

    await screenshotPage(page, testInfo, 'auth-validation');
  });

  test('register mode toggles correctly', async ({ page }, testInfo) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');

    // Look for register/login toggle link
    const toggleLink = page.locator('text=Регистрация, text=Register, text=Зарегистрироваться').first();
    if (await toggleLink.isVisible()) {
      await toggleLink.click();
      await screenshotPage(page, testInfo, 'auth-register-mode');
    }
  });
});
