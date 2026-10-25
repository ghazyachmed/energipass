import { esc } from '../dom.js';
import { numberField, textField, textAreaField, selectField, radioGroup } from '../fields.js';
import { EQUIPMENT_TYPES, MEASUREMENT_METHODS, HOURS_MODES } from '../../domain/validation.js';
import { FIXTURES } from '../../fixtures/compressor-fixtures.js';
import { MAX_AUDIT_TEXT_CHARS } from '../../ai/extraction-schema.js';

export const assessmentScreen = {
  id: 'assessment',
  title: 'Assessment',
  render({ state, ai }) {
    const fixtureOptions = FIXTURES.map((fixture) => `<option value="${esc(fixture.id)}" ${fixture.id === state.fixtureId ? 'selected' : ''}>${esc(fixture.label)}</option>`).join('');
    return `
    <div class="page-header">
      <div>
        <p class="eyebrow">Langkah 1 dari 5</p>
        <h1 tabindex="-1">Industrial Energy Assessment</h1>
        <p>Masukkan data audit sistem kompresor. Ringkasan hasil di atas diperbarui setiap kali input berubah.</p>
      </div>
    </div>

    <section class="section" aria-labelledby="fixture-title">
      <div class="section-header"><div><h2 class="section-title" id="fixture-title">Skenario audit</h2>
        <p class="section-subtitle">Pilih data contoh. Semua data contoh adalah simulasi fiktif.</p></div></div>
      <div class="section-body fixture-row">
        <div class="field grow">
          <label for="fixture-select">Data contoh</label>
          <select class="select" id="fixture-select">${fixtureOptions}</select>
        </div>
        <button class="secondary-button" type="button" data-action="load-fixture">Muat data contoh</button>
        <p class="subtle-note fixture-note">Memuat data contoh mengganti seluruh input dan status evidence.</p>
      </div>
    </section>

    <section class="section" aria-labelledby="facility-title">
      <div class="section-header"><h2 class="section-title" id="facility-title">Fasilitas dan peralatan</h2></div>
      <div class="section-body form-grid">
        ${textField(state, { path: 'inputs.facilityName', label: 'Nama fasilitas' })}
        ${selectField(state, { path: 'inputs.equipmentType', label: 'Jenis peralatan', options: EQUIPMENT_TYPES })}
        ${textField(state, { path: 'inputs.equipmentDescription', label: 'Deskripsi peralatan', hint: 'Jumlah unit, daya nameplate, jenis kontrol, setpoint tekanan.', className: 'span-2' })}
        ${textAreaField(state, { path: 'inputs.auditFinding', label: 'Temuan audit', hint: 'Masalah yang teridentifikasi. Teks ini masuk ke Investment Brief.', className: 'span-2' })}
      </div>
    </section>

    <section class="section" aria-labelledby="baseline-title">
      <div class="section-header"><div><h2 class="section-title" id="baseline-title">Baseline energi</h2>
        <p class="section-subtitle">Annual Energy = Power (kW) × Operating Hours (jam/tahun)</p></div></div>
      <div class="section-body form-grid">
        ${numberField(state, { path: 'inputs.baselinePowerKw', label: 'Daya sebelum perbaikan', unit: 'kW', hint: 'Daya listrik input rata-rata selama jam operasi, bukan daya nameplate motor.' })}
        ${numberField(state, { path: 'inputs.tariffRpPerKwh', label: 'Tarif listrik efektif', unit: 'Rp/kWh', hint: 'Rata-rata dari tagihan fasilitas. Nilai contoh adalah simulasi, bukan tarif resmi.' })}
        ${radioGroup(state, { path: 'inputs.hoursMode', legend: 'Cara mengisi jam operasi', options: HOURS_MODES, className: 'span-2' })}
        <div class="span-2 form-grid nested" data-show-when="inputs.hoursMode:annual">
          ${numberField(state, { path: 'inputs.operatingHoursPerYear', label: 'Jam operasi per tahun', unit: 'jam/tahun', hint: 'Maksimal 8.760 jam per tahun.' })}
        </div>
        <div class="span-2 form-grid nested" data-show-when="inputs.hoursMode:daily">
          ${numberField(state, { path: 'inputs.hoursPerDay', label: 'Jam operasi per hari', unit: 'jam/hari' })}
          ${numberField(state, { path: 'inputs.daysPerYear', label: 'Hari operasi per tahun', unit: 'hari' })}
        </div>
        <dl class="computed span-2" aria-label="Hasil baseline">
          <div><dt>Jam operasi dipakai</dt><dd data-bind="baseline.hours"></dd></div>
          <div><dt>Konsumsi listrik baseline</dt><dd data-bind="baseline.energy"></dd></div>
          <div><dt>Biaya listrik baseline</dt><dd data-bind="baseline.cost"></dd></div>
        </dl>
      </div>
    </section>

    <section class="section" aria-labelledby="measurement-title">
      <div class="section-header"><div><h2 class="section-title" id="measurement-title">Sumber data pengukuran</h2>
        <p class="section-subtitle">Menentukan apakah baseline daya berstatus pengukuran, asumsi, atau belum tersedia di Evidence Review.</p></div></div>
      <div class="section-body form-grid">
        ${selectField(state, { path: 'inputs.measurementMethod', label: 'Metode data daya', options: MEASUREMENT_METHODS, className: 'span-2' })}
        ${textField(state, { path: 'evidence.baselinePower.reference', label: 'Referensi dokumen pengukuran', placeholder: 'Contoh: LOG-2026-09 data logger 7 hari' })}
        ${textField(state, { path: 'evidence.baselinePower.documentDate', label: 'Tanggal dokumen', type: 'date' })}
      </div>
    </section>

    <section class="section" aria-labelledby="cost-title">
      <div class="section-header"><div><h2 class="section-title" id="cost-title">Biaya per tindakan</h2>
        <p class="section-subtitle">Asumsi pengurangan daya diatur di langkah 2 (Skenario).</p></div></div>
      <div class="section-body cost-grid">
        <fieldset class="cost-card">
          <legend>Perbaikan kebocoran compressed air</legend>
          ${numberField(state, { path: 'inputs.leakInvestmentRp', label: 'Biaya investasi', unit: 'Rp', hint: 'Survei, fitting, valve, tenaga kerja.' })}
          ${numberField(state, { path: 'inputs.leakOpexRpPerYear', label: 'Biaya operasional tambahan', unit: 'Rp/tahun', hint: 'Contoh: program deteksi kebocoran berkala. Isi 0 jika tidak ada.' })}
        </fieldset>
        <fieldset class="cost-card">
          <legend>Optimasi kontrol kompresor</legend>
          ${numberField(state, { path: 'inputs.controlInvestmentRp', label: 'Biaya investasi', unit: 'Rp', hint: 'Contoh: sequencer, penyesuaian setpoint, komisioning.' })}
          ${numberField(state, { path: 'inputs.controlOpexRpPerYear', label: 'Biaya operasional tambahan', unit: 'Rp/tahun', hint: 'Isi 0 jika tidak ada.' })}
        </fieldset>
      </div>
    </section>

    ${aiPanel(ai)}`;
  },
};

