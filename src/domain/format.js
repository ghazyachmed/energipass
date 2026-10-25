// Presentation formatting (id-ID). Calculations never use these values.

const formatters = new Map();

function formatter(maximumFractionDigits, minimumFractionDigits = 0) {
  const key = `${minimumFractionDigits}-${maximumFractionDigits}`;
  if (!formatters.has(key)) {
    formatters.set(key, new Intl.NumberFormat('id-ID', { maximumFractionDigits, minimumFractionDigits }));
  }
  return formatters.get(key);
}

export function formatNumber(value, maximumFractionDigits = 0, minimumFractionDigits = 0) {
  if (!Number.isFinite(value)) return '-';
  // Avoid "-0" after rounding.
  const rounded = Math.abs(value) < 10 ** -(maximumFractionDigits + 1) ? 0 : value;
  return formatter(maximumFractionDigits, minimumFractionDigits).format(rounded);
}

export function formatRp(value) {
  if (!Number.isFinite(value)) return '-';
  const sign = value < 0 ? '−' : '';
  return `${sign}Rp ${formatNumber(Math.abs(value), 0)}`;
}

export function formatKwh(value) {
  return `${formatNumber(value, 0)} kWh`;
}

export function formatKw(value) {
  return `${formatNumber(value, 2)} kW`;
}

export function formatPct(value, digits = 1) {
  return `${formatNumber(value, digits)}%`;
}

/** @param {{ status: string, years: number | null }} payback */
export function formatPayback(payback) {
  switch (payback.status) {
    case 'ok': {
      const months = Math.round(payback.years * 12);
      return `${formatNumber(payback.years, 1, 1)} tahun (≈ ${formatNumber(months)} bulan)`;
    }
    case 'immediate':
      return '0 tahun (tanpa biaya investasi)';
    case 'not-reached':
      return 'Tidak tercapai: penghematan bersih ≤ 0';
    default:
      return 'Tidak berlaku';
  }
}

export function formatIsoDate(isoText) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoText ?? ''));
  if (!match) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${Number(match[3])} ${months[Number(match[2]) - 1]} ${match[1]}`;
}

export function formatDateTime(date) {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
  }).format(date);
}
