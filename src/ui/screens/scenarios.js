import { esc } from '../dom.js';
import { numberField } from '../fields.js';
import { SCENARIOS } from '../../domain/scenarios.js';

const METRICS = [
  ['powerAfter', 'Daya setelah'],
  ['energyAfter', 'Energi/tahun'],
  ['savingsKwh', 'Hemat energi/tahun'],
  ['costSavings', 'Hemat biaya/tahun'],
  ['opex', 'Biaya op. tambahan/tahun'],
  ['net', 'Net/tahun'],
  ['investment', 'Investasi'],
  ['payback', 'Simple payback'],
];

const METRIC_LABELS = Object.fromEntries(METRICS);

function metricCell(scenarioId, metric) {
  const key = `scn.${esc(scenarioId)}.${metric}`;
  const label = `data-label="${esc(METRIC_LABELS[metric])}"`;
  if (metric === 'savingsKwh') {
    return `<td class="num" ${label}><span><span data-bind="${key}"></span><span class="cell-sub" data-bind="scn.${esc(scenarioId)}.savingsPct"></span></span></td>`;
  }
  if (metric === 'payback') return `<td class="num payback-cell" ${label} data-bind="${key}" data-status-bind="${key}"></td>`;
  return `<td class="num" ${label} data-bind="${key}"></td>`;
}

export const scenariosScreen = {
  id: 'scenarios',
  title: 'Skenario',
  render({ state }) {
    const rows = SCENARIOS.map((scenario) => `
      <tr data-scenario-row="${esc(scenario.id)}">
        <th scope="row">
          <label class="scenario-choice">
            <input type="radio" name="proposed-scenario" value="${esc(scenario.id)}" data-field="proposedScenarioId" ${scenario.id === state.proposedScenarioId ? 'checked' : ''}>
            <span><span class="scenario-code">${esc(scenario.shortLabel)}</span> ${esc(scenario.label)}</span>
          </label>
          <span class="cell-sub" data-bind="scn.${esc(scenario.id)}.note"></span>
        </th>
        ${METRICS.map(([metric]) => metricCell(scenario.id, metric)).join('')}
      </tr>`).join('');

    return `
    <div class="page-header">
      <div>
        <p class="eyebrow">Langkah 2 dari 5</p>
        <h1 tabindex="-1">Improvement Scenarios</h1>
        <p>Atur asumsi pengurangan daya. Seluruh hasil dihitung ulang langsung. Pilih satu opsi sebagai usulan untuk Investment Brief.</p>
      </div>
    </div>

    <section class="section" aria-labelledby="assumption-title">
      <div class="section-header"><div><h2 class="section-title" id="assumption-title">Asumsi pengurangan daya</h2>
        <p class="section-subtitle">Persentase dari daya listrik sebelum tindakan tersebut diterapkan (0 sampai 100%).</p></div></div>
      <div class="section-body cost-grid">
        <div class="cost-card">
          <h3>S1 · Perbaikan kebocoran compressed air</h3>
          ${numberField(state, { path: 'inputs.leakReductionPct', label: 'Pengurangan daya listrik', unit: '%', hint: 'Pada kompresor load/unload, pengurangan kebocoran tidak menurunkan daya secara proporsional. Masukkan % pengurangan daya listrik, bukan % kebocoran.' })}
        </div>
        <div class="cost-card">
          <h3>S2 · Optimasi kontrol kompresor</h3>
          ${numberField(state, { path: 'inputs.controlReductionPct', label: 'Pengurangan daya listrik', unit: '%', hint: 'Contoh dasar: profil load/unload dan tekanan dari data logger. Dasar asumsi dicatat di Evidence Review.' })}
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="compare-title">
      <div class="section-header"><div><h2 class="section-title" id="compare-title">Perbandingan skenario</h2>
        <p class="section-subtitle">Kolom pertama menentukan opsi yang diusulkan.</p></div></div>
      <div class="table-wrap">
        <table class="scenario-table">
          <caption class="visually-hidden">Perbandingan empat skenario perbaikan sistem kompresor</caption>
          <thead><tr><th scope="col">Skenario (pilih usulan)</th>${METRICS.map(([, label]) => `<th scope="col">${esc(label)}</th>`).join('')}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>

    <section class="section" aria-labelledby="overlap-title">
      <div class="section-header"><h2 class="section-title" id="overlap-title">Tumpang tindih penghematan</h2></div>
      <div class="section-body overlap" data-bind-html="scenario.interaction"></div>
    </section>`;
  },
};
