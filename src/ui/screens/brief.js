import { esc } from '../dom.js';
import { formatKwh, formatKw, formatNumber, formatPayback, formatPct, formatRp, formatDateTime } from '../../domain/format.js';

export const briefScreen = {
  id: 'brief',
  title: 'Investment Brief',
  render({ brief, ui }) {
    return `
    <div class="page-header no-print">
      <div>
        <p class="eyebrow">Langkah 5 dari 5</p>
        <h1 tabindex="-1">Investment Decision Brief</h1>
        <p>Ringkasan satu dokumen untuk Plant Manager. Isi dibangun dari input, perhitungan, dan register evidence saat ini.</p>
      </div>
      <div class="page-actions">
        <button class="primary-button" type="button" data-action="print-brief">Cetak / Simpan PDF</button>
        <button class="secondary-button" type="button" data-action="copy-brief">Salin sebagai teks</button>
      </div>
    </div>
    <p class="subtle-note no-print" id="brief-action-status" role="status">${esc(ui.briefMessage ?? '')}</p>
    <p class="subtle-note no-print">Pada dialog cetak, pilih tujuan "Save as PDF" atau "Simpan sebagai PDF" untuk membuat file PDF.</p>
    ${briefDocument(brief)}`;
  },
};

function briefDocument(brief) {
  const p = brief.proposed.result;
  const list = (items) => items.map((item) => `<li>${esc(item)}</li>`).join('');
  const originLabel = brief.dataOrigin === 'simulation'
    ? 'DATA SIMULASI (FIKTIF). Bukan data fasilitas nyata.'
    : 'Data simulasi yang telah diubah pengguna. Belum diverifikasi.';

  return `
  <article class="brief-document" aria-labelledby="brief-title">
    <header class="brief-header">
      <p class="brief-origin">${esc(originLabel)}</p>
      <h2 id="brief-title">Investment Decision Brief: Sistem Kompresor</h2>
      <dl class="brief-meta">
        <div><dt>Fasilitas</dt><dd>${esc(brief.facilityName)}</dd></div>
        <div><dt>Dibuat</dt><dd>${esc(formatDateTime(brief.generatedAt))}</dd></div>
        <div><dt>Status evidence</dt><dd class="brief-status" data-status="${brief.readinessStatus === 'ready' ? 'ok' : 'warning'}">${brief.readinessStatus === 'ready' ? 'Ready untuk review manajemen (bukan sertifikasi)' : `Belum ready: ${brief.missingEvidence.length} catatan`}</dd></div>
        <div><dt>Opsi diusulkan</dt><dd>${esc(brief.proposed.label)}</dd></div>
      </dl>
    </header>

    <section><h3>1. Masalah pada sistem kompresor</h3>
      <p><strong>Peralatan:</strong> ${esc(brief.equipment.type)}. ${esc(brief.equipment.description)}</p>
      <p>${esc(brief.problem)}</p>
    </section>

    <section><h3>2. Baseline energi</h3>
      ${brief.baseline.ok ? `<table class="brief-table"><tbody>
        <tr><th scope="row">Daya rata-rata</th><td>${esc(formatKw(brief.baseline.powerKw))}</td></tr>
        <tr><th scope="row">Jam operasi</th><td>${esc(formatNumber(brief.baseline.hoursPerYear))} jam/tahun</td></tr>
        <tr><th scope="row">Konsumsi listrik</th><td>${esc(formatKwh(brief.baseline.energyKwh))}/tahun</td></tr>
        <tr><th scope="row">Biaya listrik</th><td>${esc(formatRp(brief.baseline.costRp))}/tahun (tarif ${esc(formatRp(brief.baseline.tariffRpPerKwh))}/kWh)</td></tr>
        <tr><th scope="row">Sumber data daya</th><td>${esc(brief.baseline.measurementMethod)}</td></tr>
      </tbody></table>` : '<p>Baseline tidak dihitung karena input tidak valid.</p>'}
    </section>

    <section><h3>3. Opsi perbaikan</h3>
      <table class="brief-table brief-options">
        <thead><tr><th scope="col">Opsi</th><th scope="col">Hemat energi/tahun</th><th scope="col">Net/tahun</th><th scope="col">Investasi</th><th scope="col">Simple payback</th></tr></thead>
        <tbody>${brief.options.map((option) => option.ok ? `<tr${option.id === brief.proposed.id ? ' class="is-proposed"' : ''}>
            <th scope="row">${esc(option.label)}${option.id === brief.proposed.id ? ' (diusulkan)' : ''}</th>
            <td>${esc(formatKwh(option.energySavingsKwh))}</td><td>${esc(formatRp(option.netSavingsRp))}</td>
            <td>${esc(formatRp(option.investmentRp))}</td><td>${esc(formatPayback(option.payback))}</td></tr>`
    : `<tr><th scope="row">${esc(option.label)}</th><td colspan="4">Tidak dihitung: ${esc(option.reasons.join(' '))}</td></tr>`).join('')}</tbody>
      </table>
      ${brief.interaction ? `<p class="brief-note">Opsi gabungan dihitung berurutan. Penjumlahan langsung S1 + S2 = ${esc(formatKwh(brief.interaction.additiveSavingsKwh))}. Hasil sekuensial = ${esc(formatKwh(brief.interaction.combinedSavingsKwh))}. Tumpang tindih ${esc(formatKwh(brief.interaction.overlapKwh))} tidak dihitung ganda.</p>` : ''}
    </section>

    <section><h3>4. Estimasi biaya dan penghematan: ${esc(brief.proposed.label)}</h3>
      ${p ? `<table class="brief-table"><tbody>
        <tr><th scope="row">Penghematan energi</th><td>${esc(formatKwh(p.energySavingsKwh))}/tahun (${esc(formatPct(p.energySavingsPct))})</td></tr>
        <tr><th scope="row">Penghematan biaya listrik</th><td>${esc(formatRp(p.costSavingsRp))}/tahun</td></tr>
        <tr><th scope="row">Biaya operasional tambahan</th><td>${esc(formatRp(p.additionalOpexRp))}/tahun</td></tr>
        <tr><th scope="row">Penghematan bersih</th><td>${esc(formatRp(p.netSavingsRp))}/tahun</td></tr>
        <tr><th scope="row">Biaya investasi</th><td>${esc(formatRp(p.investmentRp))}</td></tr>
        ${brief.co2 ? `<tr><th scope="row">Estimasi pengurangan CO₂</th><td>${esc(formatNumber(brief.co2.tonnesPerYear, 1))} tCO₂/tahun (FE ${esc(formatNumber(brief.co2.factorTonnesPerMwh, 3))} tCO₂/MWh, ${esc(brief.co2.region)}, ${esc(brief.co2.year)}, sumber: ${esc(brief.co2.source)})</td></tr>` : ''}
      </tbody></table>` : '<p>Tidak dihitung karena input tidak valid.</p>'}
    </section>

    <section><h3>5. Simple payback</h3>
      <p class="brief-payback" data-status="${p && p.payback.status === 'not-reached' ? 'error' : 'neutral'}">${p ? esc(formatPayback(p.payback)) : 'Tidak dihitung'}</p>
      <p class="brief-note">Simple payback = biaya investasi ÷ penghematan bersih tahunan. Tidak ditampilkan jika penghematan bersih ≤ 0.</p>
    </section>

    <section><h3>6. Asumsi penting</h3><ul>${list(brief.assumptions)}</ul></section>

    <section><h3>7. Bukti yang belum tersedia atau perlu tindakan</h3>
      ${brief.missingEvidence.length ? `<ul>${list(brief.missingEvidence)}</ul>` : '<p>Tidak ada catatan untuk data wajib opsi ini.</p>'}
      ${brief.warnings.length ? `<p><strong>Catatan:</strong></p><ul>${list(brief.warnings)}</ul>` : ''}
    </section>

    <section><h3>8. Langkah yang perlu disetujui</h3><ol>${list(brief.approvals)}</ol></section>

    <section class="brief-decision"><h3>Keputusan</h3>
      <p>☐ Setujui &nbsp;&nbsp; ☐ Tunda sampai bukti lengkap &nbsp;&nbsp; ☐ Tolak</p>
      <div class="signature-grid"><div>Nama / jabatan</div><div>Tanggal</div><div>Tanda tangan</div></div>
    </section>

    <footer class="brief-footer"><h3>Batasan analisis</h3><ul>${list(brief.limitations)}</ul>
      <p>Dibuat dengan EnergiAction Bankable (demo).</p></footer>
  </article>`;
}
