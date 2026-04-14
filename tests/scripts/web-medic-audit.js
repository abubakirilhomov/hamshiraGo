/**
 * Comprehensive audit of web-medic app at https://medic.hamshirago.uz
 * Run: node scripts/web-medic-audit.js
 */

const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://medic.hamshirago.uz';
const API_URL = 'https://hamshirago-production-0a65.up.railway.app';
const SCREENSHOTS_DIR = 'C:/Users/StreamLab/Desktop/hamshiraGo/test-screenshots';
const PHONE = '+998909876543';
const PASSWORD = 'test1234';

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function slugify(str) {
  return str.replace(/\//g, '-').replace(/^-/, '') || 'root';
}

function apiPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'hamshirago-production-0a65.up.railway.app',
      port: 443,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, data: body }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function getAuthToken() {
  console.log('[AUTH] Getting auth token via API...');
  const result = await apiPost('/medics/login', { phone: PHONE, password: PASSWORD });
  if (result.status !== 200 && result.status !== 201) {
    throw new Error(`Login API failed: ${result.status} ${JSON.stringify(result.data)}`);
  }
  const token = result.data.access_token;
  const medic = result.data.medic;
  console.log(`[AUTH] Token obtained. Medic: ${medic.name} (${medic.verificationStatus})`);
  return { token, medic };
}

async function checkOnboardingRedirectBug() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  const url = page.url();
  const hasBug = url.includes('/onboarding');

  const screenshot = path.join(SCREENSHOTS_DIR, 'audit-onboarding-bug-check.png');
  await page.screenshot({ path: screenshot, fullPage: true });

  await context.close();
  await browser.close();

  return {
    hasBug,
    url,
    screenshot,
    details: hasBug
      ? `CONFIRMED: /auth redirects to /onboarding without localStorage flag. Final URL: ${url}`
      : `No redirect — /auth stays at: ${url}`,
  };
}

async function createAuthenticatedContext(browser, token) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    ignoreHTTPSErrors: true,
  });

  // Inject both localStorage items before any navigation
  await context.addInitScript((t) => {
    localStorage.setItem('medic_onboarding_completed', 'true');
    localStorage.setItem('medic_token', t);
    localStorage.setItem('token', t);
    // Some Next.js apps store token in multiple keys
    localStorage.setItem('access_token', t);
    localStorage.setItem('authToken', t);
  }, token);

  return context;
}

async function loginViaUI(page, token) {
  // Navigate to auth page
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  const currentUrl = page.url();
  console.log(`[LOGIN-UI] URL: ${currentUrl}`);

  // Inject token directly into localStorage after page load too
  await page.evaluate((t) => {
    localStorage.setItem('medic_onboarding_completed', 'true');
    localStorage.setItem('medic_token', t);
    localStorage.setItem('token', t);
    localStorage.setItem('access_token', t);
    localStorage.setItem('authToken', t);
  }, token);

  // Check what localStorage keys exist on the actual auth page
  const storageKeys = await page.evaluate(() => Object.keys(localStorage));
  console.log('[LOGIN-UI] localStorage keys on /auth:', storageKeys);

  // Check what the web app uses for auth by looking at source
  // Try to find the token storage key from network requests
  const inputs = await page.$$eval('input', els => els.map(el => ({
    type: el.type, name: el.name, placeholder: el.placeholder,
  })));
  console.log('[LOGIN-UI] Inputs:', JSON.stringify(inputs));

  if (inputs.length < 2) {
    return { success: false, reason: 'Could not find login form inputs' };
  }

  // Fill phone without spaces (the API accepts it; let's see what format the app sends)
  const phoneInput = await page.$('input[type="tel"]');
  const passwordInput = await page.$('input[type="password"]');

  if (!phoneInput || !passwordInput) {
    return { success: false, reason: 'Phone or password input not found' };
  }

  // Clear and type phone
  await phoneInput.click({ clickCount: 3 });
  await phoneInput.fill('');
  await phoneInput.type(PHONE, { delay: 50 });
  await page.waitForTimeout(300);
  await passwordInput.fill(PASSWORD);
  await page.waitForTimeout(300);

  // Check what value was actually set (app may format phone)
  const phoneValue = await phoneInput.evaluate(el => el.value);
  console.log(`[LOGIN-UI] Phone field value: "${phoneValue}"`);

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'audit-auth-filled.png'), fullPage: true });

  // Monitor the login request
  let loginRequestBody = null;
  let loginResponseStatus = null;
  const responsePromise = new Promise(resolve => {
    page.once('response', async res => {
      if (res.url().includes('/medics/login')) {
        loginResponseStatus = res.status();
        try {
          const body = await res.json();
          resolve(body);
        } catch { resolve(null); }
      }
    });
  });

  // Submit
  const submitBtn = await page.$('button[type="submit"]');
  if (!submitBtn) {
    return { success: false, reason: 'Submit button not found' };
  }
  await submitBtn.click();

  // Wait for login response or timeout
  await Promise.race([
    responsePromise,
    new Promise(r => setTimeout(r, 8000)),
  ]);

  await page.waitForTimeout(2000);
  const postUrl = page.url();
  console.log(`[LOGIN-UI] Post-login URL: ${postUrl} (login response status: ${loginResponseStatus})`);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'audit-auth-post-login.png'), fullPage: true });

  const success = !postUrl.includes('/auth');
  if (!success) {
    return {
      success: false,
      reason: `Still on /auth after submit. Login response status: ${loginResponseStatus}`,
    };
  }
  return { success: true };
}

