// Evidence register and readiness rules.
//
// "Ready" means: every input required for the proposed scenario has a source,
// a document reference and date, and an engineer review. It does NOT mean the
// project is certified, audited by a certified energy auditor, or verified (M&V).

export const EVIDENCE_BASIS = Object.freeze({
  measured: 'Pengukuran',
  documented: 'Dokumen',
  assumed: 'Asumsi',
  missing: 'Belum tersedia',
});

export const REVIEW_STATUS = Object.freeze({
  unchecked: 'Belum diperiksa',
  checked: 'Diperiksa engineer',
  revise: 'Perlu revisi',
});

const ALL_SCENARIOS = ['none', 'leak', 'control', 'combined'];

export const EVIDENCE_DEFINITIONS = Object.freeze([
  {
    id: 'baselinePower', label: 'Daya listrik rata-rata sebelum perbaikan', valueFields: ['baselinePowerKw'],
    requiredFor: ALL_SCENARIOS, critical: true,
    hint: 'Sumber diatur oleh pilihan metode pengukuran di Assessment.',
  },
  {
    id: 'operatingHours', label: 'Jam operasi per tahun', valueFields: ['operatingHoursPerYear'],
    requiredFor: ALL_SCENARIOS, hint: 'Contoh sumber: jadwal produksi, log jam kerja kompresor.',
  },
  {
    id: 'tariff', label: 'Tarif listrik efektif', valueFields: ['tariffRpPerKwh'],
    requiredFor: ALL_SCENARIOS, hint: 'Contoh sumber: tagihan listrik fasilitas (rata-rata LWBP/WBP).',
  },
  {
    id: 'leakReduction', label: 'Asumsi pengurangan daya: perbaikan kebocoran', valueFields: ['leakReductionPct'],
    requiredFor: ['leak', 'combined'], hint: 'Contoh dasar: leak survey ultrasonik, uji bleed-down.',
  },
  {
    id: 'leakCost', label: 'Biaya perbaikan kebocoran (investasi dan operasional)', valueFields: ['leakInvestmentRp', 'leakOpexRpPerYear'],
    requiredFor: ['leak', 'combined'], hint: 'Contoh sumber: penawaran vendor, estimasi tim maintenance.',
  },
  {
    id: 'controlReduction', label: 'Asumsi pengurangan daya: optimasi kontrol', valueFields: ['controlReductionPct'],
    requiredFor: ['control', 'combined'], hint: 'Contoh dasar: profil tekanan dan load/unload dari data logger.',
  },
  {
    id: 'controlCost', label: 'Biaya optimasi kontrol (investasi dan operasional)', valueFields: ['controlInvestmentRp', 'controlOpexRpPerYear'],
    requiredFor: ['control', 'combined'], hint: 'Contoh sumber: penawaran vendor sequencer atau kontrol.',
  },
]);

/** Basis of the baseline power item follows the measurement method chosen in the assessment. */
export function basisFromMeasurementMethod(method) {
  if (method === 'logger' || method === 'spot') return 'measured';
  if (method === 'nameplate') return 'assumed';
  return 'missing';
}

export function resolveBasis(definition, record, inputs) {
  if (definition.id === 'baselinePower') return basisFromMeasurementMethod(inputs.measurementMethod);
  return Object.hasOwn(EVIDENCE_BASIS, record?.basis) ? record.basis : 'missing';
}

const STALE_AFTER_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Parse an ISO date (yyyy-mm-dd) as a UTC calendar date.
 * @returns {Date | null}
 */
export function parseIsoDate(text) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(text ?? '').trim());
  if (!match) return null;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const sameDay = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  return sameDay ? date : null;
}

function startOfUtcDay(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Check one evidence item.
 * @returns {{ basis: string, blockers: string[], warnings: string[] }}
 */
export function assessEvidenceItem(definition, record, inputs, today = new Date()) {
  const basis = resolveBasis(definition, record, inputs);
  const blockers = [];
  const warnings = [];
  const reference = String(record?.reference ?? '').trim();
  const review = Object.hasOwn(REVIEW_STATUS, record?.review) ? record.review : 'unchecked';

  if (basis === 'missing') {
    blockers.push(`${definition.label}: data belum tersedia.`);
    return { basis, review, blockers, warnings };
  }
  if (reference === '') blockers.push(`${definition.label}: referensi dokumen belum diisi.`);

  const dateText = String(record?.documentDate ?? '').trim();
  if (dateText === '') {
    blockers.push(`${definition.label}: tanggal dokumen belum diisi.`);
  } else {
    const date = parseIsoDate(dateText);
    if (!date) blockers.push(`${definition.label}: format tanggal tidak valid (gunakan yyyy-mm-dd).`);
    else if (date.getTime() > startOfUtcDay(today)) blockers.push(`${definition.label}: tanggal dokumen berada di masa depan.`);
    else if ((startOfUtcDay(today) - date.getTime()) / DAY_MS > STALE_AFTER_DAYS) {
      warnings.push(`${definition.label}: dokumen berumur lebih dari 12 bulan. Pertimbangkan data terbaru.`);
    }
  }

  if (review === 'revise') blockers.push(`${definition.label}: ditandai perlu revisi.`);
  if (review === 'unchecked') blockers.push(`${definition.label}: belum diperiksa engineer.`);

  if (definition.critical && basis !== 'measured') {
    blockers.push('Baseline daya belum berasal dari pengukuran. Estimasi nameplate tidak cukup untuk keputusan investasi.');
  }
  if (definition.id === 'baselinePower' && inputs.measurementMethod === 'spot') {
    warnings.push('Pengukuran sesaat belum mewakili siklus load/unload. Pertimbangkan power logging pada periode produksi normal.');
  }
  return { basis, review, blockers, warnings };
}

export function requiredEvidenceFor(scenarioId) {
  return EVIDENCE_DEFINITIONS.filter((definition) => definition.requiredFor.includes(scenarioId));
}

/**
 * Readiness of the decision package for the proposed scenario.
 * @param {Record<string, object>} evidenceRecords
 * @param {Record<string, string>} inputs raw assessment inputs
 * @param {string} scenarioId proposed scenario
 * @param {{ inputsValid: boolean, today?: Date }} context
 */
export function assessReadiness(evidenceRecords, inputs, scenarioId, { inputsValid, today = new Date() }) {
  const blockers = [];
  const warnings = [];
  const counts = { measured: 0, documented: 0, assumed: 0, missing: 0, checked: 0, unchecked: 0, revise: 0 };

  if (scenarioId === 'none') blockers.push('Pilih opsi perbaikan yang diusulkan. "Tanpa intervensi" tidak memerlukan persetujuan investasi.');
  if (!inputsValid) blockers.push('Ada input yang tidak valid. Perbaiki input di Assessment atau Skenario.');

  const items = requiredEvidenceFor(scenarioId).map((definition) => {
    const result = assessEvidenceItem(definition, evidenceRecords[definition.id], inputs, today);
    counts[result.basis] += 1;
    if (result.basis !== 'missing') counts[result.review] += 1;
    blockers.push(...result.blockers);
    warnings.push(...result.warnings);
    return { id: definition.id, ...result, complete: result.blockers.length === 0 };
  });

  return {
    status: blockers.length === 0 ? 'ready' : 'not-ready',
    blockers,
    warnings,
    counts,
    items,
    requiredCount: items.length,
    completeCount: items.filter((item) => item.complete).length,
  };
}
