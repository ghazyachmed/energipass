// Browser persistence. The app works without storage (private mode, blocked
// storage): every access is wrapped and falls back to the default fixture.

import { createStateFromFixture, DEFAULT_FIXTURE_ID, getFixture } from '../fixtures/compressor-fixtures.js';
import { SCENARIO_IDS } from '../domain/scenarios.js';

const STORAGE_KEY = 'energiaction-bankable:v1';

export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createStateFromFixture(DEFAULT_FIXTURE_ID);
    return normalizeState(JSON.parse(raw));
  } catch {
    return createStateFromFixture(DEFAULT_FIXTURE_ID);
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable: keep the in-memory state only.
  }
}

/** Accept only known keys with string values; fill gaps from the fixture. */
export function normalizeState(candidate) {
  if (!candidate || candidate.version !== 1) return createStateFromFixture(DEFAULT_FIXTURE_ID);
  const base = createStateFromFixture(getFixture(candidate.fixtureId).id);
  for (const key of Object.keys(base.inputs)) {
    if (typeof candidate.inputs?.[key] === 'string') base.inputs[key] = candidate.inputs[key];
  }
  for (const [id, record] of Object.entries(base.evidence)) {
    for (const field of ['basis', 'reference', 'documentDate', 'review', 'note']) {
      if (typeof candidate.evidence?.[id]?.[field] === 'string') record[field] = candidate.evidence[id][field];
    }
  }
  if (SCENARIO_IDS.includes(candidate.proposedScenarioId)) base.proposedScenarioId = candidate.proposedScenarioId;
  return base;
}
