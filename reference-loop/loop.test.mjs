// Offline checks for loop.mjs: start, note, read, search (task and library), resume.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), 'loop.mjs');
const base = fs.mkdtempSync(path.join(os.tmpdir(), 'reference-loop-'));
const env = { ...process.env, REFERENCE_LIBRARY: path.join(base, 'library') };
const run = (...args) => JSON.parse(execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8', env }));
const call = (...args) => spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env });
const observation = () => ({
  observed_at: '2026-11-07T00:00:00.000Z', status: 'collected',
  source: { url: 'https://example.org/observation', title: 'Source', body: 'Original claim' },
  comments: [], leads: [], coverage: { kind: 'Offline test fixture' }
});

test('note saves any read source as searchable evidence with leads', () => {
  run('start', 'library/panopto', 'captions for a delivery');
  const excerpt = path.join(base, 'excerpt.txt');
  fs.writeFileSync(excerpt, 'def _get_subtitles(): language from AvailableLanguages; see https://example.org/ref');
  const saved = run('note', 'library/panopto', 'https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/panopto.py',
    'yt-dlp getCaptions loops over AvailableLanguages', excerpt);
  assert.match(saved.id, /^E-/);
  const read = run('read', 'library/panopto', saved.id);
  assert.equal(read.status, 'noted');
  assert.ok(read.contexts.some(c => c.text.includes('AvailableLanguages')));
  assert.deepEqual(read.leads, ['https://example.org/ref']);
  assert.equal(read.coverage.truncated, false);
  assert.equal(read.coverage.original_excerpt_chars, fs.readFileSync(excerpt, 'utf8').length);
  assert.equal(read.coverage.raw_excerpt_path, excerpt);
  const filtered = run('read', 'library/panopto', saved.id, 'getcaptions');
  assert.ok(filtered.contexts.length >= 1);
});

test('search library finds evidence and RESULT.md across tasks', () => {
  run('start', 'library/blackboard', 'delta sync');
  fs.writeFileSync(path.join(env.REFERENCE_LIBRARY, 'blackboard', 'RESULT.md'), '# Result\nWalk the tree; attachments have no ETag field.\n');
  const hits = run('search', 'library', 'etag availablelanguages', '10');
  const types = hits.results.map(r => r.type).sort();
  assert.deepEqual(types, ['agent_result', 'raw_evidence']);
});

test('search on a missing library is empty, not an error', () => {
  const out = JSON.parse(execFileSync(process.execPath, [cli, 'search', 'library', 'x'], { encoding: 'utf8',
    env: { ...process.env, REFERENCE_LIBRARY: path.join(base, 'none') } }));
  assert.equal(out.matching_records, 0);
});

test('resume lists noted evidence and its leads', () => {
  const out = run('resume', 'library/panopto');
  assert.equal(out.evidence.length, 1);
  assert.equal(out.candidate_leads[0].url, 'https://example.org/ref');
});

test('note exposes excerpt truncation and the unchanged raw input', () => {
  run('start', 'library/large-excerpt', 'Retain source corrections.');
  const excerpt = path.join(base, 'large-excerpt.txt'), raw = 'A'.repeat(200000) + '\nTAIL_CORRECTION';
  fs.writeFileSync(excerpt, raw);
  const saved = run('note', 'library/large-excerpt', 'https://example.org/long-source', 'Large excerpt', excerpt);
  const read = run('read', 'library/large-excerpt', saved.id);
  assert.equal(read.source.description.length, 200000);
  assert.equal(read.coverage.original_excerpt_chars, raw.length);
  assert.equal(read.coverage.excerpt_chars, 200000);
  assert.equal(read.coverage.truncated, true);
  assert.equal(read.coverage.raw_excerpt_path, excerpt);
  assert.deepEqual(saved.coverage, read.coverage);
  assert.equal(fs.readFileSync(read.coverage.raw_excerpt_path, 'utf8'), raw);
});

test('import reuses identical observations but rejects conflicting content without changing evidence', () => {
  run('start', 'library/import-conflict', 'Preserve conflicting observations.');
  const input = path.join(base, 'import.json'), record = observation();
  fs.writeFileSync(input, JSON.stringify(record));
  const first = run('import', 'library/import-conflict', input), original = fs.readFileSync(first.file, 'utf8');
  // Object key order is not a content change.
  fs.writeFileSync(input, JSON.stringify(Object.fromEntries(Object.entries(record).reverse())));
  const second = run('import', 'library/import-conflict', input);
  assert.equal(second.id, first.id);
  assert.equal(second.reused, true);
  record.source.body = 'Corrected claim';
  fs.writeFileSync(input, JSON.stringify(record));
  const conflict = call('import', 'library/import-conflict', input);
  assert.equal(conflict.status, 1);
  assert.match(conflict.stderr, /Observation conflict.*same source.url and observed_at/);
  assert.ok(conflict.stderr.includes(first.file));
  assert.equal(fs.readFileSync(first.file, 'utf8'), original);
  assert.equal(run('read', 'library/import-conflict', first.id).source.body, 'Original claim');
  assert.equal(fs.readdirSync(path.dirname(first.file)).length, 1);
});

