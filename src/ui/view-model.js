// Turn the derived model into display strings. One function, one place for every
// number shown on screen, so screens cannot drift from the calculation.

import { esc } from './dom.js';
import { SCENARIOS, MEASURES } from '../domain/scenarios.js';
import { EVIDENCE_DEFINITIONS, EVIDENCE_BASIS, REVIEW_STATUS, resolveBasis } from '../domain/evidence.js';
import { NUMERIC_RULES } from '../domain/validation.js';
import { getFixture, dataOrigin } from '../fixtures/compressor-fixtures.js';
import {
  formatKwh, formatKw, formatNumber, formatPayback, formatPct, formatRp, formatIsoDate,
} from '../domain/format.js';

const NOT_CALCULATED = 'Tidak dihitung';

/**
 * @returns {{ text: Record<string,string>, html: Record<string,string>, status: Record<string,string> }}
 */
export function buildView(model, state) {
  const text = {};
  const html = {};
  const status = {};
  const { validation, scenarios, proposedScenario, proposedResult, readiness } = model;
  const origin = dataOrigin(state);

  // Shell
  text['sidebar.fixture'] = getFixture(state.fixtureId).label;
  text['sidebar.origin'] = origin === 'simulation' ? 'Data simulasi (fiktif)' : 'Simulasi yang telah diubah. Belum diverifikasi.';
  text['topbar.origin'] = origin === 'simulation' ? 'Data simulasi' : 'Simulasi diubah';
  const errorCount = Object.keys(validation.errors).length;
  text['nav.assessment'] = errorCount > 0 ? `${errorCount} input perlu diperbaiki` : 'Input valid';
  status['nav.assessment'] = errorCount > 0 ? 'error' : 'ok';
  text['nav.scenarios'] = `Diusulkan: ${proposedScenario.shortLabel}`;
  text['nav.financial'] = proposedResult.ok ? formatPayback(proposedResult.payback) : NOT_CALCULATED;
  text['nav.evidence'] = readiness.status === 'ready' ? 'Ready untuk review' : `${readiness.blockers.length} catatan`;
  status['nav.evidence'] = readiness.status === 'ready' ? 'ok' : 'warning';

  // Result strip
  text['strip.scenario'] = `${proposedScenario.shortLabel} · ${proposedScenario.label}`;
  text['strip.baseline'] = scenarios.none.ok ? `${formatKwh(scenarios.none.baselineEnergyKwh)}/tahun` : NOT_CALCULATED;
  text['strip.savings'] = proposedResult.ok ? `${formatKwh(proposedResult.energySavingsKwh)}/tahun` : NOT_CALCULATED;
  text['strip.net'] = proposedResult.ok ? `${formatRp(proposedResult.netSavingsRp)}/tahun` : NOT_CALCULATED;
  text['strip.payback'] = proposedResult.ok ? formatPayback(proposedResult.payback) : NOT_CALCULATED;
  status['strip.payback'] = proposedResult.ok && proposedResult.payback.status === 'not-reached' ? 'error' : 'neutral';
  text['strip.readiness'] = readiness.status === 'ready' ? 'Ready untuk review manajemen' : `Belum ready (${readiness.blockers.length})`;
  status['strip.readiness'] = readiness.status === 'ready' ? 'ok' : 'warning';
  text['strip.errors'] = errorCount > 0 ? `${errorCount} input tidak valid. Hasil yang bergantung pada input tersebut tidak dihitung.` : '';

  // Baseline preview (Assessment)
  const base = scenarios.none;
  text['baseline.hours'] = Number.isFinite(validation.values.operatingHoursPerYear)
    ? `${formatNumber(validation.values.operatingHoursPerYear)} jam/tahun`
    : NOT_CALCULATED;
  text['baseline.energy'] = base.ok ? `${formatKwh(base.baselineEnergyKwh)}/tahun` : NOT_CALCULATED;
  text['baseline.cost'] = base.ok ? `${formatRp(base.baselineCostRp)}/tahun` : NOT_CALCULATED;

  // Scenario table
  for (const scenario of SCENARIOS) {
    const result = scenarios[scenario.id];
    const key = `scn.${scenario.id}`;
    if (!result.ok) {
      for (const metric of ['powerAfter', 'energyAfter', 'savingsKwh', 'savingsPct', 'costSavings', 'opex', 'net', 'investment', 'payback']) {
        text[`${key}.${metric}`] = '-';
      }
      text[`${key}.note`] = `${NOT_CALCULATED}: ${result.reasons.join(' ')}`;
      status[`${key}.payback`] = 'neutral';
      continue;
    }
    text[`${key}.powerAfter`] = formatKw(result.powerAfterKw);
    text[`${key}.energyAfter`] = formatKwh(result.energyAfterKwh);
    text[`${key}.savingsKwh`] = formatKwh(result.energySavingsKwh);
    text[`${key}.savingsPct`] = formatPct(result.energySavingsPct);
    text[`${key}.costSavings`] = formatRp(result.costSavingsRp);
    text[`${key}.opex`] = formatRp(result.additionalOpexRp);
    text[`${key}.net`] = formatRp(result.netSavingsRp);
    text[`${key}.investment`] = formatRp(result.investmentRp);
    text[`${key}.payback`] = formatPayback(result.payback);
    status[`${key}.payback`] = result.payback.status === 'not-reached' ? 'error' : 'neutral';
    text[`${key}.note`] = '';
  }
  html['scenario.interaction'] = interactionHtml(model);

  // Financial screen
  text['fin.scenario'] = `${proposedScenario.shortLabel} · ${proposedScenario.label}`;
  const fin = proposedResult;
  text['fin.baselineEnergy'] = fin.ok ? `${formatKwh(fin.baselineEnergyKwh)}/tahun` : NOT_CALCULATED;
  text['fin.energyAfter'] = fin.ok ? `${formatKwh(fin.energyAfterKwh)}/tahun` : NOT_CALCULATED;
  text['fin.savingsKwh'] = fin.ok ? `${formatKwh(fin.energySavingsKwh)}/tahun (${formatPct(fin.energySavingsPct)})` : NOT_CALCULATED;
  text['fin.costSavings'] = fin.ok ? `${formatRp(fin.costSavingsRp)}/tahun` : NOT_CALCULATED;
  text['fin.opex'] = fin.ok ? `${formatRp(fin.additionalOpexRp)}/tahun` : NOT_CALCULATED;
  text['fin.net'] = fin.ok ? `${formatRp(fin.netSavingsRp)}/tahun` : NOT_CALCULATED;
  text['fin.investment'] = fin.ok ? formatRp(fin.investmentRp) : NOT_CALCULATED;
  text['fin.payback'] = fin.ok ? formatPayback(fin.payback) : NOT_CALCULATED;
  status['fin.payback'] = fin.ok && fin.payback.status === 'not-reached' ? 'error' : 'neutral';
  text['fin.blocked'] = fin.ok ? '' : `${NOT_CALCULATED}: ${fin.reasons.join(' ')}`;
  html['calc.steps'] = calculationStepsHtml(model, state);
  html['fin.realisation'] = realisationHtml(model);
  html['co2.output'] = co2Html(model);

  // Evidence
  html['evidence.summary'] = readinessHtml(readiness);
  const requiredIds = new Set(readiness.items.map((item) => item.id));
  for (const definition of EVIDENCE_DEFINITIONS) {
    const key = `evidence.${definition.id}`;
    const item = readiness.items.find((entry) => entry.id === definition.id);
    text[`${key}.value`] = evidenceValueText(definition, validation.values, state.inputs);
    text[`${key}.required`] = requiredIds.has(definition.id) ? `Dibutuhkan untuk ${proposedScenario.shortLabel}` : `Tidak dibutuhkan untuk ${proposedScenario.shortLabel}`;
    status[`${key}.required`] = requiredIds.has(definition.id) ? 'required' : 'optional';
    text[`${key}.basis`] = EVIDENCE_BASIS[resolveBasis(definition, state.evidence[definition.id], state.inputs)];
    if (item) {
      text[`${key}.status`] = item.complete ? 'Lengkap' : `Perlu tindakan (${item.blockers.length})`;
      status[`${key}.status`] = item.complete ? 'ok' : 'warning';
      html[`${key}.issues`] = [...item.blockers, ...item.warnings].map((line) => `<li>${esc(line)}</li>`).join('');
    } else {
      text[`${key}.status`] = 'Opsional';
      status[`${key}.status`] = 'neutral';
      html[`${key}.issues`] = '';
    }
  }

  return { text, html, status };
}

