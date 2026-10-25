const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };

/** Escape text for HTML element content and attribute values. */
export function esc(value = '') {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ESCAPES[character]);
}

export function getPath(object, path) {
  return path.split('.').reduce((current, key) => (current == null ? undefined : current[key]), object);
}

/** Set a nested value. Creates missing intermediate objects. */
export function setPath(object, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  const target = keys.reduce((current, key) => {
    if (current[key] == null || typeof current[key] !== 'object') current[key] = {};
    return current[key];
  }, object);
  target[last] = value;
}
