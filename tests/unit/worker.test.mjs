// The Anthropic API is replaced by a local fetch stub. These tests check request
// shaping, response validation, and error handling. They do not call a real model.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import Anthropic from '@anthropic-ai/sdk';
import worker from '../../worker/index.js';
import { handleRequest, AI_MODEL } from '../../worker/handler.js';

const SOURCE = 'Daya rata-rata terukur 110 kW selama 7 hari. Ditemukan 38 titik bocor.';
const ORIGIN = 'https://demo.example';

function stubClient(messageBody, captured) {
  const fetch = async (url, init) => {
    captured.url = String(url);
    captured.headers = Object.fromEntries(new Headers(init.headers).entries());
    captured.body = JSON.parse(init.body);
    return new Response(JSON.stringify(messageBody), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return () => new Anthropic({ apiKey: 'test-key', fetch, maxRetries: 0 });
}

function message(content, stopReason = 'end_turn') {
  return {
    id: 'msg_stub', type: 'message', role: 'assistant', model: AI_MODEL,
    content: [{ type: 'text', text: JSON.stringify(content) }],
    stop_reason: stopReason, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
  };
}

const extractRequest = (body, headers = {}) => new Request(`${ORIGIN}/api/ai/extract`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: ORIGIN, ...headers },
  body: JSON.stringify(body),
});

test('status reports disabled without the secret', async () => {
  const response = await handleRequest(new Request(`${ORIGIN}/api/ai/status`), {});
  assert.deepEqual(await response.json(), { enabled: false, reason: 'Secret ANTHROPIC_API_KEY belum dikonfigurasi di server.' });
  const extract = await handleRequest(extractRequest({ text: SOURCE }), {});
  assert.equal(extract.status, 503);
});

test('extract sends structured-output request and filters unsupported items', async () => {
  const captured = {};
  const proposal = {
    equipment: [], issues: [], missing_information: [], suggested_checks: [],
    parameters: [
      { name: 'baseline_power_kw', value: 110, unit: 'kW', source_quote: 'Daya rata-rata terukur 110 kW' },
      { name: 'electricity_tariff_rp_per_kwh', value: 1500, unit: 'Rp/kWh', source_quote: 'Tarif Rp 1.500/kWh' },
    ],
  };
  const response = await handleRequest(extractRequest({ text: SOURCE }), { ANTHROPIC_API_KEY: 'k' }, { createClient: stubClient(message(proposal), captured) });
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.accepted.parameters.length, 1);
  assert.equal(body.rejected[0].reason, 'Kutipan tidak ditemukan di teks audit.');

  assert.match(captured.url, /\/v1\/messages/);
  assert.equal(captured.body.model, 'claude-opus-5-5');
  assert.equal(captured.body.output_config.format.type, 'json_schema');
  assert.equal(captured.body.fallbacks, 'default');
  assert.match(captured.headers['anthropic-beta'], /server-side-fallback-2026-07-01/);
  assert.match(captured.body.messages[0].content, /110 kW/);
});

test('extract handles refusal, truncation, invalid JSON, and schema violations', async () => {
  const env = { ANTHROPIC_API_KEY: 'k' };
  const run = (body) => handleRequest(extractRequest({ text: SOURCE }), env, { createClient: stubClient(body, {}) });
  assert.equal((await run(message({}, 'refusal'))).status, 422);
  assert.equal((await run(message({}, 'max_tokens'))).status, 422);
  const invalid = message({});
  invalid.content[0].text = 'not json';
  assert.equal((await run(invalid)).status, 502);
  const extra = await run(message({ equipment: [], issues: [], parameters: [], missing_information: [], suggested_checks: [], payback_years: 2 }));
  assert.equal(extra.status, 502);
  assert.match((await extra.json()).message, /payback_years/);
});

test('extract rejects bad requests before calling the provider', async () => {
  const env = { ANTHROPIC_API_KEY: 'k' };
  const failClient = () => { throw new Error('provider must not be called'); };
  assert.equal((await handleRequest(extractRequest({ text: '' }), env, { createClient: failClient })).status, 400);
  assert.equal((await handleRequest(extractRequest({ text: 'x'.repeat(8001) }), env, { createClient: failClient })).status, 413);
  assert.equal((await handleRequest(extractRequest({ text: SOURCE }, { Origin: 'https://other.example' }), env, { createClient: failClient })).status, 403);
  const wrongType = new Request(`${ORIGIN}/api/ai/extract`, { method: 'POST', body: 'text', headers: { 'Content-Type': 'text/plain' } });
  assert.equal((await handleRequest(wrongType, env, { createClient: failClient })).status, 415);
  assert.equal((await handleRequest(new Request(`${ORIGIN}/api/ai/extract`), env)).status, 405);
});

test('non-API paths are served from static assets', async () => {
  let served = null;
  const env = { ASSETS: { fetch: async (request) => { served = new URL(request.url).pathname; return new Response('ok'); } } };
  const response = await handleRequest(new Request(`${ORIGIN}/index.html`), env);
  assert.equal(await response.text(), 'ok');
  assert.equal(served, '/index.html');
  assert.equal((await handleRequest(new Request(`${ORIGIN}/api/unknown`), env)).status, 404);
});

test('entry module exports only the default fetch handler', async () => {
  const entry = await import('../../worker/index.js');
  assert.deepEqual(Object.keys(entry), ['default']);
  const response = await worker.fetch(new Request(`${ORIGIN}/api/ai/status`), {});
  assert.equal((await response.json()).enabled, false);
});
