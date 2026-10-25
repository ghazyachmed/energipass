// Application shell: state, routing, event delegation, and live updates.

import { deriveModel } from './domain/model.js';
import { buildBrief, briefToPlainText } from './domain/brief.js';
import { parseNumberInput } from './domain/numbers.js';
import { NUMERIC_RULES } from './domain/validation.js';
import { formatNumber } from './domain/format.js';
import { createStateFromFixture, dataOrigin } from './fixtures/compressor-fixtures.js';
import { loadState, saveState } from './state/store.js';
import { fetchAiStatus, requestExtraction } from './ai/client.js';
import { buildView } from './ui/view-model.js';
import { setPath, getPath, esc } from './ui/dom.js';
import { assessmentScreen, aiPanel, aiResults } from './ui/screens/assessment.js';
import { scenariosScreen } from './ui/screens/scenarios.js';
import { financialScreen } from './ui/screens/financial.js';
import { evidenceScreen } from './ui/screens/evidence.js';
import { briefScreen } from './ui/screens/brief.js';

const SCREENS = [assessmentScreen, scenariosScreen, financialScreen, evidenceScreen, briefScreen];
const DEFAULT_ROUTE = 'assessment';

let state = loadState();
let model = deriveModel(state);
const ui = { route: DEFAULT_ROUTE, evidenceFilter: 'all', briefMessage: '' };
const ai = { status: null, text: '', loading: false, result: null, error: '', applied: new Set() };

const main = document.getElementById('main-content');
const sidebar = document.getElementById('sidebar');
const mobileMenu = document.getElementById('mobile-menu');
const helpDialog = document.getElementById('help-dialog');
const topbarTitle = document.getElementById('topbar-title');
const aiChip = document.getElementById('ai-status-chip');

function currentScreen() {
  return SCREENS.find((screen) => screen.id === ui.route) ?? SCREENS[0];
}

function routeFromHash() {
  const id = window.location.hash.replace(/^#\/?/, '');
  return SCREENS.some((screen) => screen.id === id) ? id : DEFAULT_ROUTE;
}

// ---------- Rendering ----------

function resultStrip() {
  return `
    <section class="result-strip no-print" aria-label="Ringkasan hasil opsi diusulkan">
      <div><span>Opsi diusulkan</span><strong data-bind="strip.scenario"></strong></div>
      <div><span>Baseline</span><strong data-bind="strip.baseline"></strong></div>
      <div><span>Penghematan energi</span><strong data-bind="strip.savings"></strong></div>
      <div><span>Penghematan bersih</span><strong data-bind="strip.net"></strong></div>
      <div><span>Simple payback</span><strong data-bind="strip.payback" data-status-bind="strip.payback"></strong></div>
      <div><span>Evidence</span><strong data-bind="strip.readiness" data-status-bind="strip.readiness"></strong></div>
    </section>
    <p class="strip-errors no-print" data-bind="strip.errors" data-hide-empty role="status"></p>`;
}

function pager() {
  const index = SCREENS.indexOf(currentScreen());
  const previous = SCREENS[index - 1];
  const next = SCREENS[index + 1];
  return `<nav class="pager no-print" aria-label="Langkah sebelumnya dan berikutnya">
    ${previous ? `<a class="secondary-button" href="#/${previous.id}">← ${esc(previous.title)}</a>` : '<span></span>'}
    ${next ? `<a class="primary-button" href="#/${next.id}">Lanjut: ${esc(next.title)} →</a>` : ''}
  </nav>`;
}

function currentBrief() {
  return buildBrief(model, state, { generatedAt: new Date(), dataOrigin: dataOrigin(state) });
}

function renderScreen({ focusHeading = false } = {}) {
  const screen = currentScreen();
  const context = { state, model, ai, ui, brief: screen.id === 'brief' ? currentBrief() : null };
  main.innerHTML = `${screen.id === 'brief' ? '' : resultStrip()}${screen.render(context)}${pager()}`;
  topbarTitle.textContent = screen.title;
  document.title = `${screen.title} · EnergiAction Bankable`;
  document.querySelectorAll('.nav-item').forEach((link) => {
    const active = link.dataset.route === screen.id;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'step');
    else link.removeAttribute('aria-current');
  });
  refresh();
  if (focusHeading) main.querySelector('h1')?.focus({ preventScroll: true });
}

