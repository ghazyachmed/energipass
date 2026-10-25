// Test data below is hand-written to exercise the validator. It is not model output.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateExtraction, EXTRACTION_JSON_SCHEMA } from '../../src/ai/extraction-schema.js';

const SOURCE = 'Kompresor screw 75 kW unit 2 sering unload. Daya rata-rata terukur 110 kW selama 7 hari. '
  + 'Tarif Rp 1.115/kWh. Ditemukan 38 titik bocor pada header utama.';

const empty = () => ({ equipment: [], issues: [], parameters: [], missing_information: [], suggested_checks: [] });

test('accepts items whose quote and value appear in the source', () => {
  const result = validateExtraction({
    ...empty(),
    equipment: [{ name: 'Kompresor screw 75 kW', source_quote: 'Kompresor screw 75 kW' }],
    issues: [{ description: 'Kebocoran di header utama', source_quote: 'Ditemukan 38 titik bocor pada header utama' }],
    parameters: [
      { name: 'baseline_power_kw', value: 110, unit: 'kW', source_quote: 'Daya rata-rata terukur 110 kW' },
      { name: 'electricity_tariff_rp_per_kwh', value: 1115, unit: 'Rp/kWh', source_quote: 'Tarif Rp 1.115/kWh' },
    ],
    missing_information: [{ key: 'leak_repair_investment_rp', reason: 'Biaya perbaikan tidak disebut.' }],
    suggested_checks: [{ check_type: 'ultrasonic_leak_survey', reason: 'Kuantifikasi kebocoran.' }],
  }, SOURCE);
  assert.equal(result.ok, true);
  assert.equal(result.rejected.length, 0);
  assert.equal(result.accepted.parameters[0].field, 'baselinePowerKw');
  assert.equal(result.accepted.parameters.length, 2);
});

test('rejects invented values, invented quotes, wrong units, and out-of-range values', () => {
  const result = validateExtraction({
    ...empty(),
    parameters: [
      { name: 'baseline_power_kw', value: 95, unit: 'kW', source_quote: 'Daya rata-rata terukur 110 kW' },
      { name: 'leak_repair_investment_rp', value: 50000000, unit: 'Rp', source_quote: 'Biaya perbaikan Rp 50.000.000' },
      { name: 'baseline_power_kw', value: 110, unit: 'kWh', source_quote: 'Daya rata-rata terukur 110 kW' },
      { name: 'leak_points_count', value: 38, unit: 'titik', source_quote: 'Ditemukan 38 titik bocor' },
    ],
  }, SOURCE);
  assert.equal(result.ok, true);
  assert.deepEqual(result.rejected.map((item) => item.reason), [
    'Nilai tidak tertulis di dalam kutipan sumber.',
    'Kutipan tidak ditemukan di teks audit.',
    'Satuan harus kW.',
  ]);
  assert.equal(result.accepted.parameters.length, 1);
});

test('rejects responses with fields outside the schema, such as savings', () => {
  const result = validateExtraction({ ...empty(), annual_savings_rp: 1000 }, SOURCE);
  assert.equal(result.ok, false);
  assert.match(result.error, /annual_savings_rp/);
  assert.equal(validateExtraction(null, SOURCE).ok, false);
  assert.equal(validateExtraction({ ...empty(), parameters: {} }, SOURCE).ok, false);
});

test('rejects parameter names outside the enum and extra item keys', () => {
  const result = validateExtraction({
    ...empty(),
    parameters: [
      { name: 'annual_savings_rp', value: 1, unit: 'Rp', source_quote: 'Tarif Rp 1.115/kWh' },
      { name: 'baseline_power_kw', value: 110, unit: 'kW', source_quote: 'Daya rata-rata terukur 110 kW', confidence: 0.9 },
    ],
  }, SOURCE);
  assert.equal(result.accepted.parameters.length, 0);
  assert.equal(result.rejected.length, 2);
});

test('schema contains no financial result fields', () => {
  const serialized = JSON.stringify(EXTRACTION_JSON_SCHEMA);
  for (const forbidden of ['savings', 'payback', 'co2', 'emission']) {
    assert.equal(serialized.toLowerCase().includes(forbidden), false, forbidden);
  }
});
