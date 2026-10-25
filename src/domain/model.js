// Compose validation, calculations, and evidence rules into one derived model.
// The UI reads only this output, so every displayed number has one source.

import { validateAssessment } from './validation.js';
import { evaluateScenario, co2ReductionTonnes, savingsRealisation } from './calculations.js';
import { MEASURES, SCENARIOS, getScenario } from './scenarios.js';
import { assessReadiness } from './evidence.js';

export const REALISATION_FRACTIONS = [0.5, 0.75, 1];

/**
 * @param {{ inputs: Record<string,string>, evidence: Record<string,object>, proposedScenarioId: string }} state
 * @param {{ today?: Date }} [options]
 */
export function deriveModel(state, { today = new Date() } = {}) {
  const validation = validateAssessment(state.inputs, { today });
  const { values, groups } = validation;

  const scenarios = {};
  for (const scenario of SCENARIOS) {
    scenarios[scenario.id] = evaluateScenarioSafely(scenario, values, groups, validation.errors);
  }

  const interaction = describeInteraction(scenarios);
  const proposedScenario = getScenario(state.proposedScenarioId);
  const proposedResult = scenarios[proposedScenario.id];

  const co2 = validation.co2.status === 'complete' && proposedResult.ok
    ? {
      ...validation.co2,
      status: 'shown',
      tonnesPerYear: co2ReductionTonnes(proposedResult.energySavingsKwh, validation.co2.factorTonnesPerMwh),
    }
    : { status: validation.co2.status === 'complete' ? 'blocked' : validation.co2.status, missing: validation.co2.missing ?? [] };

  const readiness = assessReadiness(state.evidence, state.inputs, proposedScenario.id, {
    inputsValid: validation.isValid,
    today,
  });

  return {
    validation,
    scenarios,
    interaction,
    proposedScenario,
    proposedResult,
    realisation: proposedResult.ok && proposedScenario.measureIds.length > 0
      ? savingsRealisation(proposedResult, REALISATION_FRACTIONS)
      : [],
    co2,
    readiness,
  };
}

function evaluateScenarioSafely(scenario, values, groups, errors) {
  const blockingGroups = ['base', ...scenario.measureIds.map((id) => MEASURES[id].group)];
  const failedGroups = blockingGroups.filter((group) => !groups[group]);
  if (failedGroups.length > 0) {
    return {
      ok: false,
      scenario,
      reasons: failedGroups.map((group) => GROUP_LABELS[group]),
      errorFields: Object.keys(errors),
    };
  }

  const baseline = {
    powerKw: values.baselinePowerKw,
    hoursPerYear: values.operatingHoursPerYear,
    tariffRpPerKwh: values.tariffRpPerKwh,
  };
  const measures = scenario.measureIds.map((id) => {
    const { fields } = MEASURES[id];
    return {
      id,
      reductionFraction: values[fields.reductionPct] / 100,
      investmentRp: values[fields.investmentRp],
      opexRpPerYear: values[fields.opexRpPerYear],
    };
  });
  return { ok: true, scenario, measures, baseline, ...evaluateScenario(baseline, measures) };
}

const GROUP_LABELS = {
  base: 'Data baseline (daya, jam operasi, atau tarif) tidak valid.',
  leak: 'Input perbaikan kebocoran tidak valid.',
  control: 'Input optimasi kontrol tidak valid.',
};

/**
 * Show why the combined scenario saves less than the sum of the two standalone measures.
 */
function describeInteraction(scenarios) {
  const { leak, control, combined } = scenarios;
  if (!leak.ok || !control.ok || !combined.ok) return null;
  const additiveSavingsKwh = leak.energySavingsKwh + control.energySavingsKwh;
  return {
    additiveSavingsKwh,
    combinedSavingsKwh: combined.energySavingsKwh,
    overlapKwh: additiveSavingsKwh - combined.energySavingsKwh,
  };
}
