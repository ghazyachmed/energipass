// Record a silent screen capture (about 85 seconds) of the running demo.
// Usage: node scripts/record-demo.mjs <output-directory>
// Requires: npm run build, the `playwright` package, and ffmpeg for MP4 conversion.
// Captions on screen describe each step. All data shown is the simulated fixture.
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, renameSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { startServer } from './serve.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const outputDirectory = resolve(process.argv[2] ?? 'test-results/video');
mkdirSync(outputDirectory, { recursive: true });

const VIEWPORT = { width: 1280, height: 720 };
const server = await startServer(0, resolve('dist'));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT, locale: 'id-ID', timezoneId: 'Asia/Jakarta',
  recordVideo: { dir: outputDirectory, size: VIEWPORT },
});
const page = await context.newPage();
const wait = (ms) => page.waitForTimeout(ms);

async function caption(step, text) {
  await page.evaluate(([label, body]) => {
    let box = document.getElementById('demo-caption');
    if (!box) {
      box = document.createElement('div');
      box.id = 'demo-caption';
      box.style.cssText = 'position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;max-width:880px;'
        + 'background:rgba(7,22,41,.92);color:#fff;padding:12px 18px;font:600 17px/1.4 system-ui,sans-serif;'
        + 'border-left:5px solid #63aaa3;box-shadow:0 8px 24px rgba(0,0,0,.25)';
      document.body.append(box);
    }
    box.innerHTML = `<span style="color:#a9d5d1;font-size:13px;letter-spacing:.08em">${label} · DATA SIMULASI</span><br>${body}`;
  }, [step, text]);
}

async function scrollTo(selector) {
  await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy({ top: -90 }));
}

async function slowType(selector, value) {
  await page.click(selector, { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type(selector, value, { delay: 140 });
}

// Scene 1: problem (0-12 s)
await page.goto(`${baseUrl}/#/assessment`);
await page.evaluate(() => { localStorage.clear(); });
await page.reload();
await page.waitForSelector('#f-inputs-baselinePowerKw');
await caption('1/5 MASALAH', 'Audit energi menemukan potensi hemat pada sistem kompresor. Manajemen butuh justifikasi investasi yang angkanya bisa diperiksa.');
await wait(6000);
await caption('1/5 MASALAH', 'EnergiAction Bankable menyusun alur: temuan audit, baseline, skenario, analisis finansial, evidence, investment brief.');
await wait(6000);

// Scene 2: input (12-32 s)
await scrollTo('#baseline-title');
await caption('2/5 INPUT DATA ENERGI', 'Engineer mengisi daya rata-rata terukur, jam operasi, dan tarif. Hasil di bagian atas dihitung ulang langsung.');
await wait(2500);
await slowType('#f-inputs-baselinePowerKw', '-5');
await caption('2/5 INPUT DATA ENERGI', 'Nilai tidak valid ditolak. Hasil yang bergantung pada input tersebut tidak dihitung.');
await wait(4000);
await slowType('#f-inputs-baselinePowerKw', '110');
await wait(1500);
await slowType('#f-inputs-operatingHoursPerYear', '9000');
await wait(3000);
await slowType('#f-inputs-operatingHoursPerYear', '6000');
await caption('2/5 INPUT DATA ENERGI', 'Baseline: 110 kW × 6.000 jam/tahun = 660.000 kWh/tahun.');
await wait(4500);

// Scene 3: scenarios (32-52 s)
await page.click('a.nav-item[href="#/scenarios"]');
await page.waitForSelector('#f-inputs-leakReductionPct');
await caption('3/5 PERBANDINGAN SKENARIO', 'Bandingkan perbaikan kebocoran, optimasi kontrol, gabungan, dan tanpa intervensi.');
await wait(4000);
await slowType('#f-inputs-leakReductionPct', '15');
await caption('3/5 PERBANDINGAN SKENARIO', 'Asumsi pengurangan daya diubah. Seluruh baris dihitung ulang.');
await wait(3500);
await scrollTo('#overlap-title');
await caption('3/5 PERBANDINGAN SKENARIO', 'Opsi gabungan dihitung berurutan. Penghematan yang tumpang tindih tidak dijumlahkan dua kali.');
await wait(5000);
await slowType('#f-inputs-leakReductionPct', '10');
await wait(2500);

// Scene 4: financial analysis (52-70 s)
await page.click('a.nav-item[href="#/financial"]');
await page.waitForSelector('#calc-panel');
await caption('4/5 ANALISIS INVESTASI', 'Konsumsi baseline, konsumsi setelah perbaikan, penghematan, biaya investasi, dan simple payback.');
await wait(4500);
await page.click('#calc-panel summary');
await scrollTo('#calc-panel');
await caption('4/5 ANALISIS INVESTASI', '"Lihat Perhitungan" menampilkan rumus, substitusi angka, dan sumber setiap input.');
await wait(6000);
await scrollTo('#realisation-title');
await caption('4/5 ANALISIS INVESTASI', 'Uji realisasi: payback jika hanya 50% atau 75% penghematan tercapai.');
await wait(5000);

// Scene 5: evidence and brief (70-88 s)
await page.click('a.nav-item[href="#/evidence"]');
await page.waitForSelector('#f-evidence-controlReduction-review');
await caption('5/5 EVIDENCE DAN KEPUTUSAN', 'Register evidence membedakan pengukuran, dokumen, asumsi, dan data yang belum tersedia.');
await wait(3500);
await scrollTo('[data-evidence-card="controlReduction"]');
await page.selectOption('#f-evidence-controlReduction-review', 'checked');
await scrollTo('[data-bind-html="evidence.summary"]');
await caption('5/5 EVIDENCE DAN KEPUTUSAN', 'Setelah engineer memeriksa asumsi, status menjadi Ready untuk review manajemen. Ready bukan sertifikasi.');
await wait(4500);
await page.click('a.nav-item[href="#/brief"]');
await page.waitForSelector('.brief-document');
await caption('5/5 EVIDENCE DAN KEPUTUSAN', 'Investment Brief untuk Plant Manager: dapat dicetak atau disimpan sebagai PDF.');
await wait(4000);
await scrollTo('.brief-footer');
await caption('5/5 KETERBATASAN', 'Data simulasi. Simple payback tanpa nilai waktu uang. AI belum diaktifkan pada demo ini.');
await wait(5000);

await context.close();
await browser.close();
server.close();

const webm = readdirSync(outputDirectory).filter((name) => name.endsWith('.webm')).map((name) => join(outputDirectory, name)).pop();
const webmTarget = join(outputDirectory, 'energiaction-demo.webm');
renameSync(webm, webmTarget);
const mp4Target = join(outputDirectory, 'energiaction-demo.mp4');
try {
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', webmTarget, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '23', '-movflags', '+faststart', mp4Target]);
  console.log(`MP4: ${mp4Target}`);
} catch (error) {
  console.log(`ffmpeg not available or failed (${error.message}). WebM: ${webmTarget}`);
}
