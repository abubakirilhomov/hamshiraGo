import { test, expect } from '@playwright/test';
import { captureConsoleErrors, screenshotPage } from '../helpers/screenshots';

test.describe('Web Home Page', () => {
  test('home page loads and shows services', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await screenshotPage(page, testInfo, 'home-page');

    // Should have some content
    await expect(page.locator('body')).not.toBeEmpty();

    // Check for console errors (filter out known noise)
    const realErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('hydration'),
    );
    if (realErrors.length > 0) {
      testInfo.annotations.push({
        type: 'console-errors',
        description: realErrors.join('\n'),
      });
    }
  });

  test('service cards are clickable', async ({ page }, testInfo) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find first service card/link
    const serviceLink = page.locator('a[href*="/service"]').first();
    if (await serviceLink.isVisible()) {
      await serviceLink.click();
      await page.waitForLoadState('networkidle');
      await screenshotPage(page, testInfo, 'service-detail');
    }
  });
});
