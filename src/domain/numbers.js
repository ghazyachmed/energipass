// Parse numbers typed by Indonesian users without relying on browser locale.
//
// Accepted forms:
//   "1115"        plain integer
//   "1.115"       dot as thousands separator (first group 1-3 digits, not "0")
//   "45.000.000"  several thousands groups
//   "0,5"         comma as decimal separator
//   "1.234,5"     thousands groups + decimal comma
//   "12.5"        single dot followed by a non-3-digit group = decimal point
//   "-5"          negative sign (accepted here so validation can explain the rule)
// Rejected: letters, exponent notation, "Infinity", "NaN", mixed or repeated separators.

const THOUSANDS_GROUPED = /^[1-9]\d{0,2}(\.\d{3})+$/;
const DIGITS = /^\d+$/;
const DECIMAL_POINT = /^\d+\.\d+$/;
const ALLOWED_CHARACTERS = /^-?[0-9.,]+$/;

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: number } | { ok: false, reason: 'empty' | 'not-a-number' | 'not-finite' }}
 */
export function parseNumberInput(raw) {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? { ok: true, value: raw } : { ok: false, reason: 'not-finite' };
  }
  if (raw === null || raw === undefined) return { ok: false, reason: 'empty' };

  const text = String(raw).trim().replace(/\s+/g, '');
  if (text === '') return { ok: false, reason: 'empty' };
  if (!ALLOWED_CHARACTERS.test(text)) return { ok: false, reason: 'not-a-number' };

  const negative = text.startsWith('-');
  const normalized = normalizeUnsigned(negative ? text.slice(1) : text);
  if (normalized === null) return { ok: false, reason: 'not-a-number' };

  const value = Number((negative ? '-' : '') + normalized);
  if (!Number.isFinite(value)) return { ok: false, reason: 'not-finite' };
  return { ok: true, value };
}

function normalizeUnsigned(body) {
  if (body.includes(',')) return normalizeDecimalComma(body);
  if (body.includes('.')) {
    if (THOUSANDS_GROUPED.test(body)) return body.replace(/\./g, '');
    if (DECIMAL_POINT.test(body)) return body;
    return null;
  }
  return DIGITS.test(body) ? body : null;
}

function normalizeDecimalComma(body) {
  const parts = body.split(',');
  if (parts.length !== 2) return null;
  const [integerPart, fractionPart] = parts;
  if (!DIGITS.test(fractionPart)) return null;
  if (integerPart.includes('.')) {
    if (!THOUSANDS_GROUPED.test(integerPart)) return null;
    return `${integerPart.replace(/\./g, '')}.${fractionPart}`;
  }
  if (!DIGITS.test(integerPart)) return null;
  return `${integerPart}.${fractionPart}`;
}

/**
 * Extract every number written in a text fragment, using the same rules as parseNumberInput.
 * Used to check that a value proposed by AI is literally present in its source quote.
 * @param {string} text
 * @returns {number[]}
 */
export function extractNumbers(text) {
  const tokens = String(text ?? '').match(/\d[\d.,]*/g) ?? [];
  const values = [];
  for (const token of tokens) {
    const trimmed = token.replace(/[.,]+$/, '');
    const parsed = parseNumberInput(trimmed);
    if (parsed.ok) values.push(parsed.value);
  }
  return values;
}
