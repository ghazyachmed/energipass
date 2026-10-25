import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveModel } from '../../src/domain/model.js';
import { buildBrief, briefToPlainText } from '../../src/domain/brief.js';
import { createStateFromFixture, dataOrigin } from '../../src/fixtures/compressor-fixtures.js';

const TODAY = new Date(2026, 9, 25);
const make = (state) => buildBrief(deriveModel(state, { today: TODAY }), state, { generatedAt: TODAY, dataOrigin: dataOrigin(state) });

test('brief contains every required section with consistent numbers', () => {
  const state = createStateFromFixture('sim-a');
  const brief = make(state);
  const text = briefToPlainText(brief);
  for (const heading of ['1. Masalah', '2. Baseline energi', '3. Opsi perbaikan', '4. Opsi yang diusulkan', '5. Simple payback', '6. Asumsi penting', '7. Bukti yang belum tersedia', '8. Langkah yang perlu disetujui', 'Batasan analisis']) {
    assert.ok(text.includes(heading), heading);
  }
  assert.match(text, /660\.000 kWh/);
  assert.match(text, /113\.520 kWh/);
  assert.match(text, /Rp 109\.574\.800/);
  assert.match(text, /2,1 tahun/);
  assert.match(text, /DATA SIMULASI/);
  assert.match(text, /Belum ready/);
  assert.equal(brief.options.length, 4);
});

test('brief lists approvals and missing evidence for fixture B', () => {
  const brief = make(createStateFromFixture('sim-b'));
  assert.ok(brief.approvals[0].includes('power logger'));
  assert.ok(brief.approvals.some((step) => step.includes('Rp 30.000.000')));
  assert.ok(brief.missingEvidence.length >= 3);
  assert.ok(brief.assumptions.some((line) => line.includes('berstatus asumsi')));
});

test('brief warns when net savings are not positive', () => {
  const state = createStateFromFixture('sim-a');
  state.proposedScenarioId = 'leak';
  state.inputs.leakOpexRpPerYear = '90000000';
  const brief = make(state);
  assert.equal(brief.proposed.result.payback.status, 'not-reached');
  assert.match(brief.approvals[0], /tidak positif/);
  assert.match(briefToPlainText(brief), /Tidak tercapai/);
});

test('brief marks modified data and includes CO2 only when complete', () => {
  const state = createStateFromFixture('sim-a');
  state.inputs.baselinePowerKw = '120';
  assert.equal(make(state).co2, null);
  Object.assign(state.inputs, { emissionFactor: '0,8', emissionRegion: 'Grid uji', emissionYear: '2024', emissionSource: 'Dokumen uji' });
  const brief = make(state);
  assert.equal(brief.dataOrigin, 'modified-simulation');
  assert.match(briefToPlainText(brief), /tCO2\/tahun/);
});
