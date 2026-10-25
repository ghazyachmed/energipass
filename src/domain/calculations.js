// Deterministic energy and financial calculations. No I/O, no rounding.
// Rounding happens only in the presentation layer.

/** Annual Energy (kWh/year) = Power (kW) × Operating Hours (h/year) */
export function annualEnergyKwh(powerKw, hoursPerYear) {
  return powerKw * hoursPerYear;
}

/**
 * Power after measures that overlap. Each reduction applies to the power left
 * after the previous measure, so savings are not double counted:
 *   P_after = P_baseline × (1 − r1) × (1 − r2) × …
 * Multiplication is commutative, so the measure order does not change the result.
 * @param {number} baselineKw
 * @param {number[]} reductionFractions values in [0, 1]
 */
export function powerAfterMeasuresKw(baselineKw, reductionFractions) {
  return reductionFractions.reduce((powerKw, fraction) => powerKw * (1 - fraction), baselineKw);
}

/**
 * Simple Payback (years) = Investment Cost / Annual Net Savings.
 * Returns no positive payback when annual net savings are zero or negative.
 * @returns {{ status: 'ok' | 'immediate' | 'not-reached', years: number | null }}
 */
export function simplePayback(investmentRp, annualNetSavingsRp) {
  if (!(annualNetSavingsRp > 0)) return { status: 'not-reached', years: null };
  if (investmentRp === 0) return { status: 'immediate', years: 0 };
  return { status: 'ok', years: investmentRp / annualNetSavingsRp };
}

/** CO2 reduction (tCO2/year) = Energy savings (MWh/year) × Grid emission factor (tCO2/MWh) */
export function co2ReductionTonnes(energySavingsKwh, factorTonnesPerMwh) {
  return (energySavingsKwh / 1000) * factorTonnesPerMwh;
}

/**
 * Evaluate one scenario.
 * @param {{ powerKw: number, hoursPerYear: number, tariffRpPerKwh: number }} baseline
 * @param {{ reductionFraction: number, investmentRp: number, opexRpPerYear: number }[]} measures
 */
export function evaluateScenario(baseline, measures) {
  const baselineEnergyKwh = annualEnergyKwh(baseline.powerKw, baseline.hoursPerYear);
  const powerAfterKw = powerAfterMeasuresKw(baseline.powerKw, measures.map((m) => m.reductionFraction));
  const energyAfterKwh = annualEnergyKwh(powerAfterKw, baseline.hoursPerYear);
  // Annual Savings = Baseline Energy − Post-improvement Energy
  const energySavingsKwh = baselineEnergyKwh - energyAfterKwh;
  const costSavingsRp = energySavingsKwh * baseline.tariffRpPerKwh;
  const additionalOpexRp = sum(measures.map((m) => m.opexRpPerYear));
  // Annual Net Savings = Electricity Cost Savings − Additional Annual Operating Cost
  const netSavingsRp = costSavingsRp - additionalOpexRp;
  const investmentRp = sum(measures.map((m) => m.investmentRp));

  return {
    powerAfterKw,
    baselineEnergyKwh,
    baselineCostRp: baselineEnergyKwh * baseline.tariffRpPerKwh,
    energyAfterKwh,
    energySavingsKwh,
    energySavingsPct: baselineEnergyKwh > 0 ? (energySavingsKwh / baselineEnergyKwh) * 100 : 0,
    costSavingsRp,
    additionalOpexRp,
    netSavingsRp,
    investmentRp,
    payback: measures.length === 0 ? { status: 'not-applicable', years: null } : simplePayback(investmentRp, netSavingsRp),
  };
}

/**
 * Savings realisation test: what happens to net savings and payback if only a
 * share of the estimated energy savings materialises. Opex and investment stay fixed.
 * @param {ReturnType<typeof evaluateScenario>} result
 * @param {number[]} realisationFractions
 */
export function savingsRealisation(result, realisationFractions) {
  return realisationFractions.map((fraction) => {
    const costSavingsRp = result.costSavingsRp * fraction;
    const netSavingsRp = costSavingsRp - result.additionalOpexRp;
    return {
      fraction,
      energySavingsKwh: result.energySavingsKwh * fraction,
      costSavingsRp,
      netSavingsRp,
      payback: simplePayback(result.investmentRp, netSavingsRp),
    };
  });
}

function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
