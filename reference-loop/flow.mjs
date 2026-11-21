import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { pathToFileURL } from 'node:url';

// A manually invoked artifact handoff. No network, model execution or scheduler.
const MAX_BYTES = 8 * 1024 * 1024;
const HASH = /^[a-f0-9]{64}$/;
const ID = /^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/;
export const hash = value => createHash('sha256').update(value).digest('hex');
const fail = message => { throw new Error(message); };
const requireThat = (ok, message) => { if (!ok) fail(message); };
const text = (value, label) => requireThat(typeof value === 'string' && value.trim().length > 0, `${label}: text required`);
const list = (value, label, min = 1) => requireThat(Array.isArray(value) && value.length >= min, `${label}: array with at least ${min} item(s) required`);
const choice = (value, allowed, label) => requireThat(allowed.includes(value), `${label}: expected ${allowed.join(', ')}`);
const identified = (value, label) => requireThat(typeof value === 'string' && ID.test(value), `${label}: invalid ID`);
const unique = (values, label) => requireThat(new Set(values).size === values.length, `${label}: duplicate ID`);
const strings = (value, label, min = 1) => { list(value, label, min); value.forEach(v => text(v, label)); };
const findId = (items, id, label) => items.find(item => item.id === id) || fail(`${label}: unknown ID ${id}`);
const stable = value => Array.isArray(value) ? value.map(stable) : value && typeof value === 'object'
  ? Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])])) : value;
