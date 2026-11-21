import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as flow from './flow.mjs';

const base = fs.mkdtempSync(path.join(os.tmpdir(), 'reference-loop-check-'));
const identity = { task_id: 'test-reference', request_revision: 1, attempt_id: 'local-1' };
const request = { schema_version: 1, ...identity, owner: 'test', question: 'Read a browser page', target_runtime: 'Windows test fixture', contributor_platforms: ['Windows', 'macOS'], source_policy: 'test fixture only', stop_condition: 'one reviewed module', requirements: [{ id: 'read', text: 'Read accessible page content' }], budget: { max_candidates: 2, max_selected_files: 3 } };
const acquisitions = { ...identity, candidates: [{ id: 'browser', title: 'Fixture browser', url: 'https://example.org/browser', revision: 'fixture-sha256', discovery_path: [{ locator: 'fixture://seed', relation: 'test seed' }], observations: [{ id: 'source', capability: 'page', method: 'fixture', status: 'ok', coverage: 'one file', locator: 'fixture://read.js', observed_at: '2026-10-23T12:00:00Z', summary: 'read function' }, { id: 'comments', capability: 'comments', method: 'fixture', status: 'failed', coverage: 'no comments acquired', locator: 'fixture://comments', observed_at: '2026-10-23T12:00:00Z', summary: 'fixture transport unavailable' }] }], frontier: [{ locator: 'https://example.org/discussion', lane: 'links', reason: 'Review next round' }] };
const review = { ...identity, reviewer: 'test-reviewer', decisions: [{ candidate_id: 'browser', decision: 'select', requirement_ids: ['read'], evidence_ids: ['source'], rationale: 'function matches requirement', source_quality: 'test fixture', engineering_quality: 'source inspection only', task_fit: 'page text', limits: ['comment acquisition failed'] }] };
const modules = { ...identity, modules: [{ id: 'read-module', name: 'Browser reading', candidate_id: 'browser', categories: ['acquisition'], requirement_ids: ['read'], anchors: [{ path: 'read.js', symbol: 'read' }], reuse_mode: 'existing_tool', input: 'page', output: 'text', errors: 'page unavailable', integration: 'invoke separately', dependencies: ['browser'], unknowns: ['macOS not run'], validation: { level: 'source_reviewed', runtime: 'fixture', evidence: 'test input only' } }] };
const source = path.join(base, 'source'); fs.mkdirSync(source);
fs.writeFileSync(path.join(source, 'read.js'), 'export const read = () => "fixture";\n');
fs.writeFileSync(path.join(source, 'LICENSE'), 'Synthetic fixture created for this test.\n');
const selection = { ...identity, files: ['read.js', 'LICENSE'].map(file => ({ candidate_id: 'browser', root: 'source', path: file, role: file === 'LICENSE' ? 'license' : 'implementation', expected_sha256: flow.hash(fs.readFileSync(path.join(source, file))) })) };
let counter = 0;
function fresh(stage = 'request') {
  const run = path.join(base, 'run-' + ++counter); flow.init(run, structuredClone(request));
  if (stage !== 'request') flow.record(run, 'acquisitions', structuredClone(acquisitions));
  if (['review', 'prepared', 'modules'].includes(stage)) flow.record(run, 'review', structuredClone(review));
  if (['prepared', 'modules'].includes(stage)) flow.prepare(run, structuredClone(selection), { source });
  if (stage === 'modules') flow.record(run, 'modules', structuredClone(modules));
  return run;
}

test('connected local path: partial acquisition -> catalog -> adoption -> query, with portable readback', () => {
  const run = fresh('modules'); const library = path.join(base, 'library');
  const result = flow.publish(run, library);
  assert.equal(flow.publish(run, library).id, result.id);
  assert.equal(flow.verify(result.file).bundle.acquisitions.candidates[0].observations[1].status, 'failed');
  assert.equal(flow.query(library, 'browser')[0].feedback.length, 0);
  flow.feedback(library, { ...identity, entry_id: result.id, id: 'receipt-1', consumer: 'fixture consumer', module_ids: ['read-module'], disposition: 'adapt', reason: 'needs pagination', runtime: 'fixture only', evidence: 'test result', remaining_gaps: ['inspect next page'] });
  assert.equal(flow.query(library, 'acquisition')[0].feedback[0].remaining_gaps[0], 'inspect next page');
  const relocated = path.join(base, 'relocated'); fs.mkdirSync(relocated);
  fs.copyFileSync(result.file, path.join(relocated, result.id + '.json'));
  assert.equal(flow.verify(path.join(relocated, result.id + '.json')).id, result.id);
  assert.ok(!fs.readFileSync(result.file, 'utf8').includes(source.replaceAll('\\', '\\\\')));
});

