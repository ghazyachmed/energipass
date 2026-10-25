import { parseNumberInput } from './numbers.js';

export const HOURS_PER_YEAR_MAX = 8760;

// Unit-check bounds. A value outside these bounds is almost always a unit or
// separator error (W instead of kW, Rp/MWh instead of Rp/kWh, "1.115" read as 1,115).
export const POWER_MAX_KW = 10000;
export const TARIFF_MIN_RP_PER_KWH = 100;
export const TARIFF_MAX_RP_PER_KWH = 10000;
export const EMISSION_FACTOR_MAX_T_PER_MWH = 2;
export const MONEY_MAX_RP = 1e13;

export const EQUIPMENT_TYPES = Object.freeze({
  'screw-fixed': 'Rotary screw, fixed speed (load/unload)',
  'screw-vsd': 'Rotary screw, variable speed drive (VSD)',
  reciprocating: 'Reciprocating (piston)',
  centrifugal: 'Centrifugal',
  other: 'Lainnya',
});

export const MEASUREMENT_METHODS = Object.freeze({
  logger: 'Pengukuran: power logger (periode produksi normal)',
  spot: 'Pengukuran sesaat (clamp meter)',
  nameplate: 'Estimasi dari data nameplate',
  none: 'Belum ada data daya',
});

export const HOURS_MODES = Object.freeze({
  annual: 'Jam per tahun',
  daily: 'Jam per hari × hari per tahun',
});

const MESSAGES = {
  empty: 'Wajib diisi.',
  'not-a-number': 'Masukkan angka. Contoh: 1115, 45.000.000, atau 0,5. Huruf dan notasi eksponen tidak diterima.',
  'not-finite': 'Nilai Infinity atau NaN tidak diterima.',
  negative: 'Nilai tidak boleh negatif.',
  zero: 'Nilai harus lebih besar dari 0.',
  integer: 'Masukkan bilangan bulat.',
};

/**
 * Numeric field rules. `min`/`max` are inclusive unless `minExclusive` is set.
 * `maxMessage`/`minMessage` explain the likely unit error.
 */
export const NUMERIC_RULES = Object.freeze({
  baselinePowerKw: {
    label: 'Daya sebelum perbaikan', unit: 'kW', min: 0, minExclusive: true, max: POWER_MAX_KW,
    maxMessage: `Melebihi ${POWER_MAX_KW.toLocaleString('id-ID')} kW untuk satu sistem kompresor. Periksa satuan: masukkan daya dalam kW, bukan W atau kWh.`,
  },
  operatingHoursPerYear: {
    label: 'Jam operasi per tahun', unit: 'jam/tahun', min: 0, minExclusive: true, max: HOURS_PER_YEAR_MAX,
    maxMessage: `Jam operasi tidak boleh melebihi ${HOURS_PER_YEAR_MAX.toLocaleString('id-ID')} jam per tahun.`,
  },
  hoursPerDay: {
    label: 'Jam operasi per hari', unit: 'jam/hari', min: 0, minExclusive: true, max: 24,
    maxMessage: 'Jam per hari tidak boleh melebihi 24.',
  },
  daysPerYear: {
    label: 'Hari operasi per tahun', unit: 'hari/tahun', min: 0, minExclusive: true, max: 366, integer: true,
    maxMessage: 'Hari per tahun tidak boleh melebihi 366.',
  },
  tariffRpPerKwh: {
    label: 'Tarif listrik', unit: 'Rp/kWh', min: TARIFF_MIN_RP_PER_KWH, max: TARIFF_MAX_RP_PER_KWH,
    minMessage: `Tarif di bawah Rp ${TARIFF_MIN_RP_PER_KWH}/kWh. Periksa pemisah: ketik 1115 atau 1.115 untuk seribu seratus lima belas.`,
    maxMessage: `Tarif di atas Rp ${TARIFF_MAX_RP_PER_KWH.toLocaleString('id-ID')}/kWh. Periksa satuan: Rp/kWh, bukan Rp/MWh.`,
  },
  leakReductionPct: {
    label: 'Pengurangan daya: perbaikan kebocoran', unit: '%', min: 0, max: 100,
    maxMessage: 'Persentase harus di antara 0 dan 100.',
  },
  controlReductionPct: {
    label: 'Pengurangan daya: optimasi kontrol', unit: '%', min: 0, max: 100,
    maxMessage: 'Persentase harus di antara 0 dan 100.',
  },
  leakInvestmentRp: { label: 'Biaya investasi: perbaikan kebocoran', unit: 'Rp', min: 0, max: MONEY_MAX_RP },
  leakOpexRpPerYear: { label: 'Biaya operasional tambahan: perbaikan kebocoran', unit: 'Rp/tahun', min: 0, max: MONEY_MAX_RP },
  controlInvestmentRp: { label: 'Biaya investasi: optimasi kontrol', unit: 'Rp', min: 0, max: MONEY_MAX_RP },
  controlOpexRpPerYear: { label: 'Biaya operasional tambahan: optimasi kontrol', unit: 'Rp/tahun', min: 0, max: MONEY_MAX_RP },
  emissionFactor: {
    label: 'Faktor emisi grid', unit: 'tCO₂/MWh', min: 0, minExclusive: true, max: EMISSION_FACTOR_MAX_T_PER_MWH,
    maxMessage: 'Di atas 2 tCO₂/MWh. Periksa satuan: gunakan tCO₂/MWh (setara kgCO₂/kWh), bukan gCO₂/kWh.',
  },
});

