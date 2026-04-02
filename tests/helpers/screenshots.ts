import { Page, TestInfo } from '@playwright/test';

/** Collect all console errors during a test */
export function captureConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`PAGE ERROR: ${err.message}`);
  });
  return errors;
}

/** Take a full-page screenshot and attach to test report */
export async function screenshotPage(page: Page, testInfo: TestInfo, name: string) {
  const screenshot = await page.screenshot({ fullPage: true });
  await testInfo.attach(name, { body: screenshot, contentType: 'image/png' });
}

/** Take screenshots of every page in a list of URLs */
export async function screenshotAllPages(
  page: Page,
  testInfo: TestInfo,
  urls: string[],
) {
  for (const url of urls) {
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
      await screenshotPage(page, testInfo, url.replace(/\//g, '_') || 'home');
    } catch {
      // Page may not load — still capture what we can
      await screenshotPage(page, testInfo, `error_${url.replace(/\//g, '_')}`);
    }
  }
}
