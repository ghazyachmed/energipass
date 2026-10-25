import { esc } from '../dom.js';
import { selectField, textField } from '../fields.js';
import { EVIDENCE_DEFINITIONS, EVIDENCE_BASIS, REVIEW_STATUS } from '../../domain/evidence.js';
import { MEASUREMENT_METHODS } from '../../domain/validation.js';

const FILTERS = {
  all: 'Semua data',
  required: 'Dibutuhkan opsi diusulkan',
  action: 'Perlu tindakan',
  measured: 'Pengukuran',
  documented: 'Dokumen',
  assumed: 'Asumsi',
  missing: 'Belum tersedia',
};

export const evidenceScreen = {
  id: 'evidence',
  title: 'Evidence Review',
  render({ state, ui }) {
    const filterOptions = Object.entries(FILTERS)
      .map(([value, label]) => `<option value="${value}" ${ui.evidenceFilter === value ? 'selected' : ''}>${esc(label)}</option>`)
      .join('');
    const cards = EVIDENCE_DEFINITIONS.map((definition) => evidenceCard(state, definition)).join('');
    return `
    <div class="page-header">
      <div>
        <p class="eyebrow">Langkah 4 dari 5</p>
        <h1 tabindex="-1">Evidence Review</h1>
        <p>Bedakan data pengukuran, dokumen, asumsi, dan data yang belum tersedia. Catat referensi, tanggal dokumen, dan hasil pemeriksaan engineer.</p>
      </div>
    </div>

    <div data-bind-html="evidence.summary"></div>
    <p class="subtle-note disclaimer">Status Ready menilai kelengkapan data internal untuk opsi yang diusulkan. Ready bukan sertifikasi, bukan audit energi oleh auditor bersertifikat, dan bukan verifikasi hasil (M&amp;V).</p>

    <section class="section" aria-labelledby="evidence-title">
      <div class="section-header">
        <h2 class="section-title" id="evidence-title">Register data</h2>
        <div class="field compact-field">
          <label for="evidence-filter">Tampilkan</label>
          <select class="select" id="evidence-filter" data-ui-field="evidenceFilter">${filterOptions}</select>
        </div>
      </div>
      <div class="section-body evidence-list">${cards}</div>
      <p class="empty-state" id="evidence-empty" hidden>Tidak ada data yang sesuai filter.</p>
    </section>`;
  },
};

function evidenceCard(state, definition) {
  const base = `evidence.${definition.id}`;
  const basisControl = definition.id === 'baselinePower'
    ? selectField(state, { path: 'inputs.measurementMethod', label: 'Metode data daya (menentukan jenis data)', options: MEASUREMENT_METHODS })
    : selectField(state, { path: `${base}.basis`, label: 'Jenis data', options: EVIDENCE_BASIS });

  return `
    <article class="evidence-card" data-evidence-card="${esc(definition.id)}" aria-labelledby="ev-${esc(definition.id)}-title">
      <header class="evidence-card-header">
        <div>
          <h3 id="ev-${esc(definition.id)}-title">${esc(definition.label)}</h3>
          <p class="cell-sub"><span data-bind="${base}.value"></span></p>
          <p class="cell-sub">Jenis data saat ini: <strong data-bind="${base}.basis"></strong> · <span data-bind="${base}.required" data-status-bind="${base}.required"></span></p>
        </div>
        <span class="status-label" data-bind="${base}.status" data-status-bind="${base}.status"></span>
      </header>
      <div class="form-grid evidence-fields">
        ${basisControl}
        ${selectField(state, { path: `${base}.review`, label: 'Pemeriksaan engineer', options: REVIEW_STATUS })}
        ${textField(state, { path: `${base}.reference`, label: 'Referensi dokumen', hint: definition.hint })}
        ${textField(state, { path: `${base}.documentDate`, label: 'Tanggal dokumen', type: 'date' })}
        ${textField(state, { path: `${base}.note`, label: 'Catatan engineer', className: 'span-2' })}
      </div>
      <ul class="issue-list" data-bind-html="${base}.issues"></ul>
    </article>`;
}
