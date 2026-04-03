import { test, expect } from '@playwright/test';
import { captureConsoleErrors, screenshotAllPages } from '../helpers/screenshots';

test.describe('Web All Pages Screenshot Audit', () => {
  test('screenshot all public pages', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    const publicPages = [
      '/',
      '/auth',
    ];

    await screenshotAllPages(page, testInfo, publicPages);

    if (errors.length > 0) {
      testInfo.annotations.push({
        type: 'console-errors',
        description: errors.join('\n'),
      });
    }
  });

  test('screenshot all authenticated pages (if logged in)', async ({ page }, testInfo) => {
    const errors = captureConsoleErrors(page);

    // These pages require auth — they should redirect to /auth or show login
    const authPages = [
      '/profile',
      '/orders',
      '/favorites',
      '/courses',
      '/referral',
      '/medical-card',
    ];

    await screenshotAllPages(page, testInfo, authPages);

    if (errors.length > 0) {
      testInfo.annotations.push({
        type: 'console-errors',
        description: errors.join('\n'),
      });
    }
  });
});
