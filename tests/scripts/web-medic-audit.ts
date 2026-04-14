/**
 * Comprehensive audit of web-medic app at https://medic.hamshirago.uz
 * Run: npx ts-node scripts/web-medic-audit.ts
 * Or via playwright: npx playwright test scripts/web-medic-audit.ts --project=audit
 */

import { chromium, Browser, BrowserContext, Page, ConsoleMessage, Request, Response } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'https://medic.hamshirago.uz';
const SCREENSHOTS_DIR = 'C:/Users/StreamLab/Desktop/hamshiraGo/test-screenshots';
const PHONE = '+998909876543';
const PASSWORD = 'test1234';

interface PageReport {
  page: string;
  url: string;
  consoleErrors: string[];
  consoleWarnings: string[];
  networkErrors: NetworkError[];
  screenshotPath: string;
  issues: string[];
  hydrationErrors: string[];
  status: 'ok' | 'warn' | 'error';
}

interface NetworkError {
  url: string;
  status: number;
  method: string;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(str: string) {
  return str.replace(/\//g, '-').replace(/^-/, '') || 'root';
}

async function setupPageListeners(page: Page): Promise<{
  getErrors: () => string[];
  getWarnings: () => string[];
  getNetworkErrors: () => NetworkError[];
  getHydrationErrors: () => string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const networkErrors: NetworkError[] = [];
  const hydrationErrors: string[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      errors.push(text);
      if (text.includes('Hydration') || text.includes('hydration') || text.includes('did not match')) {
        hydrationErrors.push(text);
      }
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', (err: Error) => {
    errors.push(`[PAGE ERROR] ${err.message}`);
  });

  page.on('response', (response: Response) => {
    const status = response.status();
    if (status >= 400) {
      networkErrors.push({
        url: response.url(),
        status,
        method: response.request().method(),
      });
    }
  });

  return {
    getErrors: () => [...errors],
    getWarnings: () => [...warnings],
    getNetworkErrors: () => [...networkErrors],
    getHydrationErrors: () => [...hydrationErrors],
  };
}

async function loginAndGetContext(browser: Browser): Promise<{ context: BrowserContext; page: Page; loginReport: Partial<PageReport> }> {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });

  // Inject localStorage before navigation to prevent onboarding redirect
  await context.addInitScript(() => {
    localStorage.setItem('medic_onboarding_completed', 'true');
  });

  const page = await context.newPage();
  const listeners = await setupPageListeners(page);
  const loginReport: Partial<PageReport> = { issues: [], consoleErrors: [], networkErrors: [] };

  console.log('[AUDIT] Navigating to /auth...');
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });

  // Take screenshot of auth page
  const authScreenshot = path.join(SCREENSHOTS_DIR, 'audit-auth.png');
  await page.screenshot({ path: authScreenshot, fullPage: true });
  console.log(`[AUDIT] Auth page screenshot saved.`);

  // Check if we were redirected to onboarding (bug check)
  const currentUrl = page.url();
  if (currentUrl.includes('/onboarding')) {
    loginReport.issues!.push('BUG: Redirected to /onboarding even with addInitScript — onboarding redirect bug exists for addInitScript approach');
    console.log('[AUDIT] WARNING: Redirected to /onboarding!');
  } else {
    console.log(`[AUDIT] Auth page loaded at: ${currentUrl}`);
  }

  // Wait for form to appear
  await page.waitForTimeout(2000);

  // Try to find phone/password fields
  const phoneSelectors = [
    'input[type="tel"]',
    'input[name="phone"]',
    'input[placeholder*="phone"]',
    'input[placeholder*="Phone"]',
    'input[placeholder*="телефон"]',
    'input[placeholder*="+998"]',
  ];
  const passwordSelectors = [
    'input[type="password"]',
    'input[name="password"]',
    'input[placeholder*="password"]',
    'input[placeholder*="пароль"]',
    'input[placeholder*="Password"]',
  ];

  let phoneInput = null;
  for (const sel of phoneSelectors) {
    try {
      phoneInput = await page.$(sel);
      if (phoneInput) { console.log(`[AUDIT] Found phone input: ${sel}`); break; }
    } catch {}
  }

  let passwordInput = null;
  for (const sel of passwordSelectors) {
    try {
      passwordInput = await page.$(sel);
      if (passwordInput) { console.log(`[AUDIT] Found password input: ${sel}`); break; }
    } catch {}
  }

  if (!phoneInput || !passwordInput) {
    // Try dumping page content to understand what's there
    const html = await page.content();
    const snippet = html.substring(0, 3000);
    console.log('[AUDIT] Could not find inputs. Page snippet:\n', snippet);
    loginReport.issues!.push('Could not find phone/password inputs on /auth page');
  } else {
    await phoneInput.fill(PHONE);
    await passwordInput.fill(PASSWORD);

    const beforeLoginScreenshot = path.join(SCREENSHOTS_DIR, 'audit-auth-filled.png');
    await page.screenshot({ path: beforeLoginScreenshot, fullPage: true });

    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Войти")',
      'button:has-text("Login")',
      'button:has-text("Кириш")',
      'button:has-text("Sign in")',
    ];
    let submitted = false;
    for (const sel of submitSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          console.log(`[AUDIT] Clicking submit: ${sel}`);
          await btn.click();
          submitted = true;
          break;
        }
      } catch {}
    }

    if (!submitted) {
      loginReport.issues!.push('Could not find submit button on /auth page');
    } else {
      // Wait for navigation after login
      await page.waitForTimeout(3000);
      const postLoginUrl = page.url();
      console.log(`[AUDIT] After login URL: ${postLoginUrl}`);

      const postLoginScreenshot = path.join(SCREENSHOTS_DIR, 'audit-auth-post-login.png');
      await page.screenshot({ path: postLoginScreenshot, fullPage: true });

      if (postLoginUrl.includes('/auth')) {
        loginReport.issues!.push('Login may have failed — still on /auth page after submit');
      }
    }
  }

  loginReport.consoleErrors = listeners.getErrors();
  loginReport.networkErrors = listeners.getNetworkErrors();

  return { context, page, loginReport };
}