function evidenceValueText(definition, values, inputs) {
  return definition.valueFields.map((field) => {
    const rule = NUMERIC_RULES[field];
    const value = values[field];
    if (!Number.isFinite(value)) return `${rule?.label ?? field}: tidak valid`;
    if (rule.unit === 'Rp' || rule.unit === 'Rp/tahun') return `${formatRp(value)}${rule.unit === 'Rp/tahun' ? '/tahun' : ''}`;
    const digits = rule.unit === '%' ? 1 : 2;
    return `${formatNumber(value, digits)} ${rule.unit}`;
  }).join(' · ') + (definition.id === 'operatingHours' && inputs.hoursMode === 'daily'
    ? ` (${inputs.hoursPerDay} jam/hari × ${inputs.daysPerYear} hari)`
    : '');
}

function interactionHtml(model) {
  const { interaction } = model;
  if (!interaction) {
    return '<p>Perbandingan tumpang tindih tidak ditampilkan karena salah satu skenario tidak dihitung.</p>';
  }
  return `<p><strong>Penjumlahan langsung S1 + S2:</strong> ${esc(formatKwh(interaction.additiveSavingsKwh))}/tahun.
    <strong>Metode sekuensial S3:</strong> ${esc(formatKwh(interaction.combinedSavingsKwh))}/tahun.</p>
    <p>Selisih <strong>${esc(formatKwh(interaction.overlapKwh))}/tahun</strong> adalah penghematan yang tumpang tindih. EnergiAction tidak menghitungnya dua kali.</p>
    <p class="formula">P<sub>S3</sub> = P<sub>0</sub> × (1 − r<sub>kebocoran</sub>) × (1 − r<sub>kontrol</sub>)</p>`;
}

