// Request handling for the Cloudflare Worker (see worker/index.js).
//
// AI stays disabled until the secret ANTHROPIC_API_KEY is set:
//   npx wrangler@4 secret put ANTHROPIC_API_KEY
// Without the secret, /api/ai/status reports { enabled: false } and the UI keeps
// manual input with deterministic calculation.

import Anthropic from '@anthropic-ai/sdk';
import {
  EXTRACTION_JSON_SCHEMA,
  EXTRACTION_SYSTEM_PROMPT,
  MAX_AUDIT_TEXT_CHARS,
  validateExtraction,
} from '../src/ai/extraction-schema.js';

export const AI_MODEL = 'claude-opus-5-5';
const MAX_BODY_BYTES = 32 * 1024;

/**
 * @param {Request} request
 * @param {{ ASSETS?: { fetch: (request: Request) => Promise<Response> }, ANTHROPIC_API_KEY?: string }} env
 * @param {{ createClient?: (apiKey: string) => Anthropic }} [deps] injectable for tests
 */
export async function handleRequest(request, env, deps = {}) {
  const url = new URL(request.url);

  if (url.pathname === '/api/ai/status') {
    if (request.method !== 'GET') return json({ error: 'method_not_allowed' }, 405);
    return json(aiStatus(env));
  }

  if (url.pathname === '/api/ai/extract') {
    if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
    return extractFindings(request, env, deps);
  }

  if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);
  if (env.ASSETS) return env.ASSETS.fetch(request);
  return new Response('Not found', { status: 404 });
}

function aiStatus(env) {
  const enabled = typeof env.ANTHROPIC_API_KEY === 'string' && env.ANTHROPIC_API_KEY.trim() !== '';
  return enabled
    ? { enabled: true, model: AI_MODEL, scope: 'extraction-only' }
    : { enabled: false, reason: 'Secret ANTHROPIC_API_KEY belum dikonfigurasi di server.' };
}

async function extractFindings(request, env, deps) {
  if (!aiStatus(env).enabled) return json({ error: 'ai_disabled', message: 'AI belum diaktifkan.' }, 503);

  const origin = request.headers.get('Origin');
  if (origin && origin !== new URL(request.url).origin) return json({ error: 'forbidden_origin' }, 403);
  if (!(request.headers.get('Content-Type') ?? '').includes('application/json')) {
    return json({ error: 'unsupported_media_type' }, 415);
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return json({ error: 'payload_too_large' }, 413);

  let text;
  try {
    ({ text } = JSON.parse(raw));
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (typeof text !== 'string' || text.trim() === '') return json({ error: 'empty_text', message: 'Teks audit kosong.' }, 400);
  if (text.length > MAX_AUDIT_TEXT_CHARS) {
    return json({ error: 'text_too_long', message: `Teks audit maksimal ${MAX_AUDIT_TEXT_CHARS} karakter.` }, 413);
  }

  const createClient = deps.createClient ?? ((apiKey) => new Anthropic({ apiKey }));
  const client = createClient(env.ANTHROPIC_API_KEY);

  let response;
  try {
    response = await client.beta.messages.create({
      model: AI_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort: 'medium',
        format: { type: 'json_schema', schema: EXTRACTION_JSON_SCHEMA },
      },
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: `<audit_notes>\n${text}\n</audit_notes>` }],
    });
  } catch (error) {
    return json(providerErrorBody(error), providerErrorStatus(error));
  }

  if (response.stop_reason === 'refusal') return json({ error: 'model_refusal', message: 'Model menolak memproses teks ini.' }, 422);
  if (response.stop_reason === 'max_tokens') return json({ error: 'truncated', message: 'Respons AI terpotong. Persingkat teks audit.' }, 422);

  const textBlock = response.content.find((block) => block.type === 'text');
  let proposal;
  try {
    proposal = JSON.parse(textBlock?.text ?? '');
  } catch {
    return json({ error: 'invalid_model_output', message: 'Respons AI bukan JSON yang valid.' }, 502);
  }

  const validation = validateExtraction(proposal, text);
  if (!validation.ok) return json({ error: 'schema_violation', message: validation.error }, 502);

  return json({
    model: response.model,
    accepted: validation.accepted,
    rejected: validation.rejected,
    notice: 'Usulan AI. Setiap item wajib divalidasi engineer sebelum dipakai dalam perhitungan.',
  });
}

function providerErrorStatus(error) {
  if (error instanceof Anthropic.RateLimitError) return 429;
  if (error instanceof Anthropic.AuthenticationError) return 502;
  if (error instanceof Anthropic.APIConnectionError) return 504;
  return 502;
}

function providerErrorBody(error) {
  if (error instanceof Anthropic.RateLimitError) return { error: 'rate_limited', message: 'Batas permintaan AI tercapai. Coba lagi nanti.' };
  if (error instanceof Anthropic.AuthenticationError) return { error: 'provider_auth', message: 'Kredensial AI di server tidak valid.' };
  if (error instanceof Anthropic.APIConnectionError) return { error: 'provider_unreachable', message: 'Server AI tidak dapat dihubungi.' };
  return { error: 'provider_error', message: 'Permintaan ke penyedia AI gagal.' };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