/**
 * @param {unknown} raw
 * @param {object} rule entry of NUMERIC_RULES
 * @returns {{ ok: true, value: number } | { ok: false, message: string }}
 */
export function validateNumber(raw, rule) {
  const parsed = parseNumberInput(raw);
  if (!parsed.ok) return { ok: false, message: MESSAGES[parsed.reason] };

  const { value } = parsed;
  if (value < 0 && rule.min >= 0) return { ok: false, message: MESSAGES.negative };
  if (rule.minExclusive && value <= rule.min) {
    return { ok: false, message: rule.min === 0 ? MESSAGES.zero : rule.minMessage };
  }
  if (!rule.minExclusive && value < rule.min) {
    return { ok: false, message: rule.minMessage ?? `Minimal ${rule.min} ${rule.unit}.` };
  }
  if (value > rule.max) {
    return { ok: false, message: rule.maxMessage ?? `Maksimal ${rule.max.toLocaleString('id-ID')} ${rule.unit}.` };
  }
  if (rule.integer && !Number.isInteger(value)) return { ok: false, message: MESSAGES.integer };
  return { ok: true, value };
}

// Field groups. An error in one group blocks only the results that depend on it.
const BASE_FIELDS = ['baselinePowerKw', 'tariffRpPerKwh'];
const LEAK_FIELDS = ['leakReductionPct', 'leakInvestmentRp', 'leakOpexRpPerYear'];
const CONTROL_FIELDS = ['controlReductionPct', 'controlInvestmentRp', 'controlOpexRpPerYear'];

/**
 * Validate raw assessment inputs (strings typed by the user).
 * @param {Record<string, string>} inputs
 * @param {{ today?: Date }} [options]
 */
export function validateAssessment(inputs, { today = new Date() } = {}) {
  const values = {};
  const errors = {};

  const check = (field) => {
    const result = validateNumber(inputs[field], NUMERIC_RULES[field]);
    if (result.ok) values[field] = result.value;
    else errors[field] = result.message;
  };

  validateText(inputs, 'facilityName', 120, true, values, errors);
  validateText(inputs, 'equipmentDescription', 200, false, values, errors);
  validateText(inputs, 'auditFinding', 2000, false, values, errors);
  validateChoice(inputs, 'equipmentType', EQUIPMENT_TYPES, values, errors);
  validateChoice(inputs, 'measurementMethod', MEASUREMENT_METHODS, values, errors);
  validateChoice(inputs, 'hoursMode', HOURS_MODES, values, errors);

  BASE_FIELDS.forEach(check);
  validateOperatingHours(inputs, values, errors, check);
  LEAK_FIELDS.forEach(check);
  CONTROL_FIELDS.forEach(check);

  const co2 = validateEmissionInputs(inputs, today);
  Object.assign(errors, co2.errors);

  const baseFields = [...BASE_FIELDS, 'operatingHoursPerYear', 'hoursPerDay', 'daysPerYear', 'hoursMode'];
  const groups = {
    base: baseFields.every((field) => !errors[field]),
    leak: LEAK_FIELDS.every((field) => !errors[field]),
    control: CONTROL_FIELDS.every((field) => !errors[field]),
  };

  return {
    values,
    errors,
    groups,
    co2: co2.status === 'complete' ? { status: 'complete', ...co2.value } : { status: co2.status, missing: co2.missing },
    isValid: Object.keys(errors).length === 0,
  };
}