function sourceText(definitionId, state) {
  const definition = EVIDENCE_DEFINITIONS.find((item) => item.id === definitionId);
  const record = state.evidence[definitionId] ?? {};
  const basis = EVIDENCE_BASIS[resolveBasis(definition, record, state.inputs)];
  const reference = String(record.reference ?? '').trim() || 'referensi belum diisi';
  const date = record.documentDate ? formatIsoDate(record.documentDate) : 'tanggal belum diisi';
  const review = REVIEW_STATUS[record.review] ?? REVIEW_STATUS.unchecked;
  return `${basis} · ${reference} · ${date} · ${review}`;
}

function calculationStepsHtml(model, state) {
  const result = model.proposedResult;
  if (!result.ok) return `<p class="calc-blocked">${esc(NOT_CALCULATED)}: ${esc(result.reasons.join(' '))}</p>`;

  const { baseline, measures } = result;
  const hours = formatNumber(baseline.hoursPerYear);
  const rows = [];
  const row = (quantity, formula, substitution, value, source) => rows.push(
    `<tr><th scope="row">${quantity}</th><td class="formula">${formula}</td><td>${esc(substitution)}</td><td class="num">${esc(value)}</td><td class="source">${esc(source)}</td></tr>`,
  );

  row('Energi baseline', 'E<sub>0</sub> = P<sub>0</sub> × H', `${formatKw(baseline.powerKw)} × ${hours} jam/tahun`, `${formatKwh(result.baselineEnergyKwh)}/tahun`,
    `P₀: ${sourceText('baselinePower', state)}. H: ${sourceText('operatingHours', state)}.`);

  if (measures.length === 0) {
    row('Daya setelah perbaikan', 'P<sub>1</sub> = P<sub>0</sub>', 'Tanpa intervensi', formatKw(result.powerAfterKw), 'Tidak ada tindakan.');
  } else {
    const factors = measures.map((m) => `(1 − ${formatNumber(m.reductionFraction, 4)})`).join(' × ');
    const symbols = measures.map((m) => `(1 − r<sub>${m.id === 'leak' ? 'kebocoran' : 'kontrol'}</sub>)`).join(' × ');
    const sources = measures.map((m) => `r ${MEASURES[m.id].label.toLowerCase()}: ${sourceText(m.id === 'leak' ? 'leakReduction' : 'controlReduction', state)}`).join('. ');
    row('Daya setelah perbaikan', `P<sub>1</sub> = P<sub>0</sub> × ${symbols}`, `${formatKw(baseline.powerKw)} × ${factors}`, formatKw(result.powerAfterKw), `${sources}.`);
  }
  row('Energi setelah perbaikan', 'E<sub>1</sub> = P<sub>1</sub> × H', `${formatKw(result.powerAfterKw)} × ${hours} jam/tahun`, `${formatKwh(result.energyAfterKwh)}/tahun`, 'Hasil langkah sebelumnya.');
  row('Penghematan energi', 'ΔE = E<sub>0</sub> − E<sub>1</sub>', `${formatKwh(result.baselineEnergyKwh)} − ${formatKwh(result.energyAfterKwh)}`, `${formatKwh(result.energySavingsKwh)}/tahun`, 'Hasil langkah sebelumnya.');
  row('Penghematan biaya listrik', 'S = ΔE × T', `${formatKwh(result.energySavingsKwh)} × ${formatRp(baseline.tariffRpPerKwh)}/kWh`, `${formatRp(result.costSavingsRp)}/tahun`, `T: ${sourceText('tariff', state)}.`);

  const costSources = measures.map((m) => sourceText(m.id === 'leak' ? 'leakCost' : 'controlCost', state)).join('. ');
  row('Biaya operasional tambahan', 'C<sub>op</sub> = Σ biaya operasional per tindakan', measures.map((m) => formatRp(m.opexRpPerYear)).join(' + ') || 'Rp 0', `${formatRp(result.additionalOpexRp)}/tahun`, costSources || 'Tidak ada tindakan.');
  row('Penghematan bersih', 'N = S − C<sub>op</sub>', `${formatRp(result.costSavingsRp)} − ${formatRp(result.additionalOpexRp)}`, `${formatRp(result.netSavingsRp)}/tahun`, 'Hasil langkah sebelumnya.');
  row('Biaya investasi', 'I = Σ investasi per tindakan', measures.map((m) => formatRp(m.investmentRp)).join(' + ') || 'Rp 0', formatRp(result.investmentRp), costSources || 'Tidak ada tindakan.');

  let paybackSubstitution;
  if (result.payback.status === 'ok') paybackSubstitution = `${formatRp(result.investmentRp)} ÷ ${formatRp(result.netSavingsRp)}/tahun`;
  else if (result.payback.status === 'not-reached') paybackSubstitution = 'N ≤ 0, payback tidak dihitung';
  else if (result.payback.status === 'immediate') paybackSubstitution = 'I = 0';
  else paybackSubstitution = 'Tidak ada investasi';
  row('Simple payback', 'PB = I ÷ N (hanya jika N &gt; 0)', paybackSubstitution, formatPayback(result.payback), 'Hasil langkah sebelumnya.');

  return `<div class="table-wrap"><table class="calc-table">
    <caption class="visually-hidden">Langkah perhitungan untuk opsi diusulkan</caption>
    <thead><tr><th scope="col">Besaran</th><th scope="col">Rumus</th><th scope="col">Substitusi</th><th scope="col">Hasil</th><th scope="col">Sumber angka</th></tr></thead>
    <tbody>${rows.join('')}</tbody></table></div>
    <p class="subtle-note">Angka ditampilkan dibulatkan. Perhitungan memakai presisi penuh. r = pengurangan daya sebagai pecahan (10% = 0,1).</p>`;
}

