// Improvement scenarios for one compressed air system.

export const MEASURES = Object.freeze({
  leak: {
    id: 'leak',
    label: 'Perbaikan kebocoran compressed air',
    fields: { reductionPct: 'leakReductionPct', investmentRp: 'leakInvestmentRp', opexRpPerYear: 'leakOpexRpPerYear' },
    group: 'leak',
  },
  control: {
    id: 'control',
    label: 'Optimasi kontrol kompresor',
    fields: { reductionPct: 'controlReductionPct', investmentRp: 'controlInvestmentRp', opexRpPerYear: 'controlOpexRpPerYear' },
    group: 'control',
  },
});

export const SCENARIOS = Object.freeze([
  { id: 'none', label: 'Tanpa intervensi', shortLabel: 'S0', measureIds: [] },
  { id: 'leak', label: 'Perbaikan kebocoran', shortLabel: 'S1', measureIds: ['leak'] },
  { id: 'control', label: 'Optimasi kontrol', shortLabel: 'S2', measureIds: ['control'] },
  { id: 'combined', label: 'Gabungan: kebocoran lalu kontrol', shortLabel: 'S3', measureIds: ['leak', 'control'] },
]);

export const SCENARIO_IDS = SCENARIOS.map((scenario) => scenario.id);

export function getScenario(id) {
  return SCENARIOS.find((scenario) => scenario.id === id) ?? SCENARIOS[0];
}
