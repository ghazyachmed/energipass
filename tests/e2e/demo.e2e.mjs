// End-to-end tests against the built app (dist/) in headless Chromium.
// Run: npm run test:e2e   (requires the `playwright` package and a Chromium build)
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, statSync } from 'node:fs';
import { startServer } from '../../scripts/serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUTPUT = new URL('../../test-results/', import.meta.url).pathname;
const SCREENSHOTS = `${OUTPUT}screenshots/`;
mkdirSync(SCREENSHOTS, { recursive: true });

let server;
let browser;
let baseUrl;

before(async () => {
  server = await startServer(0, new URL('../../dist/', import.meta.url).pathname.replace(/\/$/, ''));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser?.close();
  server?.close();
});

async function openApp({ viewport = { width: 1440, height: 900 }, route = 'assessment', permissions = [] } = {}) {
  const context = await browser.newContext({ viewport, locale: 'id-ID', timezoneId: 'Asia/Jakarta', permissions });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(String(error)));
  await page.goto(`${baseUrl}/#/${route}`);
  await page.waitForSelector('[data-bind="strip.baseline"], .brief-document');
  return { context, page, pageErrors };
}

const text = (page, selector) => page.locator(selector).first().innerText();
const strip = (page, key) => text(page, `[data-bind="strip.${key}"]`);

test('loads with simulation label, AI-disabled label, and no script errors', async () => {
  const { context, page, pageErrors } = await openApp();
  assert.equal(await text(page, '.badge-simulation'), 'Data simulasi');
  await page.waitForFunction(() => document.getElementById('ai-status-chip').textContent === 'AI belum diaktifkan');
  assert.match(await text(page, '#ai-panel'), /AI belum diaktifkan/);
  assert.equal(await page.locator('[data-action="ai-extract"]').isDisabled(), true);
  assert.equal(await strip(page, 'baseline'), '660.000 kWh/tahun');
  assert.equal(await strip(page, 'savings'), '113.520 kWh/tahun');
  assert.deepEqual(pageErrors, []);
  await context.close();
});

test('changing a baseline input recalculates every result', async () => {
  const { context, page } = await openApp();
  await page.fill('#f-inputs-baselinePowerKw', '120');
  assert.equal(await strip(page, 'baseline'), '720.000 kWh/tahun');
  assert.equal(await strip(page, 'savings'), '123.840 kWh/tahun');
  assert.equal(await text(page, '[data-bind="baseline.cost"]'), 'Rp 802.800.000/tahun');
  assert.equal(await text(page, '[data-parsed-for="baselinePowerKw"]'), 'Terbaca: 120 kW');
  await page.fill('#f-inputs-tariffRpPerKwh', '1.500');
  assert.equal(await text(page, '[data-parsed-for="tariffRpPerKwh"]'), 'Terbaca: 1.500 Rp/kWh');
  await context.close();
});

test('invalid values are rejected and block dependent results', async () => {
  const { context, page } = await openApp();
  const cases = [
    ['#f-inputs-baselinePowerKw', '-5', 'baselinePowerKw', /negatif/],
    ['#f-inputs-baselinePowerKw', 'abc', 'baselinePowerKw', /Masukkan angka/],
    ['#f-inputs-baselinePowerKw', '1e400', 'baselinePowerKw', /Masukkan angka/],
    ['#f-inputs-baselinePowerKw', '250000', 'baselinePowerKw', /bukan W atau kWh/],
    ['#f-inputs-operatingHoursPerYear', '9000', 'operatingHoursPerYear', /8\.760/],
    ['#f-inputs-tariffRpPerKwh', '1115000', 'tariffRpPerKwh', /Rp\/MWh/],
    ['#f-inputs-leakInvestmentRp', '-1', 'leakInvestmentRp', /negatif/],
  ];
  for (const [selector, value, key, pattern] of cases) {
    const original = await page.inputValue(selector);
    await page.fill(selector, value);
    assert.match(await text(page, `[data-error-for="${key}"]`), pattern, `${selector}=${value}`);
    assert.equal(await page.getAttribute(selector, 'aria-invalid'), 'true');
    assert.equal(await strip(page, 'savings'), 'Tidak dihitung');
    assert.match(await text(page, '[data-bind="strip.errors"]'), /input tidak valid/);
    await page.fill(selector, original);
  }
  assert.equal(await strip(page, 'savings'), '113.520 kWh/tahun');

  await page.check('input[name="f-inputs-hoursMode"][value="daily"]');
  await page.fill('#f-inputs-hoursPerDay', '24');
  await page.fill('#f-inputs-daysPerYear', '366');
  assert.match(await text(page, '[data-error-for="daysPerYear"]'), /8\.784 jam/);
  await page.fill('#f-inputs-daysPerYear', '250');
  assert.equal(await text(page, '[data-bind="baseline.hours"]'), '6.000 jam/tahun');
  assert.equal(await strip(page, 'savings'), '113.520 kWh/tahun');
  await context.close();
});