export function aiPanel(ai) {
  const enabled = ai.status?.enabled === true;
  const statusText = ai.status == null ? 'Memeriksa status AI' : enabled ? 'AI aktif: ekstraksi saja' : 'AI belum diaktifkan';
  return `
    <section class="section" aria-labelledby="ai-title" id="ai-panel">
      <div class="section-header">
        <div>
          <h2 class="section-title" id="ai-title">Baca teks audit (opsional)</h2>
          <p class="section-subtitle">Teks audit → usulan terstruktur → validasi engineer → perhitungan deterministik.</p>
        </div>
        <span class="system-badge" data-status="${enabled ? 'ok' : 'disabled'}" id="ai-panel-status">${esc(statusText)}</span>
      </div>
      <div class="section-body">
        ${enabled ? '' : `<div class="callout neutral"><strong>AI belum diaktifkan.</strong>
          <p>${esc(ai.status?.reason ?? 'Status sedang diperiksa.')} Semua langkah tetap berjalan dengan input manual dan perhitungan deterministik.</p></div>`}
        <div class="field">
          <label for="ai-text">Teks temuan audit</label>
          <textarea class="input textarea" id="ai-text" rows="5" maxlength="${MAX_AUDIT_TEXT_CHARS}" ${enabled ? '' : 'disabled'}
            aria-describedby="ai-text-hint">${esc(ai.text ?? '')}</textarea>
          <p class="field-hint" id="ai-text-hint">Maksimal ${MAX_AUDIT_TEXT_CHARS.toLocaleString('id-ID')} karakter. AI hanya mengusulkan peralatan, masalah, parameter yang tertulis, informasi yang belum ada, dan jenis pemeriksaan lanjutan. AI tidak menghitung penghematan atau payback.</p>
        </div>
        <button class="primary-button" type="button" data-action="ai-extract" ${enabled && !ai.loading ? '' : 'disabled'}>
          ${ai.loading ? 'Memproses…' : 'Usulkan struktur temuan'}
        </button>
        <div id="ai-results" aria-live="polite">${aiResults(ai)}</div>
      </div>
    </section>`;
}

