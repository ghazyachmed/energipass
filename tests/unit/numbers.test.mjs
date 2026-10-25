import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumberInput, extractNumbers } from '../../src/domain/numbers.js';

test('parses plain, grouped, and decimal forms', () => {
  const cases = [
    ['1115', 1115],
    ['1.115', 1115],
    ['45.000.000', 45000000],
    ['0,5', 0.5],
    ['1.234,5', 1234.5],
    ['12.5', 12.5],
    ['0.115', 0.115],
    [' 110 ', 110],
    ['-5', -5],
  ];
  for (const [raw, expected] of cases) {
    assert.deepEqual(parseNumberInput(raw), { ok: true, value: expected }, raw);
  }
});

test('rejects empty, letters, exponent, Infinity, NaN, and malformed separators', () => {
  assert.equal(parseNumberInput('').reason, 'empty');
  assert.equal(parseNumberInput(null).reason, 'empty');
  for (const raw of ['abc', '1e3', 'Infinity', 'NaN', '1,2,3', '1.2.3', '12.34.5', '1,', ',5x']) {
    assert.equal(parseNumberInput(raw).ok, false, raw);
  }
  assert.equal(parseNumberInput(Infinity).reason, 'not-finite');
  assert.equal(parseNumberInput(Number.NaN).reason, 'not-finite');
  assert.equal(parseNumberInput('9'.repeat(400)).reason, 'not-finite');
});

test('extractNumbers finds Indonesian-formatted numbers in a sentence', () => {
  assert.deepEqual(extractNumbers('Daya rata-rata 110 kW, tarif Rp 1.115/kWh, setpoint 7,5 bar.'), [110, 1115, 7.5]);
});
