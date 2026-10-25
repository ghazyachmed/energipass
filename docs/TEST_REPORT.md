# Laporan Pengujian

Tanggal: 25 Oktober 2026. Branch: `claude/sweet-newton-rqi1vx`.

Environment: Linux, Node.js 22.22.0, npm 10.9.4, Playwright 1.63.0 dengan Chromium 153 (headless), Wrangler 4.152.0.

## Ringkasan

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| Build asset statis | `npm run build` | Lulus. 23 file di `dist/`. |
| Unit test | `npm test` | 50 lulus, 0 gagal |
| End-to-end test (Chromium) | `npm run test:e2e` | 13 lulus, 0 gagal pada 4 run terakhir. Run pertama gagal 2 test (bug skip link, urutan langkah test). Run kedua gagal 1 test (test membaca status salin sebelum proses async selesai). Keduanya diperbaiki. |
| Bundling Worker | `npx wrangler@4 deploy --dry-run` | Lulus. Bundle Worker + SDK sekitar 690 KiB. Binding `env.ASSETS` terbaca. Tidak ada deployment. |
| Runtime Worker lokal | `npx wrangler@4 dev` lalu `curl` | `/api/ai/status` 200 `{"enabled":false,...}`. `/api/ai/extract` 503 `ai_disabled`. `/` dan `/src/main.js` 200. `/api/unknown` 404. |
| Print / Save as PDF | E2E test 9 dengan `page.pdf()` | PDF A4 terbentuk. `pdftotext` memuat judul brief, label DATA SIMULASI, dan 113.520 kWh. Navigasi tidak ikut tercetak. |
| Video demo | `node scripts/record-demo.mjs` | MP4 H.264 1280×720, 80 detik, tanpa suara. |
| CI GitHub Actions | `.github/workflows/ci.yml` (Ubuntu, `npm ci`, unit test, build, E2E) | Run #1 pada commit `dc7fc24`: success. https://github.com/ghazyachmed/energipass/actions/runs/40202096776 |

Temuan yang diperbaiki selama pengujian:

1. `wrangler dev` menolak modul Worker karena named export non-handler (`AI_MODEL`). Logika dipindah ke `worker/handler.js`. Test 50 menjaga agar entry module hanya mengekspor `default`.
2. Skip link (`#main-content`) memicu router hash dan mengembalikan halaman ke Assessment. Router sekarang hanya memproses hash `#/<layar>`. E2E test 11 memeriksa perilaku ini.
3. Tabel skenario terpotong di lebar 1280 px dan sulit dibaca di 390 px. Tabel dirapatkan dan berubah menjadi kartu di layar sempit.

## Cakupan terhadap kebutuhan

| Kebutuhan | Bukti test |
| --- | --- |
| Rumus energi, penghematan, net savings, payback | Unit 13, 15, 21. E2E 2, 5 |
| Tidak menjumlahkan penghematan yang tumpang tindih | Unit 14, 22. E2E 4 |
| Payback tidak positif jika net savings ≤ 0 | Unit 16, 18. Unit brief 11. E2E 6 |
| Tolak daya negatif, jam > 8.760, persentase di luar 0-100%, NaN, Infinity, satuan tidak konsisten | Unit 33, 36 sampai 41. E2E 3 |
| Kesalahan input tidak merusak hasil lain | Unit 23, 24, 42. E2E 3, 4 |
| Perubahan skenario | Unit 22, 26. E2E 4, 5 |
| Status evidence dan arti Ready | Unit 25 sampai 29. E2E 8 |
| CO₂ hanya dengan sumber lengkap | Unit 19, 30, 43. Unit brief 12. E2E 7 |
| Ekspor ringkasan (print, PDF, teks) | Unit brief 9 sampai 12. E2E 9 |
| AI hanya mengusulkan, tidak mengarang angka | Unit 1 sampai 5, 45 sampai 50 |
| Label simulasi dan label "AI belum diaktifkan" | E2E 1. Unit brief 9 |
| Draf MAJU:ON maksimal 1.400 karakter | Unit 6 sampai 8 |
| Navigasi keyboard, dialog | E2E 11 |
| Mobile tanpa overflow horizontal, menu | E2E 12 (390×844) |
| Desktop tanpa overflow horizontal | E2E 13 (1440×900) |
| Persistensi dan pergantian data contoh | E2E 10 |

## Daftar unit test (50)

