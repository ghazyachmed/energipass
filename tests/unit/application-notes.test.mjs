import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const MAX_CHARACTERS = 1400;
const notes = readFileSync(new URL('../../docs/MAJUON_APPLICATION_NOTES.md', import.meta.url), 'utf8');
const drafts = [...notes.matchAll(/<!-- draft:(Q\d) -->\n([\s\S]*?)\n<!-- \/draft -->/g)]
  .map(([, id, body]) => ({ id, body: body.trim() }));

test('application notes contain six drafts', () => {
  assert.deepEqual(drafts.map((draft) => draft.id), ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6']);
});

test('each draft answer is at most 1,400 characters', () => {
  for (const { id, body } of drafts) {
    const length = [...body].length;
    assert.ok(length <= MAX_CHARACTERS, `${id} has ${length} characters`);
  }
});

test('drafts state that user interviews have not been done', () => {
  assert.match(drafts.find((draft) => draft.id === 'Q3').body, /Not yet/);
});