test('import rejects invalid consumed source, comment, reply and lead fields before saving', () => {
  run('start', 'library/invalid-import', 'Reject unusable observations.');
  const input = path.join(base, 'invalid-import.json');
  const cases = [
    record => { record.source.url = 7; },
    record => { record.source.body = []; },
    record => { record.comments = [null]; },
    record => { record.comments = [{ id: 'c', text: {} }]; },
    record => { record.comments = [{ id: 'c', embedded_replies: {} }]; },
    record => { record.comments = [{ id: 'c', embedded_replies: [{ id: 'r', text: 7 }] }]; },
    record => { record.leads = 'https://example.org/lead'; },
    record => { record.leads = [{}]; }
  ];
  for (const mutate of cases) {
    const record = observation();
    mutate(record);
    fs.writeFileSync(input, JSON.stringify(record));
    const rejected = call('import', 'library/invalid-import', input);
    assert.equal(rejected.status, 1, JSON.stringify(record));
    assert.match(rejected.stderr, /Invalid observation:/);
  }
  assert.equal(fs.existsSync(path.join(env.REFERENCE_LIBRARY, 'invalid-import', 'evidence')), false);
});

test('malformed legacy evidence is reported without hiding valid search, read or resume data', () => {
  run('start', 'library/legacy', 'Recover useful results beside malformed data.');
  const saved = run('note', 'library/legacy', 'https://example.org/good', 'LEGACY_FINDME valid evidence');
  const task = path.join(env.REFERENCE_LIBRARY, 'legacy'), folder = path.join(task, 'evidence');
  fs.writeFileSync(path.join(task, 'RESULT.md'), '# LEGACY_FINDME retained decision\n');
  const invalid = observation(); invalid.comments = [null];
  fs.writeFileSync(path.join(folder, 'E-invalid.json'), JSON.stringify(invalid));
  fs.writeFileSync(path.join(folder, 'E-broken.json'), '{');
  const search = run('search', 'library', 'LEGACY_FINDME');
  assert.deepEqual(search.results.map(result => result.type), ['agent_result', 'raw_evidence']);
  const resumed = run('resume', 'library/legacy');
  assert.equal(resumed.evidence.length, 1);
  assert.ok(resumed.result.includes('retained decision'));
  const read = run('read', 'library/legacy', saved.id);
  assert.ok(read.contexts[0].text.includes('LEGACY_FINDME'));
  const filtered = run('read', 'library/legacy', saved.id, 'LEGACY_FINDME');
  for (const output of [search, resumed, read, filtered]) {
    assert.equal(output.evidence_scan_incomplete, true);
    assert.deepEqual(output.warnings.map(warning => warning.id), ['E-broken', 'E-invalid']);
    assert.ok(output.warnings.every(warning => warning.file.startsWith(folder) && warning.error));
  }
  const invalidRead = call('read', 'library/legacy', 'E-invalid');
  assert.equal(invalidRead.status, 1);
  const failure = JSON.parse(invalidRead.stdout);
  assert.equal(failure.evidence_scan_incomplete, true);
  assert.match(failure.error, /Cannot read invalid evidence/);
  assert.ok(failure.warnings.some(warning => warning.error.includes('comments[0] must be an object')));
});

test('search ranks equal-score saved results before raw evidence and can find an unfinished task brief', () => {
  run('start', 'library/ranking', 'RANK_NEED BRIEF_ONLY unfinished work');
  const task = path.join(env.REFERENCE_LIBRARY, 'ranking');
  for (let index = 0; index < 6; index++) run('note', 'library/ranking', `https://example.org/ranking/${index}`, 'RANK_NEED raw evidence');
  fs.writeFileSync(path.join(task, 'RESULT.md'), '# RANK_NEED saved decision\n');
  const search = run('search', 'library', 'RANK_NEED');
  assert.equal(search.matching_records, 8);
  assert.equal(search.results.length, 5);
  assert.equal(search.results[0].type, 'agent_result');
  assert.equal(search.results[0].file, path.join(task, 'RESULT.md'));
  const brief = run('search', 'library', 'BRIEF_ONLY');
  assert.equal(brief.results.length, 1);
  assert.equal(brief.results[0].type, 'task_brief');
  assert.equal(brief.results[0].file, path.join(task, 'TASK.md'));
});
