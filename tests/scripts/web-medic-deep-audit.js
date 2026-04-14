/**
 * Deep audit — inspect each page content in detail
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
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function apiPost(apiPath, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'hamshirago-production-0a65.up.railway.app',
      port: 443, path: apiPath, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(options, res => {
      let b = '';
      res.on('data', c => b += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(b) }); } catch { resolve({ status: res.statusCode, data: b }); } });
    });
    req.on('error', reject);
    req.write(data); req.end();
  });
}

async function getToken() {
  const r = await apiPost('/medics/login', { phone: PHONE, password: PASSWORD });
  if (r.status !== 200 && r.status !== 201) throw new Error(`Login failed: ${r.status}`);
  return { token: r.data.access_token, medic: r.data.medic };
}

async function main() {
  ensureDir(SCREENSHOTS_DIR);

  const { token, medic } = await getToken();
  console.log(`Token obtained for: ${medic.name} (${medic.verificationStatus})`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });

  await context.addInitScript((t) => {
    localStorage.setItem('medic_onboarding_completed', 'true');
    localStorage.setItem('medic_token', t);
    localStorage.setItem('token', t);
    localStorage.setItem('access_token', t);
    localStorage.setItem('authToken', t);
  }, token);

  const page = await context.newPage();

  const findings = {};

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
    const errors = [], warnings = [], networkErrors = [], hydrationErrors = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.removeAllListeners('response');

    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        errors.push(text);
        if (/hydrat|did not match/i.test(text)) hydrationErrors.push(text);
      } else if (msg.type() === 'warning' && !/DevTools|React DevTools/i.test(text)) {
        warnings.push(text);
      }
    });
    page.on('pageerror', err => errors.push(`[PAGE ERROR] ${err.message}`));
    page.on('response', r => {
      const s = r.status();
      const u = r.url();
      if (s >= 400 && !u.includes('favicon') && !u.includes('robots')) {
        networkErrors.push({ method: r.request().method(), status: s, url: u });
      }
    });

    await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    const finalUrl = page.url();
    const redirected = !finalUrl.startsWith(`${BASE_URL}${p.path === '/' ? '' : p.path}`);

    // Deep content analysis
    const analysis = await page.evaluate((pagePath) => {
      const result = {
        title: document.title,
        h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent?.trim()),
        h2: Array.from(document.querySelectorAll('h2')).map(el => el.textContent?.trim()).slice(0, 10),
        bodyText: (document.body?.innerText || '').substring(0, 1000),
        hasLoadingSpinner: !!document.querySelector('[class*="loading"], [class*="spinner"], [class*="skeleton"]'),
        hasSkeleton: !!document.querySelector('[class*="skeleton"], [class*="Skeleton"]'),
        hasEmptyState: !!document.querySelector('[class*="empty"], [class*="Empty"]'),
        forms: Array.from(document.querySelectorAll('form')).map(f => ({
          inputs: f.querySelectorAll('input').length,
          buttons: f.querySelectorAll('button').length,
          action: f.action,
        })),
        tables: document.querySelectorAll('table').length,
        cards: document.querySelectorAll('[class*="card"], [class*="Card"]').length,
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src?.substring(0, 80),
          alt: img.alt,
          loaded: img.complete && img.naturalWidth > 0,
        })),
        links: Array.from(document.querySelectorAll('a[href]')).map(a => ({ text: a.textContent?.trim(), href: a.href })).slice(0, 10),
        allButtons: Array.from(document.querySelectorAll('button')).map(b => b.textContent?.trim()?.substring(0, 40)).filter(Boolean),
        // Check for specific content per page
        mapElement: !!document.querySelector('[class*="map"], #map, .leaflet-container, canvas[id*="map"]'),
        chartElement: !!document.querySelector('canvas, [class*="chart"], [class*="Chart"]'),
        statsCards: document.querySelectorAll('[class*="stat"], [class*="Stat"]').length,
      };
      return result;
    }, p.path);

    // Screenshot
    const screenshotPath = path.join(SCREENSHOTS_DIR, `audit-${p.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });

    // Specific checks per page
    const pageIssues = [];

    if (p.path === '/') {
      // Dashboard
      if (analysis.h1.length === 0 && !analysis.bodyText.includes('аказ') && !analysis.bodyText.includes('Dashboard')) {
        pageIssues.push('Dashboard has no meaningful heading content');
      }
    }

    if (p.path === '/orders') {
      // Should show orders list or empty state
      const hasOrderContent = analysis.bodyText.includes('заказ') || analysis.bodyText.includes('order') || analysis.bodyText.includes('Order');
      if (!hasOrderContent) pageIssues.push('Orders page has no order-related content');
    }

    if (p.path === '/work-zone') {
      if (!analysis.mapElement) pageIssues.push('Work zone: no map element found (expected interactive map)');
    }

    if (p.path === '/wallet') {
      const hasBalance = analysis.bodyText.includes('баланс') || analysis.bodyText.includes('БАЛАНС') || analysis.bodyText.includes('Balance') || analysis.bodyText.includes('UZS') || analysis.bodyText.includes('сум');
      if (!hasBalance) pageIssues.push('Wallet page has no balance/financial data visible');
    }

    if (p.path === '/verification') {
      // Should show PENDING status since medic.verificationStatus is PENDING
      const hasPending = analysis.bodyText.includes('PENDING') || analysis.bodyText.includes('Ожида') || analysis.bodyText.includes('На рассмотрении') || analysis.bodyText.includes('НА РАССМОТРЕНИИ');
      if (!hasPending) pageIssues.push('Verification: PENDING status not visible (medic is PENDING)');
    }

    findings[p.name] = {
      path: p.path,
      finalUrl,
      redirected,
      errors,
      warnings,
      networkErrors,
      hydrationErrors,
      analysis,
      issues: pageIssues,
      screenshotPath,
    };

    console.log(`[DONE] ${p.name}: errors=${errors.length}, warns=${warnings.length}, netErrs=${networkErrors.length}, issues=${pageIssues.length}`);
  }

  // Check login page UI bug specifically
  console.log('\n[UI LOGIN BUG] Checking phone masking behavior...');
  const testPage = await context.newPage();
  await testPage.goto(`${BASE_URL}/auth`, { waitUntil: 'networkidle', timeout: 20000 });
  await testPage.waitForTimeout(1500);
  const phoneInput = await testPage.$('input[type="tel"]');
  if (phoneInput) {
    // The app formats phone with spaces, turning +998909876543 into a masked version
    // The backend expects +998909876543 but the app may send +998 90 987 65 43 or similar
    await phoneInput.fill('+998909876543');
    const maskedValue = await phoneInput.evaluate(el => el.value);
    await testPage.waitForTimeout(500);
    const maskedValue2 = await phoneInput.evaluate(el => el.value);
    console.log(`[UI LOGIN BUG] Typed: "+998909876543" -> field shows: "${maskedValue}" -> after settle: "${maskedValue2}"`);

    // Try typing character by character to see masking
    await phoneInput.fill('');
    await phoneInput.type('998909876543', { delay: 30 });
    const maskedValue3 = await phoneInput.evaluate(el => el.value);
    console.log(`[UI LOGIN BUG] Typed (no +): "998909876543" -> field shows: "${maskedValue3}"`);
  }
  await testPage.close();

  await context.close();
  await browser.close();

  // PRINT DETAILED REPORT
  console.log('\n' + '='.repeat(70));
  console.log('DEEP AUDIT REPORT — web-medic.hamshirago.uz');
  console.log('='.repeat(70));

  for (const [name, data] of Object.entries(findings)) {
    const hasProblems = data.errors.length > 0 || data.networkErrors.length > 0 || data.issues.length > 0 || data.redirected;
    const status = data.redirected ? 'ERROR' : (hasProblems ? 'WARN' : 'OK');
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`PAGE: ${name.toUpperCase()} [${status}]`);
    console.log(`URL: ${data.finalUrl}`);
    console.log(`Title: ${data.analysis.title}`);
    console.log(`H1: ${data.analysis.h1.join(', ') || '(none)'}`);
    console.log(`H2: ${data.analysis.h2.join(' | ') || '(none)'}`);
    console.log(`Cards: ${data.analysis.cards}, Tables: ${data.analysis.tables}, Forms: ${data.analysis.forms.length}`);
    console.log(`Buttons: [${data.analysis.allButtons.join('] [')}]`);
    console.log(`Images: ${data.analysis.images.length} (broken: ${data.analysis.images.filter(i => !i.loaded).length})`);
    if (data.analysis.images.filter(i => !i.loaded).length > 0) {
      data.analysis.images.filter(i => !i.loaded).forEach(img => console.log(`  BROKEN IMG: ${img.src}`));
    }
    if (data.analysis.mapElement) console.log('  Map: FOUND');
    if (data.analysis.chartElement) console.log('  Chart: FOUND');
    console.log(`Skeleton: ${data.analysis.hasSkeleton}, EmptyState: ${data.analysis.hasEmptyState}`);
    console.log(`Content preview: "${data.analysis.bodyText.replace(/\n/g, ' ').substring(200, 500)}"`);

    if (data.issues.length > 0) {
      console.log('FUNCTIONAL ISSUES:');
      data.issues.forEach(i => console.log(`  - ${i}`));
    }

    if (data.errors.length > 0) {
      console.log(`CONSOLE ERRORS (${data.errors.length}):`);
      data.errors.forEach(e => console.log(`  ERR: ${e}`));
    }

    if (data.hydrationErrors.length > 0) {
      console.log('HYDRATION ERRORS:');
      data.hydrationErrors.forEach(e => console.log(`  HYDRATION: ${e}`));
    }

    if (data.networkErrors.length > 0) {
      console.log(`NETWORK ERRORS (${data.networkErrors.length}):`);
      data.networkErrors.forEach(e => console.log(`  ${e.method} ${e.status} ${e.url}`));
    }

    if (data.warnings.length > 0) {
      console.log(`CONSOLE WARNINGS (${data.warnings.length}):`);
      data.warnings.slice(0, 5).forEach(w => console.log(`  WARN: ${w}`));
    }

    console.log(`Screenshot: ${data.screenshotPath}`);
  }

  console.log('\n' + '='.repeat(70));
}

main().catch(e => { console.error(e); process.exit(1); });