```text
ai-extraction: 1 accepts items whose quote and value appear in the source
ai-extraction: 2 rejects invented values, invented quotes, wrong units, and out-of-range values
ai-extraction: 3 rejects responses with fields outside the schema, such as savings
ai-extraction: 4 rejects parameter names outside the enum and extra item keys
ai-extraction: 5 schema contains no financial result fields
application-notes: 6 application notes contain six drafts
application-notes: 7 each draft answer is at most 1,400 characters
application-notes: 8 drafts state that user interviews have not been done
brief: 9 brief contains every required section with consistent numbers
brief: 10 brief lists approvals and missing evidence for fixture B
brief: 11 brief warns when net savings are not positive
brief: 12 brief marks modified data and includes CO2 only when complete
calculations: 13 Annual Energy = Power x Operating Hours
calculations: 14 sequential reductions do not add up
calculations: 15 scenario result follows the explicit formulas
calculations: 16 payback is not positive when net savings are zero or negative
calculations: 17 no-intervention scenario has zero savings and no payback
calculations: 18 100% reduction and 0% reduction edge cases
calculations: 19 CO2 = MWh saved x factor
calculations: 20 savings realisation keeps investment and opex fixed
model-evidence: 21 fixture A: all four scenarios match hand calculation
model-evidence: 22 changing a scenario assumption recalculates dependent scenarios only
model-evidence: 23 invalid control input blocks control and combined, not leak
model-evidence: 24 invalid baseline blocks every scenario and readiness
model-evidence: 25 fixture A is not ready until the engineer reviews the control assumption
model-evidence: 26 required evidence depends on the proposed scenario
model-evidence: 27 fixture B: nameplate baseline and missing evidence block readiness
model-evidence: 28 evidence dates: invalid, future, and stale
model-evidence: 29 spot measurement counts as measured but adds a warning
model-evidence: 30 CO2 is shown only with a complete emission factor record
model-evidence: 31 data origin turns to modified after an edit
numbers: 32 parses plain, grouped, and decimal forms
numbers: 33 rejects empty, letters, exponent, Infinity, NaN, and malformed separators
numbers: 34 extractNumbers finds Indonesian-formatted numbers in a sentence
validation: 35 fixture A inputs are valid
validation: 36 rejects negative and zero power
validation: 37 rejects operating hours above 8,760 per year
validation: 38 rejects daily mode combination above 8,760 hours
validation: 39 rejects percentages outside 0-100
validation: 40 rejects NaN and Infinity values
validation: 41 flags unit errors for tariff, power, and emission factor
validation: 42 field group errors are isolated
validation: 43 CO2 inputs require factor, region, year, and source together
validation: 44 required text and choice fields
worker: 45 status reports disabled without the secret
worker: 46 extract sends structured-output request and filters unsupported items
worker: 47 extract handles refusal, truncation, invalid JSON, and schema violations
worker: 48 extract rejects bad requests before calling the provider
worker: 49 non-API paths are served from static assets
worker: 50 entry module exports only the default fetch handler
```

## Daftar end-to-end test (13)

```text
1  loads with simulation label, AI-disabled label, and no script errors
2  changing a baseline input recalculates every result
3  invalid values are rejected and block dependent results
4  scenario assumptions recalculate without double counting
5  proposed scenario drives the financial screen and calculation panel
6  non-positive net savings never shows a positive payback
7  CO2 appears only with a complete emission factor record
8  evidence review status drives readiness
9  investment brief prints, saves as PDF, and copies as text
10 state persists across reload and fixtures switch cleanly
11 keyboard: skip link, navigation links, and help dialog
12 mobile: no horizontal page overflow and working menu
13 desktop screenshots of every screen
```

## Yang belum diuji

| Hal | Alasan |
| --- | --- |
| Panggilan AI ke API model nyata | Tidak ada secret `ANTHROPIC_API_KEY`. Test Worker memakai stub fetch lokal. |
| Deployment Cloudflare dan URL publik | Membutuhkan akun dan izin pemilik. Belum dijalankan. |
| Firefox dan Safari | Hanya Chromium yang tersedia. |
| Screen reader | Belum diuji dengan NVDA, VoiceOver, atau TalkBack. Struktur label, fieldset, dan aria sudah dipasang. |
| Kebutuhan pengguna | Wawancara pengguna belum dilakukan. Test hanya membuktikan perilaku perangkat lunak. |