/** Recalculate and update every bound element without rebuilding inputs. */
function refresh() {
  model = deriveModel(state);
  const view = buildView(model, state);

  document.querySelectorAll('[data-bind]').forEach((element) => {
    const value = view.text[element.dataset.bind];
    element.textContent = value ?? '';
    if (element.hasAttribute('data-hide-empty')) element.hidden = !value;
  });
  document.querySelectorAll('[data-bind-html]').forEach((element) => {
    const value = view.html[element.dataset.bindHtml] ?? '';
    if (element.innerHTML !== value) element.innerHTML = value;
  });
  document.querySelectorAll('[data-status-bind]').forEach((element) => {
    element.dataset.status = view.status[element.dataset.statusBind] ?? 'neutral';
  });
  document.querySelectorAll('.nav-item small[data-bind]').forEach((element) => {
    element.dataset.status = view.status[element.dataset.bind] ?? 'neutral';
  });

  updateFieldMessages();
  updateConditionalSections();
  applyEvidenceFilter();
  if (ui.route === 'brief') rerenderBrief();
}

function updateFieldMessages() {
  const { errors } = model.validation;
  main.querySelectorAll('[data-error-for]').forEach((element) => {
    element.textContent = errors[element.dataset.errorFor] ?? '';
  });
  main.querySelectorAll('[data-field]').forEach((input) => {
    const key = input.dataset.field.split('.').pop();
    if (input.type === 'radio') return;
    input.setAttribute('aria-invalid', errors[key] ? 'true' : 'false');
  });
  main.querySelectorAll('[data-parsed-for]').forEach((element) => {
    const key = element.dataset.parsedFor;
    const parsed = parseNumberInput(state.inputs[key]);
    const rule = NUMERIC_RULES[key];
    element.textContent = parsed.ok && !errors[key] && rule ? `Terbaca: ${formatNumber(parsed.value, 4)} ${rule.unit}` : '';
  });
}

function updateConditionalSections() {
  main.querySelectorAll('[data-show-when]').forEach((element) => {
    const [path, expected] = element.dataset.showWhen.split(':');
    element.hidden = getPath(state, path) !== expected;
  });
}

function applyEvidenceFilter() {
  if (ui.route !== 'evidence') return;
  const requiredIds = new Set(model.readiness.items.map((item) => item.id));
  const incomplete = new Set(model.readiness.items.filter((item) => !item.complete).map((item) => item.id));
  let visible = 0;
  main.querySelectorAll('[data-evidence-card]').forEach((card) => {
    const id = card.dataset.evidenceCard;
    const basisText = card.querySelector(`[data-bind="evidence.${id}.basis"]`)?.textContent ?? '';
    const basisMatch = { measured: 'Pengukuran', documented: 'Dokumen', assumed: 'Asumsi', missing: 'Belum tersedia' }[ui.evidenceFilter];
    const show = ui.evidenceFilter === 'all'
      || (ui.evidenceFilter === 'required' && requiredIds.has(id))
      || (ui.evidenceFilter === 'action' && incomplete.has(id))
      || (basisMatch !== undefined && basisText === basisMatch);
    card.hidden = !show;
    if (show) visible += 1;
  });
  const empty = document.getElementById('evidence-empty');
  if (empty) empty.hidden = visible > 0;
}

function rerenderBrief() {
  const article = main.querySelector('.brief-document');
  if (!article) return;
  const fresh = document.createElement('div');
  fresh.innerHTML = briefScreen.render({ brief: currentBrief(), ui });
  const replacement = fresh.querySelector('.brief-document');
  if (replacement) article.replaceWith(replacement);
}

// ---------- State updates ----------

function commit() {
  saveState(state);
  refresh();
}

function onFieldInput(event) {
  const input = event.target.closest('[data-field]');
  if (input) {
    if (input.type === 'radio' && !input.checked) return;
    setPath(state, input.dataset.field, input.value);
    commit();
    return;
  }
  const uiInput = event.target.closest('[data-ui-field]');
  if (uiInput) {
    ui[uiInput.dataset.uiField] = uiInput.value;
    refresh();
  }
  if (event.target.id === 'ai-text') ai.text = event.target.value;
}