function realisationHtml(model) {
  if (model.realisation.length === 0) return '<p class="subtle-note">Uji realisasi berlaku jika opsi diusulkan memiliki tindakan dan seluruh input valid.</p>';
  const rows = model.realisation.map((entry) => `<tr>
      <th scope="row">${esc(formatPct(entry.fraction * 100, 0))}</th>
      <td class="num">${esc(formatKwh(entry.energySavingsKwh))}</td>
      <td class="num">${esc(formatRp(entry.netSavingsRp))}</td>
      <td class="num" data-status="${entry.payback.status === 'not-reached' ? 'error' : 'neutral'}">${esc(formatPayback(entry.payback))}</td>
    </tr>`).join('');
  return `<div class="table-wrap"><table class="compact-table">
    <caption class="visually-hidden">Uji realisasi penghematan</caption>
    <thead><tr><th scope="col">Realisasi penghematan energi</th><th scope="col">Energi/tahun</th><th scope="col">Net/tahun</th><th scope="col">Simple payback</th></tr></thead>
    <tbody>${rows}</tbody></table></div>`;
}

const CO2_FIELD_LABELS = {
  emissionFactor: 'faktor emisi', emissionRegion: 'wilayah grid', emissionYear: 'tahun', emissionSource: 'sumber',
};