test('scenario assumptions recalculate without double counting', async () => {
  const { context, page } = await openApp({ route: 'scenarios' });
  await page.fill('#f-inputs-leakReductionPct', '20');
  assert.equal(await text(page, '[data-bind="scn.leak.savingsKwh"]'), '132.000 kWh');
  assert.equal(await text(page, '[data-bind="scn.control.savingsKwh"]'), '52.800 kWh');
  // 110 x 6000 x (1 - 0.8 x 0.92) = 174,240 kWh, not 132,000 + 52,800 = 184,800 kWh
  assert.equal(await text(page, '[data-bind="scn.combined.savingsKwh"]'), '174.240 kWh');
  assert.match(await text(page, '.overlap'), /184\.800 kWh\/tahun/);
  assert.match(await text(page, '.overlap'), /10\.560 kWh\/tahun/);

  await page.fill('#f-inputs-controlReductionPct', '101');
  assert.match(await text(page, '[data-error-for="controlReductionPct"]'), /0 dan 100/);
  assert.match(await text(page, '[data-bind="scn.control.note"]'), /Tidak dihitung/);
  assert.match(await text(page, '[data-bind="scn.combined.note"]'), /Tidak dihitung/);
  assert.equal(await text(page, '[data-bind="scn.leak.savingsKwh"]'), '132.000 kWh');
  await context.close();
});

test('proposed scenario drives the financial screen and calculation panel', async () => {
  const { context, page } = await openApp({ route: 'scenarios' });
  await page.check('input[name="proposed-scenario"][value="leak"]');
  assert.match(await strip(page, 'scenario'), /S1/);
  await page.click('a[href="#/financial"].nav-item');
  await page.waitForSelector('#calc-panel');
  assert.equal(await text(page, '[data-bind="fin.payback"]'), '0,7 tahun (≈ 9 bulan)');
  assert.equal(await text(page, '[data-bind="fin.net"]'), 'Rp 61.590.000/tahun');
  await page.click('#calc-panel summary');
  const panel = await text(page, '#calc-panel');
  assert.match(panel, /E0 = P0 × H/);
  assert.match(panel, /110 kW × 6\.000 jam\/tahun/);
  assert.match(panel, /ΔE = E0 − E1/);
  assert.match(panel, /SIM-LOG-01/);
  assert.match(panel, /Rp 45\.000\.000 ÷ Rp 61\.590\.000\/tahun/);

  await page.selectOption('#fin-scenario', 'combined');
  assert.equal(await text(page, '[data-bind="fin.payback"]'), '2,1 tahun (≈ 25 bulan)');
  await context.close();
});

test('non-positive net savings never shows a positive payback', async () => {
  const { context, page } = await openApp();
  await page.fill('#f-inputs-leakOpexRpPerYear', '200000000');
  await page.goto(`${baseUrl}/#/financial`);
  await page.selectOption('#fin-scenario', 'leak');
  assert.equal(await text(page, '[data-bind="fin.payback"]'), 'Tidak tercapai: penghematan bersih ≤ 0');
  assert.equal(await page.getAttribute('[data-bind="fin.payback"]', 'data-status'), 'error');
  assert.match(await text(page, '[data-bind="fin.net"]'), /^−Rp/);
  await context.close();
});

test('CO2 appears only with a complete emission factor record', async () => {
  const { context, page } = await openApp({ route: 'financial' });
  assert.match(await text(page, '[data-bind-html="co2.output"]'), /tidak ditampilkan/);
  await page.fill('#f-inputs-emissionFactor', '0,8');
  assert.match(await text(page, '[data-bind-html="co2.output"]'), /wilayah grid, tahun, sumber/);
  await page.fill('#f-inputs-emissionRegion', 'Grid uji');
  await page.fill('#f-inputs-emissionYear', '2024');
  await page.fill('#f-inputs-emissionSource', 'Dokumen uji');
  assert.match(await text(page, '[data-bind-html="co2.output"]'), /90,8 tCO₂\/tahun/);
  await context.close();
});

test('evidence review status drives readiness', async () => {
  const { context, page } = await openApp({ route: 'evidence' });
  assert.match(await text(page, '[data-bind-html="evidence.summary"]'), /Belum ready: 1 catatan/);
  await page.selectOption('#f-evidence-controlReduction-review', 'checked');
  assert.match(await text(page, '[data-bind-html="evidence.summary"]'), /Ready untuk review manajemen/);
  assert.equal(await strip(page, 'readiness'), 'Ready untuk review manajemen');
  await page.selectOption('#f-evidence-tariff-review', 'revise');
  assert.match(await text(page, '[data-bind-html="evidence.summary"]'), /ditandai perlu revisi/);
  await page.selectOption('#evidence-filter', 'action');
  assert.equal(await page.locator('[data-evidence-card]:visible').count(), 1);
  await page.selectOption('#evidence-filter', 'assumed');
  assert.equal(await page.locator('[data-evidence-card]:visible').count(), 2);
  await page.selectOption('#evidence-filter', 'all');
  await page.fill('#f-evidence-tariff-documentDate', '2027-01-01');
  assert.match(await text(page, '[data-bind-html="evidence.tariff.issues"]'), /masa depan/);
  await context.close();
});

