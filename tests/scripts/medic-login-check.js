/**
 * medic-login-check.js
 *
 * 1. Registers a new medic via API (409 = already exists → fine)
 * 2. Logs in via API to confirm credentials work and get a JWT
 * 3. Opens Chromium, sets medic_onboarding_completed in localStorage,
 *    then navigates to https://medic.hamshirago.uz/auth
 * 4. Fills in phone + password and submits the login form
 * 5. Waits up to 15 s for navigation / dashboard
 * 6. Takes a full-page screenshot
 * 7. Prints final URL + visible page info
 */

const { chromium } = require('@playwright/test');
const https = require('https');

const API_BASE = 'https://hamshirago-production-0a65.up.railway.app';
const WEB_BASE = 'https://medic.hamshirago.uz';
const PHONE    = '+998909876543';
// Formatted as the app's formatPhone() produces:  "+998 09 876 54 3" → actually let's send digits
// The app's onChange strips non-digits and formats; we'll use keyboard input
const PHONE_DIGITS = '998909876543'; // digits only — matches formatPhone internal logic
const PASSWORD = 'test1234';
const SCREENSHOT_PATH =
  'C:/Users/StreamLab/Desktop/hamshiraGo/test-screenshots/medic-login-result.png';

// ── tiny JSON fetch helper ──────────────────────────────────────────────────
function jsonPost(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', (c) => (raw += c));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ── main ────────────────────────────────────────────────────────────────────
(async () => {
  // ── STEP 1: Register ──────────────────────────────────────────────────────
  console.log('\n[1] Registering medic via API…');
  const regRes = await jsonPost(`${API_BASE}/medics/register`, {
    name: 'Test Medic PW',
    phone: PHONE,
    password: PASSWORD,
    experienceYears: 2,
  });
  if (regRes.status === 201 || regRes.status === 200) {
    console.log('    Registered successfully.');
  } else if (regRes.status === 409) {
    console.log('    Already exists (409) — continuing.');
  } else {
    console.warn(`    Unexpected register status ${regRes.status}:`, regRes.body);
  }

  // ── STEP 2: Login via API ─────────────────────────────────────────────────
  console.log('\n[2] Logging in via API…');
  const loginRes = await jsonPost(`${API_BASE}/medics/login`, {
    phone: PHONE,
    password: PASSWORD,
  });
  if (loginRes.status !== 200 && loginRes.status !== 201) {
    console.error(`    Login failed (${loginRes.status}):`, loginRes.body);
    process.exit(1);
  }
  const apiToken = loginRes.body.access_token;
  if (!apiToken) {
    console.error('    No access_token in response:', loginRes.body);
    process.exit(1);
  }
  console.log(`    API token received: ${apiToken.slice(0, 40)}…`);

  // ── STEP 3: Launch browser ────────────────────────────────────────────────
  console.log('\n[3] Launching Chromium…');
  const browser = await chromium.launch({ headless: true });

  // Create context — inject localStorage BEFORE navigating
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  // Playwright storage state injection via addInitScript so localStorage is set
  // before any page script runs
  await context.addInitScript(() => {
    localStorage.setItem('medic_onboarding_completed', 'true');
  });

  const page = await context.newPage();

  // Navigate to auth page
  console.log(`    Navigating to ${WEB_BASE}/auth …`);
  await page.goto(`${WEB_BASE}/auth`, { waitUntil: 'domcontentloaded', timeout: 20_000 });

  // Wait for React to hydrate and the redirect logic to run
  // The useEffect checks localStorage — since we set it, we should stay on /auth
  await page.waitForTimeout(2000);

  let currentUrl = page.url();
  console.log(`    After 2s — URL: ${currentUrl}`);

  // If still redirected to onboarding, set localStorage via JS execution and navigate again
  if (currentUrl.includes('/onboarding') || !currentUrl.includes('/auth')) {
    console.log('    Still on onboarding — injecting localStorage via evaluate and re-navigating…');
    await page.evaluate(() => {
      localStorage.setItem('medic_onboarding_completed', 'true');
    });
    await page.goto(`${WEB_BASE}/auth`, { waitUntil: 'networkidle', timeout: 20_000 });
    await page.waitForTimeout(2000);
    currentUrl = page.url();
    console.log(`    URL after re-navigate: ${currentUrl}`);
  }

  // Take a debug screenshot
  await page.screenshot({
    path: 'C:/Users/StreamLab/Desktop/hamshiraGo/test-screenshots/medic-debug-auth-page.png',
    fullPage: true,
  });
  console.log('    Debug screenshot saved.');

  // ── STEP 4: Fill the login form ───────────────────────────────────────────
  console.log('\n[4] Filling login form…');

  // Wait for password input
  try {
    await page.waitForSelector('input[type="password"]', { timeout: 12_000 });
  } catch {
    // Dump page state for debugging
    const bodyText = await page.$eval('body', el => el.innerText.slice(0, 800)).catch(() => 'N/A');
    console.error('    Password field not found. Page body:\n', bodyText);
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    await browser.close();
    process.exit(1);
  }

  // Phone input — the component uses type="tel"
  // It processes digits only via onChange with formatPhone()
  // Strategy: click the phone field, trigger focus (sets "+998 "), then type remaining digits
  const phoneInput = await page.$('input[type="tel"]');
  if (!phoneInput) {
    console.error('    Phone input (type=tel) not found!');
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
    await browser.close();
    process.exit(1);
  }

  // The onFocus handler: if (!phone) setPhone("+998 ")
  // So clicking sets value to "+998 " if empty.
  // formatPhone(digits): strips non-digits, slices "998" prefix, appends parts.
  // If we type "909876543" after "+998 " prefix is set by focus:
  //   onChange sees "+998 909876543" → .replace(/\D/g,"") → "998909876543"
  //   formatPhone("998909876543") → d = "909876543" → "+998 90 987 65 43" ✓
  //
  // So: click to focus (gets "+998 "), then type the 9 local digits.

  await phoneInput.click();
  await page.waitForTimeout(400);

  let phoneVal = await phoneInput.inputValue();
  console.log(`    Phone field value after focus: "${phoneVal}"`);

  // If focus didn't set the prefix, set it manually via React-compatible input
  if (!phoneVal.includes('998')) {
    await page.evaluate((el) => {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      nativeInputValueSetter.call(el, '+998 ');
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, phoneInput);
    await page.waitForTimeout(200);
    phoneVal = await phoneInput.inputValue();
    console.log(`    Phone field after manual prefix: "${phoneVal}"`);
  }

  // Move cursor to end of field, then type the 9 local digits
  await page.keyboard.press('End');
  await page.keyboard.type('909876543', { delay: 40 });
  await page.waitForTimeout(300);

  phoneVal = await phoneInput.inputValue();
  console.log(`    Phone field value after typing: "${phoneVal}"`);

  // Password field
  const passwordInput = await page.$('input[type="password"]');
  await passwordInput.click({ clickCount: 3 });
  await page.waitForTimeout(100);
  await passwordInput.type(PASSWORD, { delay: 30 });

  const passVal = await passwordInput.inputValue();
  console.log(`    Password field value: "${'*'.repeat(passVal.length)}"`);

  // Take screenshot before submit
  await page.screenshot({
    path: 'C:/Users/StreamLab/Desktop/hamshiraGo/test-screenshots/medic-debug-before-submit.png',
    fullPage: true,
  });
  console.log('    Screenshot before submit saved.');

  // ── Submit ────────────────────────────────────────────────────────────────
  console.log('\n[4] Submitting form…');

  // Look for submit button
  const submitBtn = await page.$('button[type="submit"]');
  if (submitBtn) {
    await submitBtn.click();
    console.log('    Clicked submit button.');
  } else {
    await passwordInput.press('Enter');
    console.log('    Pressed Enter on password field.');
  }

  // ── STEP 5: Wait for navigation / dashboard ───────────────────────────────
  console.log('\n[5] Waiting for navigation (up to 15 s)…');

  // Wait for URL to change from /auth, or for navigation event
  try {
    await page.waitForFunction(
      () => !window.location.pathname.includes('/auth'),
      { timeout: 15_000 }
    );
    console.log('    URL changed from /auth — navigation happened.');
  } catch {
    console.log('    URL did not change from /auth within 15 s (may still be on auth page — checking for errors).');
  }

  // Additional settle time for React renders
  await page.waitForTimeout(2500);

  const finalUrl = page.url();
  console.log(`    Final URL: ${finalUrl}`);

  // ── STEP 6: Full-page screenshot ──────────────────────────────────────────
  console.log('\n[6] Taking full-page screenshot…');
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  console.log(`    Saved to: ${SCREENSHOT_PATH}`);

  // ── STEP 7: Describe what's visible ──────────────────────────────────────
  console.log('\n[7] Inspecting page content…');

  const safeText = el => (el && el.innerText ? el.innerText.trim() : '');

  const title   = await page.title();
  const h1s     = await page.$$eval('h1', els => els.map(e => (e.innerText||'').trim()).filter(Boolean));
  const h2s     = await page.$$eval('h2', els => els.map(e => (e.innerText||'').trim()).filter(Boolean));
  const h3s     = await page.$$eval('h3', els => els.map(e => (e.innerText||'').trim()).filter(Boolean).slice(0, 8));

  const navItems = await page.$$eval(
    'nav a, aside a, [class*="sidebar"] a, [class*="menu"] a, [role="navigation"] a',
    els => [...new Set(els.map(e => (e.innerText||'').trim()).filter(Boolean))].slice(0, 20)
  );

  const buttons = await page.$$eval(
    'button',
    els => [...new Set(els.map(e => (e.innerText||'').trim()).filter(Boolean))].slice(0, 15)
  );

  const alerts = await page.$$eval(
    '[role="alert"], [class*="error"], [class*="alert"], [class*="toast"]',
    els => els.map(e => (e.innerText||'').trim()).filter(Boolean).slice(0, 5)
  );

  const bodyText = await page.$eval('body', el =>
    (el.innerText||'').replace(/\s+/g, ' ').trim().slice(0, 800)
  );

  // Check localStorage after login
  const ls = await page.evaluate(() => {
    return {
      token: localStorage.getItem('medic_token') ? '[present]' : '[absent]',
      role: localStorage.getItem('user_role'),
      medic: localStorage.getItem('medic') ? '[present]' : '[absent]',
    };
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESULT SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Final URL     : ${finalUrl}`);
  console.log(`  Page title    : ${title}`);
  console.log(`  H1 headings   : ${JSON.stringify(h1s)}`);
  console.log(`  H2 headings   : ${JSON.stringify(h2s.slice(0, 6))}`);
  console.log(`  H3 headings   : ${JSON.stringify(h3s)}`);
  console.log(`  Nav items     : ${JSON.stringify(navItems)}`);
  console.log(`  Buttons       : ${JSON.stringify(buttons)}`);
  if (alerts.length) console.log(`  Alerts/errs   : ${JSON.stringify(alerts)}`);
  console.log(`  LocalStorage  : ${JSON.stringify(ls)}`);
  console.log(`  Body text     : ${bodyText}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  await browser.close();
  console.log('Done.');
})();