async function navigateWithTokenInjection(page, token, pagePath) {
  // Inject token before navigating
  await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.evaluate((t) => {
    localStorage.setItem('medic_onboarding_completed', 'true');
    localStorage.setItem('medic_token', t);
    localStorage.setItem('token', t);
    localStorage.setItem('access_token', t);
    localStorage.setItem('authToken', t);
  }, token);

  await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
}

async function auditPage(page, pagePath, pageName) {
  const errors = [];
  const warnings = [];
  const networkErrors = [];
  const hydrationErrors = [];
  const issues = [];

  page.removeAllListeners('console');
  page.removeAllListeners('pageerror');
  page.removeAllListeners('response');

  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    if (type === 'error') {
      errors.push(text);
      if (/hydrat|did not match/i.test(text)) hydrationErrors.push(text);
    } else if (type === 'warning') {
      if (!/Download the React DevTools/i.test(text)) warnings.push(text);
    }
  });

  page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));

  page.on('response', response => {
    const status = response.status();
    const url = response.url();
    if (status >= 400 && !url.includes('favicon') && !url.includes('robots.txt')) {
      networkErrors.push({ url, status, method: response.request().method() });
    }
  });

  console.log(`\n[PAGE] Auditing: ${pageName} (${pagePath})`);

  try {
    await page.goto(`${BASE_URL}${pagePath}`, { waitUntil: 'networkidle', timeout: 30000 });
  } catch (e) {
    issues.push(`Navigation error: ${e.message}`);
  }

  await page.waitForTimeout(3000);

  const finalUrl = page.url();
  const expectedUrl = `${BASE_URL}${pagePath}`;
  const redirected = !finalUrl.startsWith(expectedUrl.replace(/\/$/, ''));
  if (redirected) {
    issues.push(`Unexpected redirect: ${pagePath} -> ${finalUrl.replace(BASE_URL, '')}`);
    console.log(`  Redirect: ${finalUrl}`);
  }

  // Body text analysis
  const bodyText = await page.evaluate(() => document.body?.innerText || '');

  if (/загружается|loading\.\.\./i.test(bodyText) && bodyText.length < 300) {
    issues.push('Page appears stuck in loading state');
  }
  if (/something went wrong|error occurred/i.test(bodyText)) {
    issues.push('Error boundary or error message visible on page');
  }

  // Check main content area
  const mainAnalysis = await page.evaluate(() => {
    const main = document.querySelector('main, [role="main"], .main-content, #content, #__next > div');
    if (!main) return { found: false, text: '' };
    const text = (main.innerText || main.textContent || '').trim();
    return { found: true, text: text.substring(0, 200) };
  });

  if (mainAnalysis.found && mainAnalysis.text.length < 20 && !redirected) {
    issues.push(`Main content area empty: "${mainAnalysis.text}"`);
  }

  // Check broken images
  const brokenImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img'))
      .filter(img => !img.complete || img.naturalWidth === 0)
      .map(img => img.src || img.getAttribute('src') || '(no src)')
      .filter(src => !src.includes('data:'));
  });
  if (brokenImages.length > 0) {
    issues.push(`Broken images (${brokenImages.length}): ${brokenImages.slice(0, 3).join(', ')}`);
  }

  // Check interactive elements
  const interactiveCheck = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button:not([disabled])');
    const links = document.querySelectorAll('a[href]');
    return { buttons: buttons.length, links: links.length };
  });
  console.log(`  Interactive: ${interactiveCheck.buttons} buttons, ${interactiveCheck.links} links`);

  // Screenshot
  const screenshotName = `audit-${slugify(pagePath)}.png`;
  const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  Screenshot: ${screenshotName}`);
  } catch (e) {
    issues.push(`Screenshot failed: ${e.message}`);
  }

  let status = 'ok';
  if (errors.some(e => !/favicon|robots/.test(e)) || networkErrors.some(n => n.status >= 500) ||
      issues.some(i => /error|BUG|failed/i.test(i)) || redirected) {
    status = 'error';
  } else if (warnings.length > 0 || networkErrors.some(n => n.status >= 400) || issues.length > 0) {
    status = 'warn';
  }

  return {
    page: pageName,
    path: pagePath,
    url: finalUrl,
    consoleErrors: errors,
    consoleWarnings: warnings.slice(0, 10),
    networkErrors,
    screenshotPath,
    issues,
    hydrationErrors,
    interactiveElements: interactiveCheck,
    status,
    bodyTextSnippet: bodyText.substring(0, 300),
  };
}

async function checkLogout(page) {
  const issues = [];
  console.log('\n[LOGOUT] Navigating to /profile...');

  try {
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);
  } catch (e) {
    return { works: false, issues: [`Navigation to /profile failed: ${e.message}`] };
  }

  // Dump all clickable elements
  const clickables = await page.$$eval('button, [role="button"], a', els =>
    els.map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().substring(0, 50),
      class: el.className?.substring(0, 50),
    }))
  ).catch(() => []);
  console.log('[LOGOUT] Clickable elements on /profile:', JSON.stringify(clickables.slice(0, 15)));

  const logoutSelectors = [
    'button:has-text("Выйти")',
    'button:has-text("Logout")',
    'button:has-text("Chiqish")',
    'button:has-text("Chiqib")',
    'a:has-text("Выйти")',
    'a:has-text("Logout")',
    '[data-testid="logout"]',
    '.logout-btn',
  ];

  let logoutFound = false;
  for (const sel of logoutSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        logoutFound = true;
        const text = await btn.evaluate(el => el.textContent?.trim());
        console.log(`[LOGOUT] Found: "${text}" (${sel})`);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'audit-logout-before.png'), fullPage: true });
        await btn.click();
        await page.waitForTimeout(2500);
        const afterUrl = page.url();
        console.log(`[LOGOUT] After click URL: ${afterUrl}`);
        if (!afterUrl.includes('/auth') && !afterUrl.includes('/login') && !afterUrl.includes('/onboarding')) {
          issues.push(`Logout did not redirect to /auth. Stayed at: ${afterUrl}`);
        }
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'audit-logout-after.png'), fullPage: true });
        break;
      }
    } catch {}
  }

  if (!logoutFound) {
    issues.push('Logout button not found on /profile page');
  }

  return { works: logoutFound && issues.length === 0, issues };
}

async function main() {
  ensureDir(SCREENSHOTS_DIR);

  console.log('='.repeat(60));
  console.log('HamshiraGo web-medic Comprehensive Audit');
  console.log(`Target: ${BASE_URL}`);
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  // Step 0: Onboarding redirect bug check
  console.log('\n[STEP 0] Checking onboarding redirect bug...');
  let onboardingCheck;
  try {
    onboardingCheck = await checkOnboardingRedirectBug();
    console.log(`[STEP 0] ${onboardingCheck.details}`);
  } catch (e) {
    console.log(`[STEP 0] Error: ${e.message}`);
    onboardingCheck = { hasBug: null, details: `Error: ${e.message}` };
  }

  // Step 0.5: Get auth token via direct API call
  let token, medicInfo;
  try {
    const auth = await getAuthToken();
    token = auth.token;
    medicInfo = auth.medic;
  } catch (e) {
    console.error('[AUTH] FATAL: Could not get token:', e.message);
    process.exit(1);
  }

  // Step 1: Login via UI (with token already obtained)
  const browser = await chromium.launch({ headless: true });
  const context = await createAuthenticatedContext(browser, token);
  const page = await context.newPage();

  // Try UI login
  console.log('\n[STEP 1] Attempting UI login...');
  let loginResult;
  try {
    loginResult = await loginViaUI(page, token);
  } catch (e) {
    loginResult = { success: false, reason: `Exception: ${e.message}` };
  }

  // If UI login failed, check what localStorage key the app actually uses
  if (!loginResult.success) {
    console.log(`[LOGIN] UI login failed: ${loginResult.reason}`);
    console.log('[LOGIN] Probing localStorage key the app uses...');

    // Navigate to auth, look at source for localStorage references
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // Check script sources for token storage patterns
    const scripts = await page.$$eval('script[src]', els => els.map(el => el.src));
    console.log('[LOGIN] Script sources:', scripts.slice(0, 5));

    // Try to find token key from page JS
    const localStorageContent = await page.evaluate(() => {
      const obj = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        obj[key] = localStorage.getItem(key)?.substring(0, 50);
      }
      return obj;
    });
    console.log('[LOGIN] Current localStorage:', JSON.stringify(localStorageContent));
  } else {
    console.log('[LOGIN] UI login SUCCESS');
  }

  // Step 2: Audit pages (navigate with token already in localStorage via addInitScript)
  console.log('\n[STEP 2] Auditing pages...');

  const pagesToAudit = [
    { path: '/', name: 'dashboard' },
    { path: '/orders', name: 'orders' },
    { path: '/work-zone', name: 'work-zone' },
    { path: '/wallet', name: 'wallet' },
    { path: '/profile', name: 'profile' },
    { path: '/verification', name: 'verification' },
    { path: '/reviews', name: 'reviews' },
  ];

  const reports = [];
  for (const p of pagesToAudit) {
    try {
      const report = await auditPage(page, p.path, p.name);
      reports.push(report);
    } catch (e) {
      console.log(`[PAGE] ERROR auditing ${p.name}: ${e.message}`);
      reports.push({
        page: p.name, path: p.path, url: `${BASE_URL}${p.path}`,
        consoleErrors: [`Exception: ${e.message}`],
        consoleWarnings: [], networkErrors: [],
        screenshotPath: 'N/A',
        issues: [`Audit threw: ${e.message}`],
        hydrationErrors: [], status: 'error',
        interactiveElements: { buttons: 0, links: 0 },
      });
    }
  }

  // Step 3: Logout
  console.log('\n[STEP 3] Checking logout...');
  let logoutResult;
  try {
    logoutResult = await checkLogout(page);
  } catch (e) {
    logoutResult = { works: false, issues: [`Exception: ${e.message}`] };
  }

  await context.close();
  await browser.close();

  // FINAL REPORT
  const div = '='.repeat(60);
  console.log('\n' + div);
  console.log('FINAL AUDIT REPORT');
  console.log(div);

  console.log('\n## MEDIC ACCOUNT INFO');
  if (medicInfo) {
    console.log(`  Name: ${medicInfo.name}`);
    console.log(`  Phone: ${medicInfo.phone}`);
    console.log(`  Verification: ${medicInfo.verificationStatus}`);
    console.log(`  Rating: ${medicInfo.rating ?? 'null'}`);
    console.log(`  Balance: ${medicInfo.balance} UZS`);
    console.log(`  isOnline: ${medicInfo.isOnline}`);
  }

  console.log('\n## ONBOARDING REDIRECT BUG');
  console.log(`  Status: ${onboardingCheck.hasBug === true ? 'CONFIRMED BUG' : onboardingCheck.hasBug === false ? 'No bug' : 'Unknown'}`);
  console.log(`  Detail: ${onboardingCheck.details}`);
  if (onboardingCheck.screenshot) console.log(`  Screenshot: ${onboardingCheck.screenshot}`);

  console.log('\n## LOGIN');
  console.log(`  API Login: SUCCESS (token obtained directly from API)`);
  console.log(`  UI Login: ${loginResult.success ? 'SUCCESS' : 'FAILED'}`);
  if (!loginResult.success) console.log(`  UI Login failure reason: ${loginResult.reason}`);

  for (const report of reports) {
    const icon = report.status === 'ok' ? 'OK' : report.status === 'warn' ? 'WARN' : 'ERROR';
    console.log(`\n## PAGE: ${report.page.toUpperCase()} [${icon}]`);
    console.log(`  URL: ${report.url}`);
    console.log(`  Interactive: ${report.interactiveElements?.buttons ?? '?'} buttons, ${report.interactiveElements?.links ?? '?'} links`);
    console.log(`  Screenshot: ${report.screenshotPath}`);

    if (report.issues.length > 0) {
      console.log('  Issues:');
      report.issues.forEach(i => console.log(`    ISSUE: ${i}`));
    } else {
      console.log('  Issues: none');
    }

    if (report.consoleErrors.length > 0) {
      console.log(`  Console errors (${report.consoleErrors.length}):`);
      report.consoleErrors.forEach(e => console.log(`    ERR: ${e}`));
    } else {
      console.log('  Console errors: none');
    }

    if (report.hydrationErrors.length > 0) {
      console.log('  Hydration errors:');
      report.hydrationErrors.forEach(e => console.log(`    HYDRATION: ${e}`));
    }

    if (report.networkErrors.length > 0) {
      console.log(`  Network errors (${report.networkErrors.length}):`);
      report.networkErrors.forEach(e => console.log(`    ${e.method} ${e.status} ${e.url}`));
    } else {
      console.log('  Network errors: none');
    }

    if (report.consoleWarnings.length > 0) {
      console.log(`  Warnings (${report.consoleWarnings.length}):`);
      report.consoleWarnings.slice(0, 5).forEach(w => console.log(`    WARN: ${w}`));
    }

    if (report.bodyTextSnippet) {
      console.log(`  Page content preview: "${report.bodyTextSnippet.substring(0, 150).replace(/\n/g, ' ')}"`);
    }
  }

  console.log('\n## LOGOUT');
  console.log(`  Status: ${logoutResult.works ? 'WORKS' : 'FAILED'}`);
  logoutResult.issues.forEach(i => console.log(`  Issue: ${i}`));

  console.log('\n## SUMMARY');
  const errPages = reports.filter(r => r.status === 'error').map(r => r.page);
  const warnPages = reports.filter(r => r.status === 'warn').map(r => r.page);
  const okPages = reports.filter(r => r.status === 'ok').map(r => r.page);
  console.log(`  Pages OK:    [${okPages.join(', ') || 'none'}]`);
  console.log(`  Pages WARN:  [${warnPages.join(', ') || 'none'}]`);
  console.log(`  Pages ERROR: [${errPages.join(', ') || 'none'}]`);
  console.log(`  Onboarding redirect bug: ${onboardingCheck.hasBug === true ? 'YES' : onboardingCheck.hasBug === false ? 'NO' : 'UNKNOWN'}`);
  console.log(`  Login (API): OK`);
  console.log(`  Login (UI): ${loginResult.success ? 'OK' : 'FAILED'}`);
  console.log(`  Logout: ${logoutResult.works ? 'OK' : 'FAILED'}`);
  console.log(div);
}

main().catch(e => {
  console.error('Audit failed:', e);
  process.exit(1);
});