test('investment brief prints, saves as PDF, and copies as text', async () => {
  const { context, page } = await openApp({ route: 'brief', permissions: ['clipboard-read', 'clipboard-write'] });
  await page.evaluate(() => { window.__printCalls = 0; window.print = () => { window.__printCalls += 1; }; });
  await page.click('[data-action="print-brief"]');
  assert.equal(await page.evaluate(() => window.__printCalls), 1);

  await page.click('[data-action="copy-brief"]');
  await page.waitForFunction(() => document.getElementById('brief-action-status').textContent !== '');
  assert.match(await text(page, '#brief-action-status'), /disalin/);
  const clipboard = await page.evaluate(() => navigator.clipboard.readText());
  assert.match(clipboard, /8\. Langkah yang perlu disetujui/);
  assert.match(clipboard, /DATA SIMULASI/);

  await page.emulateMedia({ media: 'print' });
  assert.equal(await page.locator('.sidebar').isVisible(), false);
  assert.equal(await page.locator('[data-action="print-brief"]').isVisible(), false);
  const pdfPath = `${OUTPUT}investment-brief.pdf`;
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true });
  assert.ok(statSync(pdfPath).size > 10_000);
  try {
    const pdfText = execFileSync('pdftotext', ['-layout', pdfPath, '-'], { encoding: 'utf8' });
    assert.match(pdfText, /Investment Decision Brief/);
    assert.match(pdfText, /DATA SIMULASI/);
    assert.match(pdfText, /113\.520 kWh/);
    assert.doesNotMatch(pdfText, /Reset ke data contoh/);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await context.close();
});

test('state persists across reload and fixtures switch cleanly', async () => {
  const { context, page } = await openApp();
  await page.fill('#f-inputs-baselinePowerKw', '95');
  await page.reload();
  await page.waitForSelector('#f-inputs-baselinePowerKw');
  assert.equal(await page.inputValue('#f-inputs-baselinePowerKw'), '95');
  assert.equal(await text(page, '.badge-simulation'), 'Simulasi diubah');

  await page.selectOption('#fixture-select', 'sim-b');
  await page.click('[data-action="load-fixture"]');
  assert.equal(await page.inputValue('#f-inputs-baselinePowerKw'), '78');
  assert.equal(await text(page, '[data-bind="baseline.hours"]'), '4.800 jam/tahun');
  await page.goto(`${baseUrl}/#/evidence`);
  assert.match(await text(page, '[data-bind-html="evidence.summary"]'), /Baseline daya belum berasal dari pengukuran/);
  await page.click('[data-action="reset-fixture"]');
  assert.equal(await text(page, '.badge-simulation'), 'Data simulasi');
  await context.close();
});

test('keyboard: skip link, navigation links, and help dialog', async () => {
  const { context, page } = await openApp();
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.className), 'skip-link');
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'main-content');

  await page.focus('a.nav-item[href="#/evidence"]');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Evidence Review');
  assert.equal(await page.evaluate(() => document.activeElement.tagName), 'H1');
  assert.equal(await page.getAttribute('a.nav-item[href="#/evidence"]', 'aria-current'), 'step');

  await page.focus('#help-button');
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#help-dialog').isVisible(), true);
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#help-dialog').isVisible(), false);
  await context.close();
});

const ROUTES = ['assessment', 'scenarios', 'financial', 'evidence', 'brief'];

test('mobile: no horizontal page overflow and working menu', async () => {
  const { context, page } = await openApp({ viewport: { width: 390, height: 844 } });
  for (const route of ROUTES) {
    await page.goto(`${baseUrl}/#/${route}`);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${route} overflows by ${overflow}px`);
    await page.screenshot({ path: `${SCREENSHOTS}mobile-${route}.png`, fullPage: true });
  }
  assert.equal(await page.locator('#sidebar').isVisible(), false);
  await page.click('#mobile-menu');
  assert.equal(await page.getAttribute('#mobile-menu', 'aria-expanded'), 'true');
  await page.click('a.nav-item[href="#/scenarios"]');
  await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Improvement Scenarios');
  assert.equal(await page.getAttribute('#mobile-menu', 'aria-expanded'), 'false');
  await page.screenshot({ path: `${SCREENSHOTS}mobile-menu-closed.png` });
  await context.close();
});

test('desktop screenshots of every screen', async () => {
  const { context, page } = await openApp();
  for (const route of ROUTES) {
    await page.goto(`${baseUrl}/#/${route}`);
    await page.waitForTimeout(150);
    if (route === 'financial') await page.click('#calc-panel summary');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(overflow <= 0, `${route} overflows by ${overflow}px`);
    await page.screenshot({ path: `${SCREENSHOTS}desktop-${route}.png`, fullPage: true });
  }
  await context.close();
});