export const encode = value => JSON.stringify(stable(value), null, 2) + '\n';
export function readJSON(file) {
  requireThat(fs.statSync(file).size <= MAX_BYTES, `${file}: exceeds 8 MiB`);
  return JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
}
function safeRelative(value) {
  text(value, 'relative file');
  requireThat(!/[\\:<>"|?*\x00-\x1f]/.test(value) && !value.startsWith('/') &&
    value.split('/').every(p => p && p !== '.' && p !== '..' && !/[. ]$/.test(p) &&
      !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(p)), 'unsafe relative file');
  return value;
}
function within(root, file) {
  const relative = path.relative(root, file);
  return relative && !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
}
function selectedFile(root, relative) {
  safeRelative(relative);
  const resolvedRoot = fs.realpathSync(root);
  let current = resolvedRoot;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    requireThat(!fs.lstatSync(current).isSymbolicLink(), 'symlink/junction selection is unsupported');
  }
  const resolved = fs.realpathSync(current);
  requireThat(within(resolvedRoot, resolved) && fs.statSync(resolved).isFile(), 'file escapes selected root');
  return resolved;
}
// Commit complete bytes with an exclusive hard link. A crash leaves only a small
// staged file; readers never treat that file as a completed stage. Existing records
// are immutable; exact repeats return the same record. Local filesystems only.
export function commit(file, value) {
  const bytes = Buffer.from(encode(value));
  requireThat(bytes.length <= MAX_BYTES, 'record exceeds 8 MiB');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    requireThat(fs.readFileSync(file).equals(bytes), `immutable record conflict: ${file}`);
    return file;
  }
  const staging = path.join(path.dirname(file), '.staging');
  fs.mkdirSync(staging, { recursive: true });
  const temp = path.join(staging, randomUUID() + '.json');
  const fd = fs.openSync(temp, 'wx');
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  try { fs.linkSync(temp, file); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    requireThat(fs.readFileSync(file).equals(bytes), `immutable record conflict: ${file}`);
  }
  return file;
}
export function validateRequest(request) {
  requireThat(request.schema_version === 1, 'request schema_version must be 1');
  ['task_id', 'attempt_id'].forEach(key => identified(request[key], key));
  requireThat(Number.isInteger(request.request_revision) && request.request_revision > 0, 'request revision must be positive');
  ['owner', 'question', 'target_runtime', 'source_policy', 'stop_condition'].forEach(key => text(request[key], key));
  strings(request.contributor_platforms, 'contributor_platforms');
  list(request.requirements, 'requirements');
  for (const item of request.requirements) { identified(item.id, 'requirement'); text(item.text, 'requirement text'); }
  unique(request.requirements.map(r => r.id), 'requirements');
  for (const key of ['max_candidates', 'max_selected_files'])
    requireThat(Number.isInteger(request.budget?.[key]) && request.budget[key] > 0, `budget.${key}: positive integer required`);
  return request;
}
function matches(request, record) {
  for (const key of ['task_id', 'request_revision', 'attempt_id'])
    requireThat(record[key] === request[key], `${key}: stale or foreign result`);
}
function validateAcquisitions(request, record) {
  matches(request, record);
  list(record.candidates, 'candidates', 0);
  requireThat(record.candidates.length <= request.budget.max_candidates, 'candidate budget exceeded');
  unique(record.candidates.map(c => c.id), 'candidates');
  for (const c of record.candidates) {
    identified(c.id, 'candidate'); text(c.title, 'title'); text(c.revision, 'source revision');
    requireThat(/^https?:\/\//.test(c.url), 'candidate requires original HTTP(S) URL');
    list(c.discovery_path, 'discovery_path');
    c.discovery_path.forEach(step => { text(step.locator, 'discovery locator'); text(step.relation, 'discovery relation'); });
    list(c.observations, 'observations'); unique(c.observations.map(o => o.id), 'observations');
    for (const o of c.observations) {
      identified(o.id, 'observation'); text(o.capability, 'capability'); text(o.method, 'method');
      choice(o.status, ['ok', 'partial', 'failed', 'not_attempted'], 'observation status');
      text(o.coverage, 'coverage'); text(o.locator, 'evidence locator');
      requireThat(typeof o.observed_at === 'string' && Number.isFinite(Date.parse(o.observed_at)), 'observed_at: timestamp required');
      text(o.summary, 'observation summary');
    }
  }
  list(record.frontier, 'frontier', 0);
  record.frontier.forEach(f => { text(f.locator, 'frontier locator'); choice(f.lane, ['video', 'direct', 'links'], 'frontier lane'); text(f.reason, 'frontier reason'); });
}
function validateReview(request, acquisitions, review) {
  matches(request, review); text(review.reviewer, 'reviewer'); list(review.decisions, 'decisions');
  unique(review.decisions.map(d => d.candidate_id), 'decisions');
  for (const d of review.decisions) {
    const c = findId(acquisitions.candidates, d.candidate_id, 'candidate');
    choice(d.decision, ['select', 'reject', 'defer'], 'decision');
    strings(d.requirement_ids, 'requirement IDs');
    d.requirement_ids.forEach(id => findId(request.requirements, id, 'requirement'));
    strings(d.evidence_ids, 'evidence IDs');
    const observations = d.evidence_ids.map(id => findId(c.observations, id, 'observation'));
    if (d.decision === 'select') requireThat(observations.some(o => ['ok', 'partial'].includes(o.status)), 'selected candidate needs acquired evidence');
    ['rationale', 'source_quality', 'engineering_quality', 'task_fit'].forEach(key => text(d[key], key));
    strings(d.limits, 'review limits', 0);
  }
}
function validatePrepared(request, acquisitions, review, prepared) {
  matches(request, prepared); list(prepared.files, 'prepared files');
  requireThat(prepared.files.length <= request.budget.max_selected_files, 'selected file budget exceeded');
  unique(prepared.files.map(f => `${f.candidate_id}/${f.path}`.toLowerCase()), 'portable file paths');
  for (const f of prepared.files) {
    const c = findId(acquisitions.candidates, f.candidate_id, 'candidate');
    requireThat(review.decisions.some(d => d.candidate_id === c.id && d.decision === 'select'), 'cannot prepare unselected candidate');
    safeRelative(f.path); requireThat(f.revision === c.revision, 'prepared source revision mismatch');
    choice(f.role, ['implementation', 'interface', 'manifest', 'documentation', 'license', 'test'], 'file role');
    requireThat(HASH.test(f.sha256) && typeof f.content_base64 === 'string', 'invalid prepared content');
    const bytes = Buffer.from(f.content_base64, 'base64');
    requireThat(bytes.toString('base64') === f.content_base64 && bytes.length === f.bytes && hash(bytes) === f.sha256, 'prepared bytes/hash mismatch');
  }
  for (const id of new Set(prepared.files.map(f => f.candidate_id)))
    requireThat(prepared.files.some(f => f.candidate_id === id && f.role === 'license'), 'selected reference needs retained license/source terms');
}
function validateModules(request, review, prepared, modules) {
  matches(request, modules); list(modules.modules, 'modules'); unique(modules.modules.map(m => m.id), 'modules');
  for (const m of modules.modules) {
    identified(m.id, 'module'); text(m.name, 'module name'); strings(m.categories, 'categories');
    const decision = review.decisions.find(d => d.candidate_id === m.candidate_id && d.decision === 'select');
    requireThat(decision, 'module candidate is not selected'); strings(m.requirement_ids, 'module requirements');
    m.requirement_ids.forEach(id => requireThat(decision.requirement_ids.includes(id), 'module requirement was not reviewed'));
    list(m.anchors, 'anchors');
    m.anchors.forEach(a => { requireThat(prepared.files.some(f => f.candidate_id === m.candidate_id && f.path === a.path), 'module anchor is not prepared'); text(a.symbol, 'anchor symbol'); });
    choice(m.reuse_mode, ['existing_tool', 'dependency', 'adapter', 'selective_extraction', 'architecture_reference'], 'reuse_mode');
    ['input', 'output', 'errors', 'integration'].forEach(k => text(m[k], `module ${k}`));
    strings(m.dependencies, 'dependencies', 0); strings(m.unknowns, 'unknowns', 0);
    choice(m.validation?.level, ['source_reviewed', 'connected', 'target_accepted'], 'validation level');
    text(m.validation?.evidence, 'validation evidence'); text(m.validation?.runtime, 'validation runtime');
  }
}
const stageNames = ['acquisitions', 'review', 'prepared', 'modules'];
export function loadRun(run) {
  const result = { request: validateRequest(readJSON(path.join(run, 'request.json'))) };
  for (const name of stageNames) if (fs.existsSync(path.join(run, name + '.json'))) result[name] = readJSON(path.join(run, name + '.json'));
  validateStages(result); return result;
}
function validateStages(r, complete = false) {
  validateRequest(r.request);
  if (r.acquisitions) validateAcquisitions(r.request, r.acquisitions);
  if (r.review) { requireThat(r.acquisitions, 'acquisitions missing'); validateReview(r.request, r.acquisitions, r.review); }
  if (r.prepared) { requireThat(r.review, 'review missing'); validatePrepared(r.request, r.acquisitions, r.review, r.prepared); }
  if (r.modules) { requireThat(r.prepared, 'prepared files missing'); validateModules(r.request, r.review, r.prepared, r.modules); }
  if (complete) stageNames.forEach(s => requireThat(r[s], `${s}: stage incomplete`));
}
export function init(run, request) {
  validateRequest(request); commit(path.join(run, 'request.json'), request); return status(run);
}
export function record(run, stage, value) {
  choice(stage, ['acquisitions', 'review', 'modules'], 'record stage');
  const r = loadRun(run); r[stage] = value; validateStages(r);
  commit(path.join(run, stage + '.json'), value); return status(run);
}
export function prepare(run, selection, roots) {
  const r = loadRun(run); requireThat(r.review, 'review missing'); matches(r.request, selection);
  list(selection.files, 'selection files');
  requireThat(selection.files.length <= r.request.budget.max_selected_files, 'selected file budget exceeded');
  let total = 0;
  const files = selection.files.map(f => {
    const c = findId(r.acquisitions.candidates, f.candidate_id, 'candidate');
    identified(f.root, 'root alias'); requireThat(typeof roots[f.root] === 'string', 'missing local root mapping');
    const file = selectedFile(roots[f.root], f.path);
    total += fs.statSync(file).size; requireThat(total <= MAX_BYTES / 2, 'selected files exceed 4 MiB');
    const bytes = fs.readFileSync(file); requireThat(hash(bytes) === f.expected_sha256, `source changed: ${f.path}`);
    return { candidate_id: c.id, revision: c.revision, path: f.path, role: f.role, sha256: hash(bytes), bytes: bytes.length, content_base64: bytes.toString('base64') };
  });
  const value = { task_id: r.request.task_id, request_revision: r.request.request_revision, attempt_id: r.request.attempt_id, files };
  validatePrepared(r.request, r.acquisitions, r.review, value);
  commit(path.join(run, 'prepared.json'), value); return status(run);
}
export function publish(run, library) {
  const r = loadRun(run); validateStages(r, true);
  const bundle = { format: 'reference-loop/1', ...r };
  const id = hash(encode(bundle));
  commit(path.join(library, 'entries', id + '.json'), bundle);
  return { id, file: path.join(library, 'entries', id + '.json'), state: 'published', adoption: 'not_implied' };
}
export function verify(file) {
  const bundle = readJSON(file); requireThat(bundle.format === 'reference-loop/1', 'unsupported bundle format');
  validateStages(bundle, true);
  const id = hash(encode(bundle));
  requireThat(path.basename(file) === id + '.json', 'bundle identity mismatch; content or filename changed');
  return { id, bundle };
}
export function query(library, term = '') {
  const dir = path.join(library, 'entries');
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const file of fs.readdirSync(dir).filter(f => HASH.test(f.slice(0, -5)) && f.endsWith('.json'))) {
    const { id, bundle } = verify(path.join(dir, file));
    const feedbackDir = path.join(library, 'feedback', id);
    const receipts = fs.existsSync(feedbackDir) ? fs.readdirSync(feedbackDir)
      .filter(f => f.endsWith('.json')).map(f => readJSON(path.join(feedbackDir, f))) : [];
    receipts.forEach(receipt => validateFeedback(bundle, receipt, id));
    for (const m of bundle.modules.modules) {
      if (!JSON.stringify([m.name, m.categories, m.requirement_ids, bundle.request.question]).toLowerCase().includes(term.toLowerCase())) continue;
      results.push({ entry_id: id, module_id: m.id, name: m.name, categories: m.categories, requirement_ids: m.requirement_ids, reuse_mode: m.reuse_mode, validation: m.validation, unknowns: m.unknowns,
        feedback: receipts.filter(r => r.module_ids.includes(m.id)).map(r => ({ id: r.id, consumer: r.consumer, disposition: r.disposition, runtime: r.runtime, reason: r.reason, remaining_gaps: r.remaining_gaps })) });
    }
  }
  return results;
}
function validateFeedback(bundle, value, entryId) {
  requireThat(value.entry_id === entryId, 'feedback entry mismatch');
  matches(bundle.request, value); identified(value.id, 'feedback ID'); text(value.consumer, 'consumer');
  choice(value.disposition, ['adopt', 'adapt', 'reject', 'defer'], 'feedback disposition');
  strings(value.module_ids, 'feedback module IDs'); value.module_ids.forEach(id => findId(bundle.modules.modules, id, 'module'));
  ['reason', 'evidence', 'runtime'].forEach(key => text(value[key], `feedback ${key}`));
  strings(value.remaining_gaps, 'remaining gaps', 0);
}
export function feedback(library, value) {
  requireThat(HASH.test(value.entry_id), 'invalid entry ID');
  const { bundle } = verify(path.join(library, 'entries', value.entry_id + '.json'));
  validateFeedback(bundle, value, value.entry_id);
  commit(path.join(library, 'feedback', value.entry_id, value.id + '.json'), value);
  return { state: 'feedback_recorded', disposition: value.disposition, remaining_gaps: value.remaining_gaps };
}
export function status(run) {
  const r = loadRun(run);
  const complete = ['request', ...stageNames].filter(s => r[s]);
  return { task_id: r.request.task_id, request_revision: r.request.request_revision, attempt_id: r.request.attempt_id, complete, next: stageNames.find(s => !r[s]) || 'publish', candidates: r.acquisitions?.candidates.length || 0, selected: r.review?.decisions.filter(d => d.decision === 'select').length || 0, frontier: r.acquisitions?.frontier || [] };
}
const usage = `reference-loop 0.1 (Node >=22, local filesystem, manual invocation)
  init RUN REQUEST.json
  record RUN acquisitions|review|modules INPUT.json
  prepare RUN SELECTION.json ROOTS.local.json
  status RUN
  publish RUN LIBRARY
  query LIBRARY [TERM]
  inspect LIBRARY ENTRY_ID
  verify BUNDLE.json
  feedback LIBRARY RECEIPT.json
No code from references is executed. Copy the immutable published JSON to another
device and run verify there; this does not start a remote agent or accept a product.`;
export function main(args) {
  const [command, a, b, c] = args;
  const arities = { init: 3, record: 4, prepare: 4, status: 2, publish: 3, query: [2, 3], inspect: 3, verify: 2, feedback: 3 };
  if (!command || command === '--help') return usage;
  requireThat(command in arities && [arities[command]].flat().includes(args.length), usage);
  if (command === 'init') return init(a, readJSON(b));
  if (command === 'record') return record(a, b, readJSON(c));
  if (command === 'prepare') return prepare(a, readJSON(b), readJSON(c));
  if (command === 'status') return status(a);
  if (command === 'publish') return publish(a, b);
  if (command === 'query') return query(a, b);
  if (command === 'verify') { const result = verify(a); return { id: result.id, task_id: result.bundle.request.task_id, files: result.bundle.prepared.files.length, integrity: 'passed', authenticity: 'not_established_by_hash' }; }
  if (command === 'feedback') return feedback(a, readJSON(b));
  if (command === 'inspect') {
    requireThat(HASH.test(b), 'invalid entry ID');
    const { bundle } = verify(path.join(a, 'entries', b + '.json'));
    return { ...bundle, prepared: { ...bundle.prepared, files: bundle.prepared.files.map(({ content_base64, ...f }) => f) } };
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try { const result = main(process.argv.slice(2)); process.stdout.write(typeof result === 'string' ? result + '\n' : encode(result)); }
  catch (error) { process.stderr.write(error.message + '\n'); process.exitCode = 1; }
}
