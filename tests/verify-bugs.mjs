import { chromium } from '@playwright/test';

const SCREENSHOT_DIR = 'C:/Users/StreamLab/Desktop/hamshiraGo/test-screenshots';
const BASE = 'https://medic.hamshirago.uz';

const results = {};

(async () => {
  const browser = await chromium.launch();

  // ========== CLIN-BUG-1: /clinic/auth form visibility ==========
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

    try {
      await page.goto(`${BASE}/clinic/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) { console.log('CLIN-BUG-1 nav:', e.message); }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-clin-bug-1-auth.png`, fullPage: true });

    const tel = await page.locator('input[type="tel"]').count();
    const pwd = await page.locator('input[type="password"]').count();
    const sub = await page.locator('button[type="submit"]').count();

    let telVisible = false, pwdVisible = false, subVisible = false;
    try { telVisible = tel > 0 && await page.locator('input[type="tel"]').first().isVisible(); } catch {}
    try { pwdVisible = pwd > 0 && await page.locator('input[type="password"]').first().isVisible(); } catch {}
    try { subVisible = sub > 0 && await page.locator('button[type="submit"]').first().isVisible(); } catch {}

    const bodyText = (await page.locator('body').textContent() || '').slice(0, 500);

    results.CLIN_BUG_1 = {
      status: (telVisible && pwdVisible && subVisible) ? 'PASS' : 'FAIL',
      tel: `count=${tel} visible=${telVisible}`,
      pwd: `count=${pwd} visible=${pwdVisible}`,
      sub: `count=${sub} visible=${subVisible}`,
      bodySnippet: bodyText.replace(/\s+/g, ' ').trim(),
      consoleErrors: consoleErrors.slice(0, 5),
      screenshot: `${SCREENSHOT_DIR}/verify-clin-bug-1-auth.png`,
    };
    await ctx.close();
  }

  // ========== CLIN-BUG-2: /clinic/dashboard currency ==========
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    // Inject fake CEO token
    await page.goto(`${BASE}/clinic/auth`, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
    await page.evaluate(() => {
      localStorage.setItem('clinic_token', 'fake.jwt.token');
      localStorage.setItem('clinic_user', JSON.stringify({ id: 'fake', role: 'CEO', clinicId: 'fake' }));
    });
    try {
      await page.goto(`${BASE}/clinic/dashboard`, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) { console.log('CLIN-BUG-2 nav:', e.message); }
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-clin-bug-2-dashboard.png`, fullPage: true });

    const html = await page.content();
    const text = await page.locator('body').textContent() || '';

    const rubleCount = (html.match(/₽/g) || []).length;
    const sumCount = (text.match(/сум|so['']?m/gi) || []).length;
    const uzsCount = (html.match(/UZS/g) || []).length;

    results.CLIN_BUG_2 = {
      status: rubleCount === 0 ? 'PASS' : 'FAIL',
      ruble: rubleCount,
      sum: sumCount,
      UZS: uzsCount,
      url: page.url(),
      textSnippet: text.replace(/\s+/g, ' ').trim().slice(0, 400),
      screenshot: `${SCREENSHOT_DIR}/verify-clin-bug-2-dashboard.png`,
    };
    await ctx.close();
  }

  // ========== WM-BUG-1/2/3: web-medic /auth + login ==========
  {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const consoleErrors = [];
    const consoleAll = [];
    page.on('console', m => {
      consoleAll.push(`[${m.type()}] ${m.text()}`);
      if (m.type() === 'error') consoleErrors.push(m.text());
    });

    try {
      await page.goto(`${BASE}/auth`, { waitUntil: 'networkidle', timeout: 30000 });
    } catch (e) { console.log('WM /auth nav:', e.message); }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-wm-bug-auth.png`, fullPage: true });

    const tel = await page.locator('input[type="tel"]').count();
    const pwd = await page.locator('input[type="password"]').count();
    let telVisible = false, pwdVisible = false;
    try { telVisible = tel > 0 && await page.locator('input[type="tel"]').first().isVisible(); } catch {}
    try { pwdVisible = pwd > 0 && await page.locator('input[type="password"]').first().isVisible(); } catch {}

    const wm1_status = (telVisible && pwdVisible) ? 'PASS' : 'FAIL';

    // Try to login
    let loginResult = 'not-attempted';
    let loginStatus = null;
    let dashboardUrl = '';
    let dashboardErrors = [];
    if (telVisible && pwdVisible) {
      await page.locator('input[type="tel"]').first().fill('+998909876543');
      await page.locator('input[type="password"]').first().fill('test1234');

      const respPromise = page.waitForResponse(r => r.url().includes('/auth/login') || r.url().includes('/login'), { timeout: 15000 }).catch(() => null);
      await page.locator('button[type="submit"]').first().click().catch(() => {});
      const resp = await respPromise;
      if (resp) { loginStatus = resp.status(); loginResult = `HTTP ${loginStatus}`; }
      else { loginResult = 'no-response'; }

      await page.waitForTimeout(4000);
      dashboardUrl = page.url();
      await page.screenshot({ path: `${SCREENSHOT_DIR}/verify-wm-bug-dashboard.png`, fullPage: true });
      dashboardErrors = consoleErrors.filter(e => e.includes('418') || e.includes('Minified React error #418') || e.toLowerCase().includes('react error'));
    }

    results.WM_BUG_1 = {
      status: wm1_status,
      tel: `count=${tel} visible=${telVisible}`,
      pwd: `count=${pwd} visible=${pwdVisible}`,
      screenshot: `${SCREENSHOT_DIR}/verify-wm-bug-auth.png`,
    };
    results.WM_BUG_2_login = {
      status: loginStatus && loginStatus >= 200 && loginStatus < 300 ? 'PASS' : (loginStatus === 401 ? 'FAIL (401)' : `FAIL (${loginResult})`),
      httpStatus: loginStatus,
      finalUrl: dashboardUrl,
    };
    results.WM_BUG_3_react418 = {
      status: dashboardErrors.length === 0 ? 'PASS' : 'FAIL',
      errors: dashboardErrors.slice(0, 5),
      allErrorsCount: consoleErrors.length,
      sampleErrors: consoleErrors.slice(0, 5),
      screenshot: `${SCREENSHOT_DIR}/verify-wm-bug-dashboard.png`,
    };
    await ctx.close();
  }

  await browser.close();
  console.log('\n===== VERIFY RESULTS =====');
  console.log(JSON.stringify(results, null, 2));
})().catch(e => { console.error('FATAL:', e); process.exit(1); });