function setInputValue(path, value) {
  setPath(state, path, value);
  const element = main.querySelector(`[data-field="${path}"]`);
  if (element) element.value = value;
}

const actions = {
  'load-fixture': () => {
    const select = document.getElementById('fixture-select');
    replaceState(createStateFromFixture(select?.value));
  },
  'reset-fixture': () => replaceState(createStateFromFixture(state.fixtureId)),
  'print-brief': () => window.print(),
  'copy-brief': async () => {
    const text = briefToPlainText(currentBrief());
    ui.briefMessage = await copyText(text) ? 'Teks ringkasan disalin ke clipboard.' : 'Clipboard tidak tersedia di browser ini.';
    const status = document.getElementById('brief-action-status');
    if (status) status.textContent = ui.briefMessage;
  },
  'ai-extract': runExtraction,
  'ai-apply-parameter': (button) => {
    setInputValue(`inputs.${button.dataset.targetField}`, String(button.dataset.value));
    if (button.dataset.targetField === 'operatingHoursPerYear') setInputValue('inputs.hoursMode', 'annual');
    markApplied(button);
  },
  'ai-apply-equipment': (button) => {
    setInputValue('inputs.equipmentDescription', button.dataset.value);
    markApplied(button);
  },
  'ai-apply-issue': (button) => {
    const current = String(state.inputs.auditFinding ?? '').trim();
    setInputValue('inputs.auditFinding', current ? `${current}\n${button.dataset.value}` : button.dataset.value);
    markApplied(button);
  },
};

function markApplied(button) {
  ai.applied.add(button.dataset.aiKey);
  commit();
  const results = document.getElementById('ai-results');
  if (results) results.innerHTML = aiResults(ai);
}

function replaceState(next) {
  state = next;
  ai.applied = new Set();
  saveState(state);
  renderScreen();
}

function rerenderAiPanel() {
  const panel = document.getElementById('ai-panel');
  if (panel) panel.outerHTML = aiPanel(ai);
}

async function runExtraction() {
  const text = document.getElementById('ai-text')?.value ?? '';
  ai.text = text;
  ai.result = null;
  ai.applied = new Set();
  if (text.trim() === '') {
    ai.error = 'Tempel teks audit terlebih dahulu.';
    rerenderAiPanel();
    return;
  }
  ai.loading = true;
  ai.error = '';
  rerenderAiPanel();
  const response = await requestExtraction(text);
  ai.loading = false;
  ai.result = response.ok ? response.data : null;
  ai.error = response.ok ? '' : response.message;
  rerenderAiPanel();
  document.getElementById('ai-results')?.scrollIntoView({ block: 'start' });
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const copied = document.execCommand('copy');
    area.remove();
    return copied;
  }
}

// ---------- Wiring ----------

main.addEventListener('input', onFieldInput);
main.addEventListener('change', onFieldInput);
document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;
  const action = actions[button.dataset.action];
  if (action) action(button);
});

window.addEventListener('hashchange', () => {
  // Only "#/<screen>" hashes are routes. Other fragments are in-page anchors.
  if (!window.location.hash.startsWith('#/')) return;
  ui.route = routeFromHash();
  ui.briefMessage = '';
  closeSidebar();
  renderScreen({ focusHeading: true });
  window.scrollTo({ top: 0 });
});

function closeSidebar() {
  sidebar.classList.remove('open');
  mobileMenu.setAttribute('aria-expanded', 'false');
}

mobileMenu.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  mobileMenu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sidebar.classList.contains('open')) {
    closeSidebar();
    mobileMenu.focus();
  }
});
document.querySelector('.skip-link').addEventListener('click', (event) => {
  event.preventDefault();
  main.focus();
});
document.getElementById('help-button').addEventListener('click', () => helpDialog.showModal());
document.getElementById('help-close').addEventListener('click', () => helpDialog.close());

function showAiStatus(status) {
  ai.status = status;
  aiChip.textContent = status.enabled ? 'AI aktif: ekstraksi saja' : 'AI belum diaktifkan';
  aiChip.dataset.status = status.enabled ? 'ok' : 'disabled';
  aiChip.title = status.enabled ? `Model: ${status.model}. Usulan AI wajib divalidasi engineer.` : status.reason;
  rerenderAiPanel();
}

ui.route = routeFromHash();
renderScreen();
fetchAiStatus().then(showAiStatus);
