import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  annualEnergyKwh, powerAfterMeasuresKw, simplePayback, evaluateScenario, co2ReductionTonnes, savingsRealisation,
} from '../../src/domain/calculations.js';

const close = (actual, expected, tolerance = 1e-6) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
const baseline = { powerKw: 110, hoursPerYear: 6000, tariffRpPerKwh: 1115 };
const leak = { reductionFraction: 0.10, investmentRp: 45_000_000, opexRpPerYear: 12_000_000 };
const control = { reductionFraction: 0.08, investmentRp: 180_000_000, opexRpPerYear: 5_000_000 };

test('Annual Energy = Power x Operating Hours', () => {
  assert.equal(annualEnergyKwh(110, 6000), 660_000);
});

test('sequential reductions do not add up', () => {
  close(powerAfterMeasuresKw(110, [0.10, 0.08]), 91.08);
  close(powerAfterMeasuresKw(110, [0.08, 0.10]), 91.08);
  const combined = evaluateScenario(baseline, [leak, control]);
  const additive = evaluateScenario(baseline, [leak]).energySavingsKwh + evaluateScenario(baseline, [control]).energySavingsKwh;
  close(combined.energySavingsKwh, 113_520);
  close(additive, 118_800);
  assert.ok(combined.energySavingsKwh < additive);
});

test('scenario result follows the explicit formulas', () => {
  const result = evaluateScenario(baseline, [leak]);
  close(result.baselineEnergyKwh, 660_000);
  close(result.energyAfterKwh, 594_000);
  close(result.energySavingsKwh, 66_000);
  close(result.costSavingsRp, 73_590_000);
  close(result.netSavingsRp, 61_590_000);
  close(result.payback.years, 45_000_000 / 61_590_000);
  assert.equal(result.payback.status, 'ok');
});

test('payback is not positive when net savings are zero or negative', () => {
  assert.deepEqual(simplePayback(1000, 0), { status: 'not-reached', years: null });
  assert.deepEqual(simplePayback(1000, -1), { status: 'not-reached', years: null });
  assert.deepEqual(simplePayback(0, 500), { status: 'immediate', years: 0 });
  const costly = evaluateScenario(baseline, [{ ...leak, opexRpPerYear: 80_000_000 }]);
  assert.equal(costly.payback.status, 'not-reached');
  assert.equal(costly.payback.years, null);
});

test('no-intervention scenario has zero savings and no payback', () => {
  const none = evaluateScenario(baseline, []);
  assert.equal(none.energySavingsKwh, 0);
  assert.equal(none.payback.status, 'not-applicable');
});

test('100% reduction and 0% reduction edge cases', () => {
  assert.equal(evaluateScenario(baseline, [{ ...leak, reductionFraction: 1 }]).energyAfterKwh, 0);
  const zero = evaluateScenario(baseline, [{ ...leak, reductionFraction: 0 }]);
  assert.equal(zero.energySavingsKwh, 0);
  assert.equal(zero.payback.status, 'not-reached');
});

test('CO2 = MWh saved x factor', () => {
  close(co2ReductionTonnes(113_520, 0.8), 90.816);
});

test('savings realisation keeps investment and opex fixed', () => {
  const result = evaluateScenario(baseline, [leak]);
  const [half, , full] = savingsRealisation(result, [0.5, 0.75, 1]);
  close(half.netSavingsRp, 73_590_000 * 0.5 - 12_000_000);
  close(full.netSavingsRp, result.netSavingsRp);
  close(half.payback.years, 45_000_000 / (73_590_000 * 0.5 - 12_000_000));
});
