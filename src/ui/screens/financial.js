import { esc } from '../dom.js';
import { numberField, textField } from '../fields.js';
import { SCENARIOS } from '../../domain/scenarios.js';

const METRICS = [
  ['fin.baselineEnergy', 'Konsumsi listrik baseline', 'E₀ = P₀ × H'],
  ['fin.energyAfter', 'Konsumsi setelah perbaikan', 'E₁ = P₁ × H'],
  ['fin.savingsKwh', 'Penghematan energi tahunan', 'ΔE = E₀ − E₁'],
  ['fin.costSavings', 'Estimasi penghematan biaya listrik', 'S = ΔE × tarif'],
  ['fin.opex', 'Biaya operasional tambahan', 'C_op'],
  ['fin.net', 'Penghematan bersih tahunan', 'N = S − C_op'],
  ['fin.investment', 'Biaya investasi', 'I'],
];

export const financialScreen = {
  id: 'financial',
  title: 'Analisis Finansial',
  render({ state }) {
    const options = SCENARIOS.map((scenario) => `<option value="${esc(scenario.id)}" ${scenario.id === state.proposedScenarioId ? 'selected' : ''}>${esc(`${scenario.shortLabel} · ${scenario.label}`)}</option>`).join('');
    return `
    <div class="page-header">
      <div>
        <p class="eyebrow">Langkah 3 dari 5</p>
        <h1 tabindex="-1">Financial Decision</h1>
        <p>Hasil untuk opsi yang diusulkan. Buka "Lihat Perhitungan" untuk memeriksa rumus, substitusi angka, dan sumber setiap input.</p>
      </div>
      <div class="page-actions">
        <div class="field">
          <label for="fin-scenario">Opsi yang dianalisis</label>
          <select class="select" id="fin-scenario" data-field="proposedScenarioId">${options}</select>
        </div>
      </div>
    </div>

    <p class="callout warning" data-bind="fin.blocked" data-hide-empty></p>

    <section class="section" aria-labelledby="fin-title">
      <div class="section-header"><div><h2 class="section-title" id="fin-title">Ringkasan finansial</h2>
        <p class="section-subtitle" data-bind="fin.scenario"></p></div></div>
      <div class="section-body">
        <dl class="metric-list">
          ${METRICS.map(([key, label, formula]) => `<div><dt>${esc(label)}<span class="metric-formula">${esc(formula)}</span></dt><dd data-bind="${key}"></dd></div>`).join('')}
          <div class="metric-emphasis"><dt>Simple payback<span class="metric-formula">PB = I ÷ N, hanya jika N &gt; 0</span></dt><dd data-bind="fin.payback" data-status-bind="fin.payback"></dd></div>
        </dl>
        <details class="calc-panel" id="calc-panel">
          <summary>Lihat Perhitungan</summary>
          <div data-bind-html="calc.steps"></div>
        </details>
      </div>
    </section>

    <section class="section" aria-labelledby="realisation-title">
      <div class="section-header"><div><h2 class="section-title" id="realisation-title">Uji realisasi penghematan</h2>
        <p class="section-subtitle">Jika hanya sebagian penghematan energi tercapai. Investasi dan biaya operasional tetap.</p></div></div>
      <div class="section-body" data-bind-html="fin.realisation"></div>
    </section>

    <section class="section" aria-labelledby="co2-title">
      <div class="section-header"><div><h2 class="section-title" id="co2-title">Estimasi CO₂ (opsional)</h2>
        <p class="section-subtitle">Ditampilkan hanya jika faktor emisi, wilayah grid, tahun, dan sumber lengkap. Aplikasi tidak menyediakan nilai default.</p></div></div>
      <div class="section-body form-grid">
        ${numberField(state, { path: 'inputs.emissionFactor', label: 'Faktor emisi grid', unit: 'tCO₂/MWh', hint: 'Ambil dari publikasi resmi untuk sistem grid fasilitas.' })}
        ${textField(state, { path: 'inputs.emissionRegion', label: 'Wilayah / sistem grid', placeholder: 'Contoh: nama sistem interkoneksi' })}
        ${textField(state, { path: 'inputs.emissionYear', label: 'Tahun data faktor emisi', placeholder: 'Contoh: 2023' })}
        ${textField(state, { path: 'inputs.emissionSource', label: 'Sumber', placeholder: 'Judul dokumen, penerbit, URL' })}
        <div class="span-2" data-bind-html="co2.output"></div>
      </div>
    </section>`;
  },
};
