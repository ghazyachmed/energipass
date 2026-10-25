import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAssessment, validateNumber, NUMERIC_RULES } from '../../src/domain/validation.js';
import { getFixture } from '../../src/fixtures/compressor-fixtures.js';

const TODAY = new Date(2026, 9, 25);
const baseInputs = () => ({ ...getFixture('sim-a').inputs });

test('fixture A inputs are valid', () => {
  const result = validateAssessment(baseInputs(), { today: TODAY });
  assert.deepEqual(result.errors, {});
  assert.equal(result.isValid, true);
  assert.equal(result.values.operatingHoursPerYear, 6000);
});

test('rejects negative and zero power', () => {
  assert.match(validateAssessment({ ...baseInputs(), baselinePowerKw: '-5' }).errors.baselinePowerKw, /negatif/);
  assert.match(validateAssessment({ ...baseInputs(), baselinePowerKw: '0' }).errors.baselinePowerKw, /lebih besar dari 0/);
});

test('rejects operating hours above 8,760 per year', () => {
  const result = validateAssessment({ ...baseInputs(), operatingHoursPerYear: '9000' });
  assert.match(result.errors.operatingHoursPerYear, /8\.760/);
  assert.equal(result.groups.base, false);
});

test('rejects daily mode combination above 8,760 hours', () => {
  const result = validateAssessment({ ...baseInputs(), hoursMode: 'daily', hoursPerDay: '24', daysPerYear: '366' });
  assert.match(result.errors.daysPerYear, /8\.784 jam/);
  const valid = validateAssessment({ ...baseInputs(), hoursMode: 'daily', hoursPerDay: '16', daysPerYear: '300' });
  assert.equal(valid.values.operatingHoursPerYear, 4800);
  assert.equal(validateAssessment({ ...baseInputs(), hoursMode: 'daily', hoursPerDay: '25', daysPerYear: '300' }).errors.hoursPerDay !== undefined, true);
  assert.match(validateAssessment({ ...baseInputs(), hoursMode: 'daily', hoursPerDay: '8', daysPerYear: '250,5' }).errors.daysPerYear, /bulat/);
});

test('rejects percentages outside 0-100', () => {
  assert.ok(validateAssessment({ ...baseInputs(), leakReductionPct: '101' }).errors.leakReductionPct);
  assert.ok(validateAssessment({ ...baseInputs(), controlReductionPct: '-1' }).errors.controlReductionPct);
  assert.equal(validateAssessment({ ...baseInputs(), leakReductionPct: '0' }).errors.leakReductionPct, undefined);
  assert.equal(validateAssessment({ ...baseInputs(), leakReductionPct: '100' }).errors.leakReductionPct, undefined);
});

test('rejects NaN and Infinity values', () => {
  assert.match(validateNumber(Infinity, NUMERIC_RULES.baselinePowerKw).message, /Infinity/);
  assert.match(validateNumber(Number.NaN, NUMERIC_RULES.baselinePowerKw).message, /Infinity atau NaN/);
  assert.match(validateAssessment({ ...baseInputs(), tariffRpPerKwh: 'NaN' }).errors.tariffRpPerKwh, /Masukkan angka/);
  assert.match(validateAssessment({ ...baseInputs(), baselinePowerKw: '1e400' }).errors.baselinePowerKw, /Masukkan angka/);
});

test('flags unit errors for tariff, power, and emission factor', () => {
  assert.match(validateAssessment({ ...baseInputs(), tariffRpPerKwh: '1115000' }).errors.tariffRpPerKwh, /Rp\/MWh/);
  assert.match(validateAssessment({ ...baseInputs(), tariffRpPerKwh: '1,115' }).errors.tariffRpPerKwh, /pemisah/);
  assert.match(validateAssessment({ ...baseInputs(), baselinePowerKw: '110000' }).errors.baselinePowerKw, /bukan W atau kWh/);
  const co2 = validateAssessment({ ...baseInputs(), emissionFactor: '800', emissionRegion: 'Grid X', emissionYear: '2024', emissionSource: 'Dok' });
  assert.match(co2.errors.emissionFactor, /gCO₂\/kWh/);
});

test('field group errors are isolated', () => {
  const result = validateAssessment({ ...baseInputs(), controlInvestmentRp: '-1' });
  assert.deepEqual(result.groups, { base: true, leak: true, control: false });
});

test('CO2 inputs require factor, region, year, and source together', () => {
  assert.equal(validateAssessment(baseInputs(), { today: TODAY }).co2.status, 'not-requested');
  const partial = validateAssessment({ ...baseInputs(), emissionFactor: '0,8' }, { today: TODAY });
  assert.equal(partial.co2.status, 'incomplete');
  assert.deepEqual(partial.co2.missing, ['emissionRegion', 'emissionYear', 'emissionSource']);
  const complete = validateAssessment({ ...baseInputs(), emissionFactor: '0,8', emissionRegion: 'Grid uji', emissionYear: '2024', emissionSource: 'Dokumen uji' }, { today: TODAY });
  assert.equal(complete.co2.status, 'complete');
  assert.equal(complete.co2.factorTonnesPerMwh, 0.8);
  const futureYear = validateAssessment({ ...baseInputs(), emissionFactor: '0,8', emissionRegion: 'Grid uji', emissionYear: '2030', emissionSource: 'Dokumen uji' }, { today: TODAY });
  assert.match(futureYear.errors.emissionYear, /masa depan/);
});

test('required text and choice fields', () => {
  assert.ok(validateAssessment({ ...baseInputs(), facilityName: '  ' }).errors.facilityName);
  assert.ok(validateAssessment({ ...baseInputs(), equipmentType: 'unknown' }).errors.equipmentType);
});
