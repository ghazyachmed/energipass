// Investment Decision Brief: a one-page summary for the Plant Manager.
// Built only from the derived model, so the brief and the screens cannot disagree.

import { EVIDENCE_DEFINITIONS, EVIDENCE_BASIS, resolveBasis } from './evidence.js';
import { EQUIPMENT_TYPES, MEASUREMENT_METHODS } from './validation.js';
import { SCENARIOS, MEASURES } from './scenarios.js';
import { formatKwh, formatKw, formatNumber, formatPayback, formatPct, formatRp } from './format.js';

export const BRIEF_LIMITATIONS = Object.freeze([
  'Simple payback tidak memperhitungkan nilai waktu uang, inflasi, pajak, depresiasi, atau umur peralatan.',
  'Tarif listrik dianggap konstan. Biaya beban (kVA) dan eskalasi tarif tidak dihitung.',
  'Daya rata-rata dianggap mewakili seluruh jam operasi dalam satu tahun.',
  'Ringkasan ini bukan laporan audit energi bersertifikat, bukan sertifikasi, dan bukan verifikasi hasil (M&V).',
]);

/**
 * @param {ReturnType<import('./model.js').deriveModel>} model
 * @param {{ inputs: Record<string,string>, evidence: Record<string,object> }} state
 * @param {{ generatedAt: Date, dataOrigin: 'simulation' | 'modified-simulation' }} meta
 */
export function buildBrief(model, state, { generatedAt, dataOrigin }) {
  const { validation, proposedScenario, proposedResult, readiness } = model;
  const values = validation.values;
  const baseline = model.scenarios.none;

  return {
    generatedAt,
    dataOrigin,
    facilityName: values.facilityName || String(state.inputs.facilityName ?? ''),
    equipment: {
      type: EQUIPMENT_TYPES[state.inputs.equipmentType] ?? '-',
      description: values.equipmentDescription || '-',
    },
    problem: values.auditFinding || 'Temuan audit belum diisi.',
    baseline: baseline.ok
      ? {
        ok: true,
        powerKw: baseline.baseline.powerKw,
        hoursPerYear: baseline.baseline.hoursPerYear,
        tariffRpPerKwh: baseline.baseline.tariffRpPerKwh,
        energyKwh: baseline.baselineEnergyKwh,
        costRp: baseline.baselineCostRp,
        measurementMethod: MEASUREMENT_METHODS[state.inputs.measurementMethod] ?? '-',
      }
      : { ok: false },
    options: SCENARIOS.map((scenario) => summariseScenario(model.scenarios[scenario.id])),
    proposed: {
      id: proposedScenario.id,
      label: proposedScenario.label,
      result: proposedResult.ok ? proposedResult : null,
    },
    interaction: model.interaction,
    co2: model.co2.status === 'shown' ? model.co2 : null,
    assumptions: listAssumptions(model, state),
    missingEvidence: readiness.blockers,
    warnings: readiness.warnings,
    readinessStatus: readiness.status,
    approvals: listApprovalSteps(model, state),
    limitations: BRIEF_LIMITATIONS,
  };
}

function summariseScenario(result) {
  if (!result.ok) return { id: result.scenario.id, label: result.scenario.label, ok: false, reasons: result.reasons };
  return {
    id: result.scenario.id,
    label: result.scenario.label,
    ok: true,
    energyAfterKwh: result.energyAfterKwh,
    energySavingsKwh: result.energySavingsKwh,
    netSavingsRp: result.netSavingsRp,
    investmentRp: result.investmentRp,
    payback: result.payback,
  };
}

const REDUCTION_EVIDENCE = { leak: 'leakReduction', control: 'controlReduction' };

function listAssumptions(model, state) {
  const { values } = model.validation;
  const assumptions = [];
  const describeSource = (definitionId) => {
    const definition = EVIDENCE_DEFINITIONS.find((item) => item.id === definitionId);
    const record = state.evidence[definitionId] ?? {};
    const basis = EVIDENCE_BASIS[resolveBasis(definition, record, state.inputs)];
    const reference = String(record.reference ?? '').trim();
    return reference ? `${basis}, ${reference}` : `${basis}, referensi belum diisi`;
  };

  for (const measureId of model.proposedScenario.measureIds) {
    const field = MEASURES[measureId].fields.reductionPct;
    if (Number.isFinite(values[field])) {
      assumptions.push(`${MEASURES[measureId].label}: pengurangan daya ${formatPct(values[field])} dari daya sebelum tindakan ini (${describeSource(REDUCTION_EVIDENCE[measureId])}).`);
    }
  }
  if (model.proposedScenario.id === 'combined') {
    assumptions.push('Dua tindakan dihitung berurutan (sekuensial), sehingga penghematan yang tumpang tindih tidak dihitung ganda.');
  }
  const reductionIds = new Set(Object.values(REDUCTION_EVIDENCE));
  for (const definition of EVIDENCE_DEFINITIONS) {
    if (!definition.requiredFor.includes(model.proposedScenario.id) || reductionIds.has(definition.id)) continue;
    const basis = resolveBasis(definition, state.evidence[definition.id], state.inputs);
    if (basis === 'assumed') assumptions.push(`${definition.label}: berstatus ${EVIDENCE_BASIS.assumed.toLowerCase()}, belum dari pengukuran atau dokumen.`);
  }
  assumptions.push('Tarif listrik konstan sepanjang periode payback.');
  return assumptions;
}