async function auditPage(page: Page, pagePath: string, pageName: string): Promise<PageReport> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const networkErrors: NetworkError[] = [];
  const hydrationErrors: string[] = [];
  const issues: string[] = [];

  // Clear previous listeners by adding fresh ones
  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('response');

  page.on('console', (msg: ConsoleMessage) => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      errors.push(text);
      if (text.includes('Hydration') || text.includes('hydration') || text.includes('did not match')) {
        hydrationErrors.push(text);
      }
    } else if (type === 'warning') {
      warnings.push(text);
    }
  });

  page.on('pageerror', (err: Error) => {
    errors.push(`[PAGE ERROR] ${err.message}`);
  });

  page.on('response', (response: Response) => {
    const status = response.status();
    if (status >= 400) {
      // Filter out expected 401s for unauth requests or favicon misses
      const url = response.url();
      if (!url.includes('favicon') && !url.includes('robots.txt')) {
        networkErrors.push({
          url,
          status,
          method: response.request().method(),
        });
      }
    }
  });

  const url = `${BASE_URL}${pagePath}`;
  console.log(`\n[AUDIT] Auditing page: ${pageName} (${url})`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e: any) {
    issues.push(`Navigation timeout or error: ${e.message}`);
  }

  // Wait for any lazy loading / hydration
  await page.waitForTimeout(2500);

  const finalUrl = page.url();
  if (finalUrl !== url && !finalUrl.startsWith(url)) {
    issues.push(`Unexpected redirect: ${url} -> ${finalUrl}`);
  }

  // Check for common empty state issues
  const bodyText = await page.evaluate(() => document.body.innerText);

  // Check for "loading" stuck states
  if (bodyText.toLowerCase().includes('загрузка') && bodyText.length < 500) {
    issues.push('Page appears stuck in loading state (only loading text visible)');
  }

  // Check for error boundaries
  if (bodyText.includes('Something went wrong') || bodyText.includes('Error') && bodyText.length < 200) {
    issues.push('Possible error boundary triggered');
  }

  // Check for empty main content
  const mainContent = await page.$('main, [role="main"], .main-content, #main');
  if (mainContent) {
    const mainText = await mainContent.evaluate((el: Element) => (el as HTMLElement).innerText?.trim() || '');
    if (mainText.length < 20) {
      issues.push(`Main content area appears empty (text: "${mainText}")`);
    }
  }

  // Screenshot
  const screenshotName = `audit-${slugify(pagePath) || 'root'}.png`;
  const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[AUDIT] Screenshot saved: ${screenshotName}`);
  } catch (e: any) {
    issues.push(`Screenshot failed: ${e.message}`);
  }

  // Determine status
  let status: 'ok' | 'warn' | 'error' = 'ok';
  if (errors.length > 0 || networkErrors.some(n => n.status >= 500) || issues.some(i => i.includes('BUG') || i.includes('error'))) {
    status = 'error';
  } else if (warnings.length > 0 || networkErrors.some(n => n.status >= 400) || issues.length > 0) {
    status = 'warn';
  }

  return {
    page: pageName,
    url: finalUrl,
    consoleErrors: errors,
    consoleWarnings: warnings.slice(0, 10), // limit warnings
    networkErrors,
    screenshotPath,
    issues,
    hydrationErrors,
    status,
  };
}

async function checkLogout(page: Page): Promise<{ works: boolean; issues: string[] }> {
  const issues: string[] = [];
  console.log('\n[AUDIT] Checking logout...');

  // Navigate to a page first
  await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  // Look for logout button
  const logoutSelectors = [
    'button:has-text("Выйти")',
    'button:has-text("Logout")',
    'button:has-text("Chiqish")',
    'a:has-text("Выйти")',
    'a:has-text("Logout")',
    '[data-testid="logout"]',
  ];

  let logoutFound = false;
  for (const sel of logoutSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        logoutFound = true;
        console.log(`[AUDIT] Found logout: ${sel}`);
        await btn.click();
        await page.waitForTimeout(2000);
        const afterUrl = page.url();
        if (!afterUrl.includes('/auth') && !afterUrl.includes('/login')) {
          issues.push(`Logout did not redirect to /auth. Current URL: ${afterUrl}`);
        } else {
          console.log(`[AUDIT] Logout successful, redirected to: ${afterUrl}`);
        }
        break;
      }
    } catch {}
  }

  if (!logoutFound) {
    issues.push('Logout button not found on /profile page');
  }

  return { works: logoutFound && issues.length === 0, issues };
}

async function checkOnboardingRedirectBug(): Promise<{ hasBug: boolean; details: string }> {
  // Test WITHOUT addInitScript to see if onboarding redirect occurs
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  // NO addInitScript here — clean context
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 20000 });
  await page.waitForTimeout(1500);

  const url = page.url();
  const hasBug = url.includes('/onboarding');

  await context.close();
  await browser.close();

  return {
    hasBug,
    details: hasBug
      ? `Confirmed: /auth redirects to /onboarding without localStorage flag. URL: ${url}`
      : `No redirect to /onboarding without localStorage. URL: ${url}`,
  };
}

async function main() {
  ensureDir(SCREENSHOTS_DIR);

  console.log('='.repeat(60));
  console.log('HamshiraGo web-medic Comprehensive Audit');
  console.log(`Target: ${BASE_URL}`);
  console.log('='.repeat(60));

  const reports: PageReport[] = [];

  // 1. Check onboarding redirect bug first (separate browser)
  console.log('\n[AUDIT] Step 0: Checking onboarding redirect bug...');
  const onboardingCheck = await checkOnboardingRedirectBug();
  console.log(`[AUDIT] Onboarding bug: ${onboardingCheck.hasBug ? 'YES' : 'NO'} — ${onboardingCheck.details}`);

  // 2. Launch main browser with auth
  const browser = await chromium.launch({ headless: true });

  let context: BrowserContext;
  let page: Page;
  let loginReport: Partial<PageReport>;

  try {
    const result = await loginAndGetContext(browser);
    context = result.context;
    page = result.page;
    loginReport = result.loginReport;
  } catch (e: any) {
    console.error('[AUDIT] Login failed:', e.message);
    await browser.close();
    process.exit(1);
    return;
  }

  // 3. Audit each page
  const pages = [
    { path: '/', name: 'dashboard' },
    { path: '/orders', name: 'orders' },
    { path: '/work-zone', name: 'work-zone' },
    { path: '/wallet', name: 'wallet' },
    { path: '/profile', name: 'profile' },
    { path: '/verification', name: 'verification' },
    { path: '/reviews', name: 'reviews' },
  ];

  for (const p of pages) {
    const report = await auditPage(page, p.path, p.name);
    reports.push(report);
  }

  // 4. Check logout
  const logoutResult = await checkLogout(page);

  await context!.close();
  await browser.close();

  // 5. Print report
  console.log('\n' + '='.repeat(60));
  console.log('AUDIT REPORT');
  console.log('='.repeat(60));

  console.log('\n--- ONBOARDING REDIRECT BUG ---');
  console.log(onboardingCheck.details);

  console.log('\n--- LOGIN ---');
  if (loginReport.issues && loginReport.issues.length > 0) {
    loginReport.issues.forEach(i => console.log(`  ISSUE: ${i}`));
  } else {
    console.log('  Login: OK');
  }
  if (loginReport.consoleErrors && loginReport.consoleErrors.length > 0) {
    console.log('  Console errors during login:');
    loginReport.consoleErrors.forEach(e => console.log(`    - ${e}`));
  }
  if (loginReport.networkErrors && loginReport.networkErrors.length > 0) {
    console.log('  Network errors during login:');
    (loginReport.networkErrors as NetworkError[]).forEach(e => console.log(`    - ${e.method} ${e.url} -> ${e.status}`));
  }

  for (const report of reports) {
    const icon = report.status === 'ok' ? 'OK' : report.status === 'warn' ? 'WARN' : 'ERROR';
    console.log(`\n--- [${icon}] ${report.page.toUpperCase()} (${report.url}) ---`);

    if (report.issues.length > 0) {
      console.log('  Issues:');
      report.issues.forEach(i => console.log(`    - ${i}`));
    }

    if (report.consoleErrors.length > 0) {
      console.log('  Console errors:');
      report.consoleErrors.forEach(e => console.log(`    - ${e}`));
    }

    if (report.hydrationErrors.length > 0) {
      console.log('  Hydration errors:');
      report.hydrationErrors.forEach(e => console.log(`    - ${e}`));
    }

    if (report.networkErrors.length > 0) {
      console.log('  Network errors:');
      report.networkErrors.forEach(e => console.log(`    - ${e.method} ${e.url} -> ${e.status}`));
    }

    if (report.consoleWarnings.length > 0) {
      console.log(`  Warnings (${report.consoleWarnings.length} total, showing first 5):`);
      report.consoleWarnings.slice(0, 5).forEach(w => console.log(`    - ${w}`));
    }

    console.log(`  Screenshot: ${report.screenshotPath}`);
  }

  console.log('\n--- LOGOUT ---');
  if (logoutResult.works) {
    console.log('  Logout: OK');
  } else {
    logoutResult.issues.forEach(i => console.log(`  ISSUE: ${i}`));
  }

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  const errorPages = reports.filter(r => r.status === 'error').map(r => r.page);
  const warnPages = reports.filter(r => r.status === 'warn').map(r => r.page);
  const okPages = reports.filter(r => r.status === 'ok').map(r => r.page);
  console.log(`OK:    ${okPages.join(', ') || 'none'}`);
  console.log(`WARN:  ${warnPages.join(', ') || 'none'}`);
  console.log(`ERROR: ${errorPages.join(', ') || 'none'}`);
  console.log(`Onboarding redirect bug: ${onboardingCheck.hasBug ? 'YES (confirmed)' : 'NO'}`);
  console.log(`Logout works: ${logoutResult.works ? 'YES' : 'NO'}`);
}

main().catch(e => {
  console.error('Audit failed:', e);
  process.exit(1);
});
