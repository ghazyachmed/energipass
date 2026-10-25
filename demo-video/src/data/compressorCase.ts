// One simulated compressor case used in every scene. All figures are fictional.
// The derived values are computed here and checked, so the video cannot show
// numbers that disagree with the formulas.

export const CASE = {
  baselinePowerKw: 100,
  afterRepairPowerKw: 85,
  operatingHoursPerYear: 4000,
  tariffRpPerKwh: 1500,
  investmentRp: 180_000_000,
  additionalOpexRpPerYear: 0,
} as const;

export const baselineEnergyKwh = CASE.baselinePowerKw * CASE.operatingHoursPerYear;
export const afterEnergyKwh = CASE.afterRepairPowerKw * CASE.operatingHoursPerYear;
export const savingsKwh = baselineEnergyKwh - afterEnergyKwh;
export const costSavingsRp = savingsKwh * CASE.tariffRpPerKwh;
export const netSavingsRp = costSavingsRp - CASE.additionalOpexRpPerYear;
export const paybackYears = netSavingsRp > 0 ? CASE.investmentRp / netSavingsRp : null;
export const powerReductionPct = ((CASE.baselinePowerKw - CASE.afterRepairPowerKw) / CASE.baselinePowerKw) * 100;

const EXPECTED: Array<[string, number | null, number]> = [
  ['baseline energy', baselineEnergyKwh, 400_000],
  ['after-repair energy', afterEnergyKwh, 340_000],
  ['energy savings', savingsKwh, 60_000],
  ['cost savings', costSavingsRp, 90_000_000],
  ['net savings', netSavingsRp, 90_000_000],
  ['simple payback', paybackYears, 2],
  ['power reduction', powerReductionPct, 15],
];
for (const [name, actual, expected] of EXPECTED) {
  if (actual !== expected) throw new Error(`Case check failed: ${name} = ${actual}, expected ${expected}`);
}

const grouped = new Intl.NumberFormat('en-US');
export const num = (value: number) => grouped.format(value);
export const rp = (value: number) => `Rp${grouped.format(value)}`;