function listApprovalSteps(model, state) {
  const steps = [];
  const { proposedScenario, readiness, proposedResult } = model;
  const { values } = model.validation;

  if (proposedScenario.id === 'none') {
    steps.push('Tidak ada investasi yang diusulkan. Tetapkan apakah audit lanjutan diperlukan.');
    return steps;
  }
  if (state.inputs.measurementMethod !== 'logger') {
    steps.push('Setujui pengukuran baseline dengan power logger pada periode produksi normal sebelum keputusan investasi final.');
  }
  for (const measureId of proposedScenario.measureIds) {
    const { fields, label } = MEASURES[measureId];
    if (Number.isFinite(values[fields.investmentRp])) {
      const opex = values[fields.opexRpPerYear];
      const opexText = opex > 0 ? ` dan biaya operasional tambahan ${formatRp(opex)}/tahun` : '';
      steps.push(`Setujui anggaran ${label.toLowerCase()} sebesar ${formatRp(values[fields.investmentRp])}${opexText}.`);
    }
  }
  if (proposedResult.ok && proposedResult.payback.status === 'not-reached') {
    steps.unshift('Penghematan bersih tidak positif. Pertimbangkan untuk tidak menyetujui opsi ini atau meninjau ulang biaya operasional.');
  }
  if (readiness.status !== 'ready') {
    steps.push(`Tunda keputusan final sampai ${readiness.blockers.length} catatan evidence diselesaikan.`);
  }
  steps.push('Tetapkan metode verifikasi hasil: ukur ulang daya rata-rata setelah implementasi dengan metode yang sama dengan baseline.');
  return steps;
}

/** Plain-text version for e-mail or chat. */
export function briefToPlainText(brief) {
  const lines = [];
  const add = (text = '') => lines.push(text);
  const p = brief.proposed.result;

  add('INVESTMENT DECISION BRIEF: SISTEM KOMPRESOR');
  add(`Fasilitas: ${brief.facilityName}`);
  add(`Status data: ${brief.dataOrigin === 'simulation' ? 'DATA SIMULASI (fiktif)' : 'Data simulasi yang telah diubah pengguna (belum diverifikasi)'}`);
  add(`Status evidence: ${brief.readinessStatus === 'ready' ? 'Ready untuk review manajemen (bukan sertifikasi)' : 'Belum ready'}`);
  add();
  add('1. Masalah pada sistem kompresor');
  add(`Peralatan: ${brief.equipment.type}. ${brief.equipment.description}`);
  add(brief.problem);
  add();
  add('2. Baseline energi');
  if (brief.baseline.ok) {
    add(`Daya ${formatKw(brief.baseline.powerKw)} × ${formatNumber(brief.baseline.hoursPerYear)} jam/tahun = ${formatKwh(brief.baseline.energyKwh)}/tahun`);
    add(`Biaya listrik baseline: ${formatRp(brief.baseline.costRp)}/tahun pada tarif ${formatRp(brief.baseline.tariffRpPerKwh)}/kWh`);
    add(`Sumber daya: ${brief.baseline.measurementMethod}`);
  } else {
    add('Baseline tidak dihitung karena input tidak valid.');
  }
  add();
  add('3. Opsi perbaikan');
  for (const option of brief.options) {
    if (!option.ok) { add(`- ${option.label}: tidak dihitung (${option.reasons.join(' ')})`); continue; }
    add(`- ${option.label}: hemat ${formatKwh(option.energySavingsKwh)}/tahun, net ${formatRp(option.netSavingsRp)}/tahun, investasi ${formatRp(option.investmentRp)}, payback ${formatPayback(option.payback)}`);
  }
  add();
  add(`4. Opsi yang diusulkan: ${brief.proposed.label}`);
  if (p) {
    add(`Penghematan energi: ${formatKwh(p.energySavingsKwh)}/tahun (${formatPct(p.energySavingsPct)})`);
    add(`Penghematan biaya listrik: ${formatRp(p.costSavingsRp)}/tahun`);
    add(`Biaya operasional tambahan: ${formatRp(p.additionalOpexRp)}/tahun`);
    add(`Penghematan bersih: ${formatRp(p.netSavingsRp)}/tahun`);
    add(`Biaya investasi: ${formatRp(p.investmentRp)}`);
    add(`5. Simple payback: ${formatPayback(p.payback)}`);
  } else {
    add('Tidak dihitung karena input tidak valid.');
  }
  if (brief.co2) {
    add(`Estimasi pengurangan CO2: ${formatNumber(brief.co2.tonnesPerYear, 1)} tCO2/tahun (faktor ${formatNumber(brief.co2.factorTonnesPerMwh, 3)} tCO2/MWh, ${brief.co2.region}, ${brief.co2.year}, sumber: ${brief.co2.source})`);
  }
  add();
  add('6. Asumsi penting');
  brief.assumptions.forEach((item) => add(`- ${item}`));
  add();
  add('7. Bukti yang belum tersedia atau perlu tindakan');
  if (brief.missingEvidence.length === 0) add('- Tidak ada.');
  brief.missingEvidence.forEach((item) => add(`- ${item}`));
  brief.warnings.forEach((item) => add(`- Catatan: ${item}`));
  add();
  add('8. Langkah yang perlu disetujui');
  brief.approvals.forEach((item, index) => add(`${index + 1}. ${item}`));
  add();
  add('Batasan analisis');
  brief.limitations.forEach((item) => add(`- ${item}`));
  return lines.join('\n');
}
