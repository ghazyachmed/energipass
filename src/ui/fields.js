// Form field markup. Every input carries data-field="<state path>" so one
// delegated listener in main.js can update state for all screens.

import { esc, getPath } from './dom.js';

const fieldId = (path) => `f-${path.replace(/\./g, '-')}`;
const errorKey = (path) => path.split('.').pop();

function describedBy(path, hint) {
  const id = fieldId(path);
  return [hint ? `${id}-hint` : '', `${id}-error`].filter(Boolean).join(' ');
}

function messages(path, hint, { parsed = false } = {}) {
  const id = fieldId(path);
  const key = errorKey(path);
  return [
    hint ? `<p class="field-hint" id="${id}-hint">${esc(hint)}</p>` : '',
    parsed ? `<p class="field-parsed" data-parsed-for="${esc(key)}" aria-hidden="true"></p>` : '',
    `<p class="field-error" id="${id}-error" data-error-for="${esc(key)}" aria-live="polite"></p>`,
  ].join('');
}

export function numberField(state, { path, label, unit, hint, className = '' }) {
  const id = fieldId(path);
  return `<div class="field ${className}">
    <label for="${id}">${esc(label)}</label>
    <div class="input-unit">
      <input class="input" id="${id}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"
        data-field="${esc(path)}" value="${esc(getPath(state, path))}" aria-describedby="${describedBy(path, hint)}">
      <span class="unit-suffix" aria-hidden="true">${esc(unit)}</span>
    </div>
    ${messages(path, hint, { parsed: true })}
  </div>`;
}

export function textField(state, { path, label, hint, type = 'text', className = '', placeholder = '' }) {
  const id = fieldId(path);
  return `<div class="field ${className}">
    <label for="${id}">${esc(label)}</label>
    <input class="input" id="${id}" type="${esc(type)}" autocomplete="off" data-field="${esc(path)}"
      value="${esc(getPath(state, path))}" placeholder="${esc(placeholder)}" aria-describedby="${describedBy(path, hint)}">
    ${messages(path, hint)}
  </div>`;
}

export function textAreaField(state, { path, label, hint, rows = 4, className = '' }) {
  const id = fieldId(path);
  return `<div class="field ${className}">
    <label for="${id}">${esc(label)}</label>
    <textarea class="input textarea" id="${id}" rows="${rows}" data-field="${esc(path)}" aria-describedby="${describedBy(path, hint)}">${esc(getPath(state, path))}</textarea>
    ${messages(path, hint)}
  </div>`;
}

export function selectField(state, { path, label, options, hint, className = '' }) {
  const id = fieldId(path);
  const current = getPath(state, path);
  const optionMarkup = Object.entries(options)
    .map(([value, text]) => `<option value="${esc(value)}" ${value === current ? 'selected' : ''}>${esc(text)}</option>`)
    .join('');
  return `<div class="field ${className}">
    <label for="${id}">${esc(label)}</label>
    <select class="select" id="${id}" data-field="${esc(path)}" aria-describedby="${describedBy(path, hint)}">${optionMarkup}</select>
    ${messages(path, hint)}
  </div>`;
}

export function radioGroup(state, { path, legend, options, className = '' }) {
  const current = getPath(state, path);
  const name = fieldId(path);
  const items = Object.entries(options).map(([value, text]) => `
    <label class="radio-option">
      <input type="radio" name="${name}" value="${esc(value)}" data-field="${esc(path)}" ${value === current ? 'checked' : ''}>
      <span>${esc(text)}</span>
    </label>`).join('');
  return `<fieldset class="field radio-group ${className}"><legend>${esc(legend)}</legend>${items}</fieldset>`;
}
