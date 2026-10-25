// SIMULATED demo data. Every facility, document reference, and number below is
// fictional and exists only to demonstrate the workflow. No value represents a
// real company, a real measurement, a real quotation, or an official tariff.

export const FIXTURES = Object.freeze([
  {
    id: 'sim-a',
    label: 'Simulasi A: kompresor screw fixed-speed, data logger tersedia',
    proposedScenarioId: 'combined',
    inputs: {
      facilityName: 'Pabrik Simulasi A (fiktif): Ruang Kompresor 1',
      equipmentType: 'screw-fixed',
      equipmentDescription: '2 unit rotary screw 75 kW, kontrol load/unload, setpoint tekanan 7,5 bar',
      auditFinding:
        'Survei ultrasonik (simulasi) mencatat 38 titik bocor pada jaringan distribusi. '
        + 'Data logger 7 hari (simulasi) menunjukkan unit 2 berada pada kondisi unload 41% dari waktu operasi. '
        + 'Setpoint tekanan 7,5 bar lebih tinggi dari kebutuhan peralatan pengguna sebesar 6,0 bar.',
      baselinePowerKw: '110',
      hoursMode: 'annual',
      operatingHoursPerYear: '6000',
      hoursPerDay: '24',
      daysPerYear: '250',
      tariffRpPerKwh: '1115',
      measurementMethod: 'logger',
      leakReductionPct: '10',
      leakInvestmentRp: '45000000',
      leakOpexRpPerYear: '12000000',
      controlReductionPct: '8',
      controlInvestmentRp: '180000000',
      controlOpexRpPerYear: '5000000',
      emissionFactor: '',
      emissionRegion: '',
      emissionYear: '',
      emissionSource: '',
    },
    evidence: {
      baselinePower: { reference: 'SIM-LOG-01: data logger daya 7 hari (fiktif)', documentDate: '2026-09-14', review: 'checked', note: '' },
      operatingHours: { basis: 'documented', reference: 'SIM-PROD-2026: jadwal produksi 3 shift (fiktif)', documentDate: '2026-09-01', review: 'checked', note: '' },
      tariff: { basis: 'documented', reference: 'SIM-BILL-08: tagihan listrik Agustus 2026 (fiktif)', documentDate: '2026-09-05', review: 'checked', note: 'Nilai simulasi, bukan tarif resmi.' },
      leakReduction: { basis: 'assumed', reference: 'SIM-LEAK-01: laporan survei ultrasonik (fiktif)', documentDate: '2026-09-16', review: 'checked', note: 'Kompresor load/unload: pengurangan daya lebih kecil dari pengurangan kebocoran.' },
      leakCost: { basis: 'documented', reference: 'SIM-QUOTE-11: penawaran perbaikan kebocoran (fiktif)', documentDate: '2026-09-20', review: 'checked', note: '' },
      controlReduction: { basis: 'assumed', reference: 'SIM-LOG-01: profil load/unload (fiktif)', documentDate: '2026-09-14', review: 'unchecked', note: 'Perlu diperiksa engineer sebelum brief final.' },
      controlCost: { basis: 'documented', reference: 'SIM-QUOTE-12: penawaran sequencer (fiktif)', documentDate: '2026-09-22', review: 'checked', note: '' },
    },
  },
  {
    id: 'sim-b',
    label: 'Simulasi B: hanya data nameplate, belum ada pengukuran',
    proposedScenarioId: 'leak',
    inputs: {
      facilityName: 'Pabrik Simulasi B (fiktif): Lini Pengemasan',
      equipmentType: 'screw-fixed',
      equipmentDescription: '1 unit rotary screw 90 kW (data nameplate)',
      auditFinding:
        'Walk-through audit (simulasi) mendengar kebocoran di area pengemasan. '
        + 'Belum ada pengukuran daya. Daya rata-rata diestimasi dari nameplate dan faktor beban asumsi.',
      baselinePowerKw: '78',
      hoursMode: 'daily',
      operatingHoursPerYear: '4800',
      hoursPerDay: '16',
      daysPerYear: '300',
      tariffRpPerKwh: '1115',
      measurementMethod: 'nameplate',
      leakReductionPct: '15',
      leakInvestmentRp: '30000000',
      leakOpexRpPerYear: '8000000',
      controlReductionPct: '6',
      controlInvestmentRp: '150000000',
      controlOpexRpPerYear: '0',
      emissionFactor: '',
      emissionRegion: '',
      emissionYear: '',
      emissionSource: '',
    },
    evidence: {
      baselinePower: { reference: 'SIM-NP-01: foto nameplate (fiktif)', documentDate: '2026-10-02', review: 'checked', note: 'Faktor beban 0,87 adalah asumsi.' },
      operatingHours: { basis: 'assumed', reference: '', documentDate: '', review: 'unchecked', note: 'Berdasarkan wawancara operator (simulasi).' },
      tariff: { basis: 'documented', reference: 'SIM-BILL-09: tagihan listrik September 2026 (fiktif)', documentDate: '2026-10-03', review: 'checked', note: 'Nilai simulasi, bukan tarif resmi.' },
      leakReduction: { basis: 'assumed', reference: '', documentDate: '', review: 'unchecked', note: 'Belum ada leak survey.' },
      leakCost: { basis: 'missing', reference: '', documentDate: '', review: 'unchecked', note: 'Penawaran vendor belum diminta.' },
      controlReduction: { basis: 'missing', reference: '', documentDate: '', review: 'unchecked', note: '' },
      controlCost: { basis: 'missing', reference: '', documentDate: '', review: 'unchecked', note: '' },
    },
  },
]);

export const DEFAULT_FIXTURE_ID = 'sim-a';

export function getFixture(id) {
  return FIXTURES.find((fixture) => fixture.id === id) ?? FIXTURES[0];
}

/** Deep copy so edits never mutate the frozen fixture. */
export function createStateFromFixture(id) {
  const fixture = getFixture(id);
  return {
    version: 1,
    fixtureId: fixture.id,
    proposedScenarioId: fixture.proposedScenarioId,
    inputs: { ...fixture.inputs },
    evidence: Object.fromEntries(Object.entries(fixture.evidence).map(([key, record]) => [key, { ...record }])),
  };
}

/** 'simulation' when inputs and evidence equal the fixture, otherwise 'modified-simulation'. */
export function dataOrigin(state) {
  const fixture = getFixture(state.fixtureId);
  const sameInputs = Object.entries(fixture.inputs).every(([key, value]) => state.inputs[key] === value);
  const sameEvidence = Object.entries(fixture.evidence).every(([key, record]) =>
    Object.entries(record).every(([field, value]) => state.evidence[key]?.[field] === value));
  return sameInputs && sameEvidence && state.proposedScenarioId === fixture.proposedScenarioId
    ? 'simulation'
    : 'modified-simulation';
}
