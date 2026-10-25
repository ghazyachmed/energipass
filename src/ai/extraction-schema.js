// Contract for AI-assisted reading of audit text.
//
// Flow: audit text -> AI proposal (this schema) -> deterministic validation (this file)
//       -> engineer accepts or rejects each item -> deterministic calculation (src/domain).
//
// The AI may only propose equipment names, identified issues, parameters that are
// literally written in the text, missing information, and follow-up checks.
// The schema has no field for savings, payback, or emissions. Every item must carry
// a verbatim quote, and validation rejects any quote or number not found in the text.

import { extractNumbers } from '../domain/numbers.js';
import { NUMERIC_RULES, validateNumber } from '../domain/validation.js';

export const MAX_AUDIT_TEXT_CHARS = 8000;
const MAX_ITEMS = 20;
const MAX_QUOTE_CHARS = 300;
const MAX_TEXT_CHARS = 500;

export const PARAMETER_DEFINITIONS = Object.freeze({
  baseline_power_kw: { label: 'Daya rata-rata sebelum perbaikan', unit: 'kW', field: 'baselinePowerKw' },
  operating_hours_per_year: { label: 'Jam operasi per tahun', unit: 'jam/tahun', field: 'operatingHoursPerYear' },
  electricity_tariff_rp_per_kwh: { label: 'Tarif listrik', unit: 'Rp/kWh', field: 'tariffRpPerKwh' },
  leak_repair_investment_rp: { label: 'Biaya investasi perbaikan kebocoran', unit: 'Rp', field: 'leakInvestmentRp' },
  leak_repair_opex_rp_per_year: { label: 'Biaya operasional tambahan perbaikan kebocoran', unit: 'Rp/tahun', field: 'leakOpexRpPerYear' },
  control_investment_rp: { label: 'Biaya investasi optimasi kontrol', unit: 'Rp', field: 'controlInvestmentRp' },
  control_opex_rp_per_year: { label: 'Biaya operasional tambahan optimasi kontrol', unit: 'Rp/tahun', field: 'controlOpexRpPerYear' },
  pressure_setpoint_bar: { label: 'Setpoint tekanan', unit: 'bar', field: null },
  leak_points_count: { label: 'Jumlah titik bocor', unit: 'titik', field: null },
  unload_time_percent: { label: 'Waktu unload', unit: '%', field: null },
});

export const MISSING_INFORMATION_KEYS = Object.freeze({
  baseline_power_kw: 'Daya rata-rata terukur',
  operating_hours_per_year: 'Jam operasi per tahun',
  electricity_tariff_rp_per_kwh: 'Tarif listrik efektif',
  leak_repair_investment_rp: 'Biaya perbaikan kebocoran',
  control_investment_rp: 'Biaya optimasi kontrol',
  measurement_source: 'Sumber dan tanggal data pengukuran',
});

export const CHECK_TYPES = Object.freeze({
  power_logging: 'Power logging pada periode produksi normal',
  ultrasonic_leak_survey: 'Leak survey ultrasonik',
  pressure_profile_logging: 'Logging profil tekanan',
  flow_measurement: 'Pengukuran aliran udara (flow)',
  electricity_bill_review: 'Pemeriksaan tagihan listrik',
  vendor_quotation: 'Penawaran vendor',
  production_schedule_review: 'Pemeriksaan jadwal produksi',
});

const quotedItem = (extra) => ({
  type: 'object',
  additionalProperties: false,
  required: [...Object.keys(extra), 'source_quote'],
  properties: { ...extra, source_quote: { type: 'string', description: 'Exact verbatim excerpt from the audit text.' } },
});

export const EXTRACTION_JSON_SCHEMA = Object.freeze({
  type: 'object',
  additionalProperties: false,
  required: ['equipment', 'issues', 'parameters', 'missing_information', 'suggested_checks'],
  properties: {
    equipment: { type: 'array', items: quotedItem({ name: { type: 'string' } }) },
    issues: { type: 'array', items: quotedItem({ description: { type: 'string' } }) },
    parameters: {
      type: 'array',
      items: quotedItem({
        name: { type: 'string', enum: Object.keys(PARAMETER_DEFINITIONS) },
        value: { type: 'number' },
        unit: { type: 'string' },
      }),
    },
    missing_information: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key', 'reason'],
        properties: { key: { type: 'string', enum: Object.keys(MISSING_INFORMATION_KEYS) }, reason: { type: 'string' } },
      },
    },
    suggested_checks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['check_type', 'reason'],
        properties: { check_type: { type: 'string', enum: Object.keys(CHECK_TYPES) }, reason: { type: 'string' } },
      },
    },
  },
});

export const EXTRACTION_SYSTEM_PROMPT = [
  'You read energy audit notes about industrial compressed air systems. The notes may be in Indonesian or English.',
  'Report only information that is written in the notes.',
  'Every equipment, issue, and parameter item must include source_quote: an exact excerpt copied character by character from the notes, at most 300 characters.',
  'A parameter value must be the number written inside its source_quote. Remove thousands separators only. Do not convert units, estimate, or calculate.',
  'Never report energy savings, cost savings, payback, or emission values. The application calculates those after an engineer validates the inputs.',
  'If a value needed for the financial analysis is not written in the notes, list it in missing_information with a short reason.',
  'Suggest follow-up checks only from the allowed check types. Write descriptions and reasons in Indonesian.',
].join(' ');