test('repeated input is idempotent; changed request identity cannot overwrite a recorded stage', () => {
  const run = fresh('acquisitions'); flow.record(run, 'acquisitions', structuredClone(acquisitions));
  const stale = structuredClone(acquisitions); stale.request_revision = 2;
  assert.throws(() => flow.record(run, 'acquisitions', stale), /stale or foreign/);
  const changed = structuredClone(acquisitions); changed.candidates[0].title = 'changed';
  assert.throws(() => flow.record(run, 'acquisitions', changed), /immutable record conflict/);
  assert.equal(flow.loadRun(run).acquisitions.candidates[0].title, 'Fixture browser');
});

test('cannot publish without all stages or select evidence from a failed capability', () => {
  assert.throws(() => flow.publish(fresh(), path.join(base, 'incomplete')), /incomplete/);
  const bad = structuredClone(review); bad.decisions[0].evidence_ids = ['comments'];
  assert.throws(() => flow.record(fresh('acquisitions'), 'review', bad), /acquired evidence/);
  const unknown = structuredClone(review); unknown.decisions[0].evidence_ids = ['missing'];
  assert.throws(() => flow.record(fresh('acquisitions'), 'review', unknown), /unknown ID/);
});

test('preparation rejects traversal, source drift, missing terms and Windows path aliases', () => {
  const run = fresh('review');
  const bad = structuredClone(selection); bad.files[0].path = '../read.js';
  assert.throws(() => flow.prepare(run, bad, { source }), /unsafe relative/);
  bad.files[0].path = 'CON.txt'; assert.throws(() => flow.prepare(run, bad, { source }), /unsafe relative/);
  const drift = structuredClone(selection); drift.files[0].expected_sha256 = '0'.repeat(64);
  assert.throws(() => flow.prepare(run, drift, { source }), /source changed/);
  const noTerms = structuredClone(selection); noTerms.files.pop();
  assert.throws(() => flow.prepare(run, noTerms, { source }), /license\/source terms/);
});

test('preparation rejects source-root junction escapes', () => {
  const outside = path.join(base, 'outside'); fs.mkdirSync(outside); fs.writeFileSync(path.join(outside, 'outside.js'), 'outside');
  fs.symlinkSync(outside, path.join(source, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
  const bad = structuredClone(selection); bad.files[0].path = 'linked/outside.js';
  assert.throws(() => flow.prepare(fresh('review'), bad, { source }), /symlink\/junction/);
});

test('modules must point to prepared files and reviewed requirements', () => {
  const run = fresh('prepared'); const bad = structuredClone(modules);
  bad.modules[0].anchors[0].path = 'unread.js';
  assert.throws(() => flow.record(run, 'modules', bad), /anchor is not prepared/);
  bad.modules[0].anchors[0].path = 'read.js'; bad.modules[0].requirement_ids = ['unreviewed'];
  assert.throws(() => flow.record(run, 'modules', bad), /requirement was not reviewed/);
});

test('tampered bundles and feedback for another attempt are rejected', () => {
  const library = path.join(base, 'integrity-library'); const result = flow.publish(fresh('modules'), library);
  assert.throws(() => flow.feedback(library, { ...identity, attempt_id: 'other', entry_id: result.id }), /stale or foreign/);
  const corrupt = flow.readJSON(result.file); corrupt.prepared.files[0].content_base64 = Buffer.from('changed').toString('base64');
  const damaged = path.join(base, 'damaged'); fs.mkdirSync(damaged); fs.writeFileSync(path.join(damaged, result.id + '.json'), flow.encode(corrupt));
  assert.throws(() => flow.verify(path.join(damaged, result.id + '.json')), /bytes\/hash mismatch/);
});

test('bounded inputs and interrupted staged records cannot become published results', () => {
  const run = fresh(); const excess = structuredClone(acquisitions);
  excess.candidates = [1, 2, 3].map(i => ({ ...excess.candidates[0], id: 'c' + i }));
  assert.throws(() => flow.record(run, 'acquisitions', excess), /budget exceeded/);
  fs.mkdirSync(path.join(run, '.staging'), { recursive: true });
  fs.writeFileSync(path.join(run, '.staging', 'interrupted.json'), '{partial');
  assert.equal(flow.status(run).next, 'acquisitions');
});

test('actual CLI starts without dependencies and reports a useful failure exit', () => {
  const cli = fileURLToPath(new URL('./flow.mjs', import.meta.url));
  const run = fresh('modules');
  const output = JSON.parse(execFileSync(process.execPath, [cli, 'status', run], { encoding: 'utf8' }));
  assert.equal(output.next, 'publish');
  assert.throws(() => execFileSync(process.execPath, [cli, 'publish', fresh(), path.join(base, 'cli-incomplete')], { stdio: 'pipe' }), error => error.status === 1 && error.stderr.toString().includes('stage incomplete'));
});

console.log('Synthetic verification artifacts retained at ' + base);