function validateText(inputs, field, maxLength, required, values, errors) {
  const text = String(inputs[field] ?? '').trim();
  if (required && text === '') errors[field] = MESSAGES.empty;
  else if (text.length > maxLength) errors[field] = `Maksimal ${maxLength} karakter.`;
  else values[field] = text;
}

function validateChoice(inputs, field, options, values, errors) {
  const choice = inputs[field];
  if (Object.hasOwn(options, choice)) values[field] = choice;
  else errors[field] = 'Pilih salah satu opsi.';
}

function validateOperatingHours(inputs, values, errors, check) {
  if (inputs.hoursMode === 'daily') {
    check('hoursPerDay');
    check('daysPerYear');
    if (errors.hoursPerDay || errors.daysPerYear) return;
    const hoursPerYear = values.hoursPerDay * values.daysPerYear;
    if (hoursPerYear > HOURS_PER_YEAR_MAX) {
      errors.daysPerYear = `Jam/hari × hari/tahun = ${hoursPerYear.toLocaleString('id-ID')} jam, melebihi ${HOURS_PER_YEAR_MAX.toLocaleString('id-ID')} jam per tahun.`;
      return;
    }
    values.operatingHoursPerYear = hoursPerYear;
    return;
  }
  check('operatingHoursPerYear');
}

/**
 * CO2 is shown only when factor, grid region, year, and source are all present and valid.
 * Empty inputs mean "not requested", which is not an error.
 */
export function validateEmissionInputs(inputs, today = new Date()) {
  const fields = {
    emissionFactor: String(inputs.emissionFactor ?? '').trim(),
    emissionRegion: String(inputs.emissionRegion ?? '').trim(),
    emissionYear: String(inputs.emissionYear ?? '').trim(),
    emissionSource: String(inputs.emissionSource ?? '').trim(),
  };
  const filled = Object.values(fields).filter((text) => text !== '').length;
  if (filled === 0) return { status: 'not-requested', errors: {}, missing: Object.keys(fields) };

  const errors = {};
  const factor = validateNumber(fields.emissionFactor, NUMERIC_RULES.emissionFactor);
  if (fields.emissionFactor !== '' && !factor.ok) errors.emissionFactor = factor.message;

  let year = null;
  if (fields.emissionYear !== '') {
    const yearRule = {
      label: 'Tahun faktor emisi', unit: '', min: 2000, max: today.getFullYear(), integer: true,
      minMessage: 'Tahun minimal 2000.', maxMessage: 'Tahun tidak boleh di masa depan.',
    };
    const parsedYear = validateNumber(fields.emissionYear, yearRule);
    if (parsedYear.ok) year = parsedYear.value;
    else errors.emissionYear = parsedYear.message;
  }
  if (fields.emissionRegion.length > 120) errors.emissionRegion = 'Maksimal 120 karakter.';
  if (fields.emissionSource.length > 300) errors.emissionSource = 'Maksimal 300 karakter.';

  const missing = Object.entries(fields).filter(([, text]) => text === '').map(([field]) => field);
  if (Object.keys(errors).length > 0) return { status: 'invalid', errors, missing };
  if (missing.length > 0) return { status: 'incomplete', errors: {}, missing };
  return {
    status: 'complete',
    errors: {},
    missing: [],
    value: { factorTonnesPerMwh: factor.value, region: fields.emissionRegion, year, source: fields.emissionSource },
  };
}