export function aiResults(ai) {
  if (ai.error) return `<div class="callout warning"><strong>Ekstraksi gagal.</strong><p>${esc(ai.error)}</p></div>`;
  const result = ai.result;
  if (!result) return '';
  const { accepted, rejected } = result;
  const quote = (text) => `<q class="source-quote">${esc(text)}</q>`;
  const applied = ai.applied ?? new Set();
  const actionButton = (key, label, attrs) => applied.has(key)
    ? '<span class="applied-label">Sudah diterapkan</span>'
    : `<button class="action-button" type="button" data-ai-key="${esc(key)}" ${attrs}>${esc(label)}</button>`;

  const parameterRows = accepted.parameters.map((item, index) => `<tr>
      <th scope="row">${esc(item.label)}</th>
      <td class="num">${esc(item.value)} ${esc(item.unit)}</td>
      <td>${quote(item.source_quote)}</td>
      <td>${item.field ? actionButton(`p${index}`, 'Isi ke formulir', `data-action="ai-apply-parameter" data-target-field="${esc(item.field)}" data-value="${esc(item.value)}"`) : '<span class="subtle-note">Informasi saja</span>'}</td>
    </tr>`).join('');

  return `
    <div class="ai-results-body">
      <div class="callout neutral"><strong>Usulan AI (${esc(result.model ?? '')}). Belum dipakai dalam perhitungan.</strong>
        <p>Nilai masuk ke formulir hanya setelah Anda klik "Isi ke formulir". Validasi input dan perhitungan tetap deterministik.</p></div>
      <h3>Parameter yang tertulis di teks</h3>
      ${accepted.parameters.length ? `<div class="table-wrap"><table class="compact-table"><thead><tr><th scope="col">Parameter</th><th scope="col">Nilai</th><th scope="col">Kutipan sumber</th><th scope="col">Aksi</th></tr></thead><tbody>${parameterRows}</tbody></table></div>` : '<p>Tidak ada parameter yang lolos validasi.</p>'}
      <h3>Peralatan</h3>
      <ul class="ai-list">${accepted.equipment.map((item, index) => `<li><strong>${esc(item.name)}</strong> ${quote(item.source_quote)} ${actionButton(`e${index}`, 'Isi ke deskripsi peralatan', `data-action="ai-apply-equipment" data-value="${esc(item.name)}"`)}</li>`).join('') || '<li>Tidak ada.</li>'}</ul>
      <h3>Masalah yang teridentifikasi</h3>
      <ul class="ai-list">${accepted.issues.map((item, index) => `<li>${esc(item.description)} ${quote(item.source_quote)} ${actionButton(`i${index}`, 'Tambahkan ke temuan audit', `data-action="ai-apply-issue" data-value="${esc(item.description)}"`)}</li>`).join('') || '<li>Tidak ada.</li>'}</ul>
      <h3>Informasi yang belum tersedia</h3>
      <ul class="ai-list">${accepted.missing_information.map((item) => `<li><strong>${esc(item.label)}:</strong> ${esc(item.reason)}</li>`).join('') || '<li>Tidak ada.</li>'}</ul>
      <h3>Saran pemeriksaan lanjutan</h3>
      <ul class="ai-list">${accepted.suggested_checks.map((item) => `<li><strong>${esc(item.label)}:</strong> ${esc(item.reason)}</li>`).join('') || '<li>Tidak ada.</li>'}</ul>
      ${rejected.length ? `<details class="rejected"><summary>${rejected.length} usulan ditolak validator</summary><ul>${rejected.map((item) => `<li>${esc(item.section)} #${item.index + 1}: ${esc(item.reason)}</li>`).join('')}</ul></details>` : ''}
    </div>`;
}
