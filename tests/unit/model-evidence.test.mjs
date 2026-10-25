import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveModel } from '../../src/domain/model.js';
import { assessEvidenceItem, EVIDENCE_DEFINITIONS, parseIsoDate } from '../../src/domain/evidence.js';
import { createStateFromFixture, dataOrigin } from '../../src/fixtures/compressor-fixtures.js';

const TODAY = new Date(2026, 9, 25);
const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const derive = (state) => deriveModel(state, { today: TODAY });

test('fixture A: all four scenarios match hand calculation', () => {
  const model = derive(createStateFromFixture('sim-a'));
  close(model.scenarios.none.energySavingsKwh, 0);
  close(model.scenarios.leak.energySavingsKwh, 66_000);
  close(model.scenarios.control.energySavingsKwh, 52_800);
  close(model.scenarios.combined.energySavingsKwh, 113_520);
  close(model.scenarios.combined.netSavingsRp, 126_574_800 - 17_000_000);
  close(model.scenarios.combined.payback.years, 225_000_000 / 109_574_800);
  close(model.interaction.overlapKwh, 5_280);
});

test('changing a scenario assumption recalculates dependent scenarios only', () => {
  const state = createStateFromFixture('sim-a');
  const before = derive(state);
  state.inputs.leakReductionPct = '20';
  const after = derive(state);
  close(after.scenarios.leak.energySavingsKwh, 132_000);
  close(after.scenarios.control.energySavingsKwh, before.scenarios.control.energySavingsKwh);
  close(after.scenarios.combined.powerAfterKw, 110 * 0.8 * 0.92);
});

test('invalid control input blocks control and combined, not leak', () => {
  const state = createStateFromFixture('sim-a');
  state.inputs.controlReductionPct = '150';
  const model = derive(state);
  assert.equal(model.scenarios.leak.ok, true);
  assert.equal(model.scenarios.control.ok, false);
  assert.equal(model.scenarios.combined.ok, false);
  assert.equal(model.interaction, null);
});

test('invalid baseline blocks every scenario and readiness', () => {
  const state = createStateFromFixture('sim-a');
  state.inputs.operatingHoursPerYear = '9000';
  const model = derive(state);
  for (const result of Object.values(model.scenarios)) assert.equal(result.ok, false);
  assert.equal(model.readiness.status, 'not-ready');
  assert.ok(model.readiness.blockers.some((text) => text.includes('tidak valid')));
});

test('fixture A is not ready until the engineer reviews the control assumption', () => {
  const state = createStateFromFixture('sim-a');
  const first = derive(state);
  assert.equal(first.readiness.status, 'not-ready');
  assert.deepEqual(first.readiness.blockers, ['Asumsi pengurangan daya: optimasi kontrol: belum diperiksa engineer.']);
  state.evidence.controlReduction.review = 'checked';
  assert.equal(derive(state).readiness.status, 'ready');
  state.evidence.controlReduction.review = 'revise';
  assert.match(derive(state).readiness.blockers[0], /perlu revisi/);
});

test('required evidence depends on the proposed scenario', () => {
  const state = createStateFromFixture('sim-a');
  state.proposedScenarioId = 'leak';
  const model = derive(state);
  assert.equal(model.readiness.status, 'ready');
  assert.equal(model.readiness.requiredCount, 5);
  state.proposedScenarioId = 'none';
  assert.match(derive(state).readiness.blockers[0], /Pilih opsi perbaikan/);
});

test('fixture B: nameplate baseline and missing evidence block readiness', () => {
  const model = derive(createStateFromFixture('sim-b'));
  assert.equal(model.readiness.status, 'not-ready');
  const text = model.readiness.blockers.join('\n');
  assert.match(text, /Baseline daya belum berasal dari pengukuran/);
  assert.match(text, /Biaya perbaikan kebocoran .*belum tersedia/);
  assert.equal(model.readiness.counts.assumed >= 2, true);
  close(model.scenarios.leak.energySavingsKwh, 78 * 4800 * 0.15);
});

test('evidence dates: invalid, future, and stale', () => {
  const definition = EVIDENCE_DEFINITIONS.find((item) => item.id === 'tariff');
  const inputs = { measurementMethod: 'logger' };
  const base = { basis: 'documented', reference: 'Doc', review: 'checked' };
  assert.match(assessEvidenceItem(definition, { ...base, documentDate: '2026-13-01' }, inputs, TODAY).blockers[0], /format tanggal/);
  assert.match(assessEvidenceItem(definition, { ...base, documentDate: '2026-11-01' }, inputs, TODAY).blockers[0], /masa depan/);
  const stale = assessEvidenceItem(definition, { ...base, documentDate: '2024-01-10' }, inputs, TODAY);
  assert.deepEqual(stale.blockers, []);
  assert.match(stale.warnings[0], /12 bulan/);
  assert.equal(parseIsoDate('2026-02-30'), null);
});

test('spot measurement counts as measured but adds a warning', () => {
  const state = createStateFromFixture('sim-a');
  state.inputs.measurementMethod = 'spot';
  state.evidence.controlReduction.review = 'checked';
  const model = derive(state);
  assert.equal(model.readiness.status, 'ready');
  assert.match(model.readiness.warnings.join(' '), /Pengukuran sesaat/);
});

test('CO2 is shown only with a complete emission factor record', () => {
  const state = createStateFromFixture('sim-a');
  assert.equal(derive(state).co2.status, 'not-requested');
  Object.assign(state.inputs, { emissionFactor: '0,8', emissionRegion: 'Grid uji', emissionYear: '2024', emissionSource: 'Dokumen uji' });
  const model = derive(state);
  assert.equal(model.co2.status, 'shown');
  close(model.co2.tonnesPerYear, 113.52 * 0.8);
});

test('data origin turns to modified after an edit', () => {
  const state = createStateFromFixture('sim-a');
  assert.equal(dataOrigin(state), 'simulation');
  state.inputs.baselinePowerKw = '111';
  assert.equal(dataOrigin(state), 'modified-simulation');
});