function normalizeForMatch(text) {
  return String(text ?? '').toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
}

function isString(value, maxLength) {
  return typeof value === 'string' && value.trim() !== '' && value.length <= maxLength;
}

/**
 * Validate an AI proposal against the schema and against the source text.
 * Items that fail are moved to `rejected` with a reason. They are never shown as findings.
 * @param {unknown} data parsed JSON from the model
 * @param {string} sourceText the audit text sent to the model
 */
export function validateExtraction(data, sourceText) {
  const accepted = { equipment: [], issues: [], parameters: [], missing_information: [], suggested_checks: [] };
  const rejected = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { ok: false, error: 'Respons AI bukan objek JSON.', accepted, rejected };
  }
  const expectedKeys = Object.keys(EXTRACTION_JSON_SCHEMA.properties);
  const unknownKeys = Object.keys(data).filter((key) => !expectedKeys.includes(key));
  if (unknownKeys.length > 0) {
    return { ok: false, error: `Respons AI memuat field di luar schema: ${unknownKeys.join(', ')}.`, accepted, rejected };
  }
  for (const key of expectedKeys) {
    if (!Array.isArray(data[key])) return { ok: false, error: `Field ${key} harus berupa array.`, accepted, rejected };
    if (data[key].length > MAX_ITEMS) return { ok: false, error: `Field ${key} melebihi ${MAX_ITEMS} item.`, accepted, rejected };
  }

  const source = normalizeForMatch(sourceText);
  const quoteProblem = (quote) => {
    if (!isString(quote, MAX_QUOTE_CHARS)) return 'Kutipan sumber kosong atau terlalu panjang.';
    if (!source.includes(normalizeForMatch(quote))) return 'Kutipan tidak ditemukan di teks audit.';
    return null;
  };
  const reject = (section, index, item, reason) => rejected.push({ section, index, item, reason });

  data.equipment.forEach((item, index) => {
    const problem = !isPlainObject(item, ['name', 'source_quote']) ? 'Struktur item tidak sesuai schema.'
      : !isString(item.name, MAX_TEXT_CHARS) ? 'Nama peralatan kosong atau terlalu panjang.'
        : quoteProblem(item.source_quote);
    if (problem) reject('equipment', index, item, problem);
    else accepted.equipment.push({ name: item.name.trim(), source_quote: item.source_quote });
  });

  data.issues.forEach((item, index) => {
    const problem = !isPlainObject(item, ['description', 'source_quote']) ? 'Struktur item tidak sesuai schema.'
      : !isString(item.description, MAX_TEXT_CHARS) ? 'Deskripsi kosong atau terlalu panjang.'
        : quoteProblem(item.source_quote);
    if (problem) reject('issues', index, item, problem);
    else accepted.issues.push({ description: item.description.trim(), source_quote: item.source_quote });
  });

  data.parameters.forEach((item, index) => {
    const problem = parameterProblem(item, quoteProblem);
    if (problem) reject('parameters', index, item, problem);
    else {
      const definition = PARAMETER_DEFINITIONS[item.name];
      accepted.parameters.push({ ...item, label: definition.label, field: definition.field });
    }
  });

  data.missing_information.forEach((item, index) => {
    const valid = isPlainObject(item, ['key', 'reason']) && Object.hasOwn(MISSING_INFORMATION_KEYS, item.key) && isString(item.reason, MAX_TEXT_CHARS);
    if (!valid) reject('missing_information', index, item, 'Item tidak sesuai schema.');
    else accepted.missing_information.push({ ...item, label: MISSING_INFORMATION_KEYS[item.key] });
  });

  data.suggested_checks.forEach((item, index) => {
    const valid = isPlainObject(item, ['check_type', 'reason']) && Object.hasOwn(CHECK_TYPES, item.check_type) && isString(item.reason, MAX_TEXT_CHARS);
    if (!valid) reject('suggested_checks', index, item, 'Item tidak sesuai schema.');
    else accepted.suggested_checks.push({ ...item, label: CHECK_TYPES[item.check_type] });
  });

  return { ok: true, accepted, rejected };
}

function isPlainObject(item, keys) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
  const itemKeys = Object.keys(item);
  return itemKeys.length === keys.length && keys.every((key) => Object.hasOwn(item, key));
}

function parameterProblem(item, quoteProblem) {
  if (!isPlainObject(item, ['name', 'value', 'unit', 'source_quote'])) return 'Struktur item tidak sesuai schema.';
  const definition = PARAMETER_DEFINITIONS[item.name];
  if (!definition) return 'Nama parameter tidak dikenal.';
  if (typeof item.value !== 'number' || !Number.isFinite(item.value)) return 'Nilai bukan angka terbatas.';
  if (typeof item.unit !== 'string' || item.unit.trim().toLowerCase() !== definition.unit.toLowerCase()) {
    return `Satuan harus ${definition.unit}.`;
  }
  const problem = quoteProblem(item.source_quote);
  if (problem) return problem;
  const numbersInQuote = extractNumbers(item.source_quote);
  const tolerance = Math.max(1e-9, Math.abs(item.value) * 1e-9);
  if (!numbersInQuote.some((number) => Math.abs(number - item.value) <= tolerance)) {
    return 'Nilai tidak tertulis di dalam kutipan sumber.';
  }
  if (definition.field) {
    const check = validateNumber(item.value, NUMERIC_RULES[definition.field]);
    if (!check.ok) return check.message;
  }
  return null;
}