function co2Html(model) {
  const { co2 } = model;
  if (co2.status === 'shown') {
    return `<p class="co2-value"><strong>${esc(formatNumber(co2.tonnesPerYear, 1))} tCO₂/tahun</strong></p>
      <p class="formula">CO₂ = ΔE (MWh) × FE = ${esc(formatNumber(model.proposedResult.energySavingsKwh / 1000, 2))} MWh × ${esc(formatNumber(co2.factorTonnesPerMwh, 3))} tCO₂/MWh</p>
      <p class="subtle-note">Faktor emisi: ${esc(co2.region)}, tahun ${esc(co2.year)}, sumber: ${esc(co2.source)}. Nilai faktor diisi pengguna dan wajib diperiksa terhadap publikasi resmi.</p>`;
  }
  if (co2.status === 'not-requested') {
    return '<p>Estimasi CO₂ tidak ditampilkan. Isi faktor emisi, wilayah grid, tahun, dan sumber untuk menghitungnya.</p>';
  }
  if (co2.status === 'blocked') return '<p>Estimasi CO₂ tidak dihitung karena hasil opsi diusulkan tidak valid.</p>';
  if (co2.status === 'invalid') return '<p>Estimasi CO₂ tidak dihitung. Perbaiki input faktor emisi yang ditandai.</p>';
  const missing = co2.missing.map((field) => CO2_FIELD_LABELS[field]).join(', ');
  return `<p>Estimasi CO₂ tidak ditampilkan. Data belum lengkap: ${esc(missing)}.</p>`;
}

function readinessHtml(readiness) {
  const ready = readiness.status === 'ready';
  const counts = readiness.counts;
  const list = (items) => items.map((item) => `<li>${esc(item)}</li>`).join('');
  return `<div class="callout ${ready ? 'success' : 'warning'}" role="status">
      <strong>${ready ? 'Ready untuk review manajemen' : `Belum ready: ${readiness.blockers.length} catatan perlu tindakan`}</strong>
      <p>${readiness.completeCount} dari ${readiness.requiredCount} data wajib lengkap. Pengukuran: ${counts.measured} · Dokumen: ${counts.documented} · Asumsi: ${counts.assumed} · Belum tersedia: ${counts.missing}.</p>
      ${readiness.blockers.length ? `<ul class="issue-list">${list(readiness.blockers)}</ul>` : ''}
      ${readiness.warnings.length ? `<p><strong>Catatan:</strong></p><ul class="issue-list">${list(readiness.warnings)}</ul>` : ''}
    </div>`;
}
