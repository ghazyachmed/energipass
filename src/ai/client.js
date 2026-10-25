// Browser side of the optional AI integration. No API key ever reaches the browser.

const UNAVAILABLE = {
  enabled: false,
  reason: 'Endpoint AI tidak tersedia di hosting ini. Isi formulir secara manual.',
};

export async function fetchAiStatus() {
  try {
    const response = await fetch('/api/ai/status', { headers: { Accept: 'application/json' } });
    if (!response.ok) return UNAVAILABLE;
    const data = await response.json();
    if (data?.enabled === true) return { enabled: true, model: String(data.model ?? '') };
    return { enabled: false, reason: String(data?.reason ?? UNAVAILABLE.reason) };
  } catch {
    return UNAVAILABLE;
  }
}

/**
 * @param {string} text audit notes pasted by the user
 * @returns {Promise<{ ok: true, data: object } | { ok: false, message: string }>}
 */
export async function requestExtraction(text) {
  try {
    const response = await fetch('/api/ai/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, message: String(data.message ?? `Permintaan gagal (HTTP ${response.status}).`) };
    return { ok: true, data };
  } catch {
    return { ok: false, message: 'Server AI tidak dapat dihubungi.' };
  }
}
