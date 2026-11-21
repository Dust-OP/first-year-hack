import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { isDeepStrictEqual } from 'node:util';

// A shared, local evidence workbench. The calling agent owns judgment and execution.
// No scheduler, model call, global configuration, candidate-code execution or hashes.
const here = path.dirname(fileURLToPath(import.meta.url));
const [command, rawDirectory, ...args] = process.argv.slice(2);
// One shared library so "search saved results first" can find earlier work on any task.
const library = path.resolve(process.env.REFERENCE_LIBRARY || path.join(here, '..', '..', 'reference-library'));
const directory = rawDirectory === 'library' ? library
  : rawDirectory?.startsWith('library/') ? path.join(library, rawDirectory.slice('library/'.length)) : rawDirectory;
const help = `Usage:
  node loop.mjs start TASK_DIRECTORY "problem and desired result"
  node loop.mjs collect TASK_DIRECTORY github ISSUE_URL
  node loop.mjs collect TASK_DIRECTORY bilibili BV_ID
  node loop.mjs note TASK_DIRECTORY SOURCE_URL_OR_PATH "what it shows" [EXCERPT_FILE]
  node loop.mjs import TASK_DIRECTORY SAVED_COLLECTOR_JSON
  node loop.mjs search TASK_OR_LIBRARY_DIRECTORY "words" [LIMIT=5]
TASK_DIRECTORY may be library/<name> and the search directory may be library,
meaning ${library} (override with REFERENCE_LIBRARY).
  node loop.mjs read TASK_DIRECTORY EVIDENCE_ID [TEXT_FILTER]
  node loop.mjs resume TASK_DIRECTORY
The agent writes RESULT.md for decisions, module mapping, actual trials and the next gap.
Raw collection is evidence, not an accepted solution. Existing observations are reused.`;
const die = text => { throw new Error(text); };
const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const print = value => console.log(JSON.stringify(value, null, 2));
function taskRoot(dir) {
  const root = path.resolve(dir);
  if (!fs.existsSync(path.join(root, 'TASK.md'))) die('No TASK.md here. Start a task, or choose its existing directory.');
  return root;
}
function validateObservation(record) {
  const invalid = message => die(`Invalid observation: ${message}`);
  const object = (value, label) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(`${label} must be an object.`);
  };
  const text = (value, label, required = false) => {
    if (value == null && !required) return;
    if (typeof value !== 'string' || (required && !value.trim())) invalid(`${label} must be ${required ? 'a non-empty' : 'a'} string.`);
  };
  const identifier = (value, label) => {
    if (!(typeof value === 'string' && value.trim()) && !(typeof value === 'number' && Number.isFinite(value))) invalid(`${label} must be a string or finite number.`);
  };
  const row = (value, label) => {
    object(value, label);
    identifier(value.id, `${label}.id`);
    for (const key of ['body', 'text', 'url']) text(value[key], `${label}.${key}`);
    if (value.parent_id != null) identifier(value.parent_id, `${label}.parent_id`);
  };
  object(record, 'record');
  object(record.source, 'source');
  text(record.source.url, 'source.url', true);
  for (const key of ['title', 'body', 'description']) text(record.source[key], `source.${key}`);
  text(record.observed_at, 'observed_at', true);
  text(record.status, 'status');
  object(record.coverage, 'coverage');
  if (!Array.isArray(record.comments)) invalid('comments must be an array.');
  record.comments.forEach((comment, index) => {
    const label = `comments[${index}]`;
    row(comment, label);
    if (comment.embedded_replies != null) {
      if (!Array.isArray(comment.embedded_replies)) invalid(`${label}.embedded_replies must be an array.`);
      comment.embedded_replies.forEach((reply, replyIndex) => row(reply, `${label}.embedded_replies[${replyIndex}]`));
    }
  });
  if (record.leads != null) {
    if (!Array.isArray(record.leads)) invalid('leads must be an array.');
    record.leads.forEach((lead, index) => text(lead, `leads[${index}]`, true));
  }
}
function evidence(root) {
  const folder = path.join(root, 'evidence'), entries = [], warnings = [];
  if (!fs.existsSync(folder)) return { entries, warnings };
  for (const name of fs.readdirSync(folder).filter(name => name.endsWith('.json')).sort()) {
    const file = path.join(folder, name), id = name.slice(0, -5);
    try {
      const record = json(file);
      validateObservation(record);
      entries.push({ id, file, record });
    } catch (error) {
      warnings.push({ id, file, error: error.message });
    }
  }
  return { entries, warnings };
}
function contextRows(record) {
  const source = record.source;
  const rows = [{ id: 'source', url: source.url, parent_id: null, text: [source.title, source.body, source.description].filter(Boolean).join('\n') }];
  for (const c of record.comments) {
    rows.push({ id: c.id, url: c.url || source.url, parent_id: c.parent_id || null, text: c.body || c.text || '' });
    for (const reply of c.embedded_replies || []) rows.push({ id: reply.id, url: source.url, parent_id: c.id, text: reply.text || reply.body || '' });
  }
  return rows;
}
function route(url) {
  const parsed = new URL(url), host = parsed.hostname.toLowerCase();
  if (host === 'bilibili.com' || host.endsWith('.bilibili.com') || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') return 'video';
  if (['github.com', 'gitlab.com', 'codeberg.org', 'huggingface.co', 'www.npmjs.com', 'pypi.org'].includes(host)) return 'direct';
  return 'linked';
}
function frontier(observations) {
  const leads = new Map();
  const observed = new Set(observations.map(({record}) => record.source.url.replace(/\/$/, '')));
  for (const entry of observations) for (const raw of entry.record.leads || []) {
    let url;
    try { const u = new URL(raw); if (!['https:', 'http:'].includes(u.protocol)) continue; url = u.href; } catch { continue; }
    const key = url.replace(/\/$/, '');
    if (!leads.has(key)) leads.set(key, { url, lane: route(url), already_collected: observed.has(key), discovered_from: [] });
    // Preserve every discovery path; normalize a URL, never a judgment about it.
    const namedRepo = url.startsWith('https://github.com/') ? url.slice('https://github.com/'.length) : null;
    const matching = contextRows(entry.record).filter(row => row.text.includes(raw) || (namedRepo && row.text.includes(namedRepo)));
    const origins = matching.length ? matching : [{id:'unlocated', url:entry.record.source.url}];
    for (const row of origins) leads.get(key).discovered_from.push({ evidence_id: entry.id, source: entry.record.source.url, context_id: row.id, context_url: row.url, excerpt: row.text?.slice(0, 240) || null });
  }
  return [...leads.values()];
}
function save(root, record) {
  validateObservation(record);
  // Compare the JSON actually retained; object key order is not an observation change.
  record = JSON.parse(JSON.stringify(record));
  const { entries, warnings } = evidence(root);
  const previous = entries.filter(e => e.record.source.url === record.source.url && e.record.observed_at === record.observed_at);
  const conflict = previous.find(e => !isDeepStrictEqual(e.record, record));
  if (conflict) die(`Observation conflict with ${conflict.file}: the same source.url and observed_at have different content. Existing evidence was preserved; reconcile the saved input without changing its observation time to bypass this check.`);
  const scan = { warnings, evidence_scan_incomplete: warnings.length > 0 };
  if (previous.length) return { id: previous[0].id, file: previous[0].file, reused: true, ...scan };
  fs.mkdirSync(path.join(root, 'evidence'), { recursive: true });
  const id = 'E-' + randomUUID().slice(0, 8), file = path.join(root, 'evidence', id + '.json');
  fs.writeFileSync(file, JSON.stringify(record, null, 2) + '\n', { flag: 'wx' });
  return { id, file, reused: false, ...scan };
}
function tasks(root) {
  // Explicit local library only: one task or immediate child tasks. No home scan.
  if (fs.existsSync(path.join(root, 'TASK.md'))) return [root];
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes:true }).filter(e => e.isDirectory() && fs.existsSync(path.join(root, e.name, 'TASK.md'))).map(e => path.join(root, e.name));
}
try {
  if (!directory || !['start', 'collect', 'note', 'import', 'search', 'read', 'resume'].includes(command)) die(help);
  const root = path.resolve(directory);
  if (command === 'start') {
    if (!args[0]?.trim()) die('Give the concrete problem and useful outcome.');
    fs.mkdirSync(root, { recursive:true });
    fs.writeFileSync(path.join(root, 'TASK.md'), `# Resource task\n\n${args[0].trim()}\n\nCreated: ${new Date().toISOString()}\n\nThe active coding agent owns this task. Add relevant project constraints, the chosen\nproduct runtime, and a practical stopping condition when known. Keep the current\nnext action here or in RESULT.md; do not infer progress from collected file counts.\n`, {flag:'wx'});
    print({ task:root, next:'Search reusable local results; collect or import only evidence needed for this problem.' });
  } else if (command === 'note') {
    // Any source the agent actually read: code file, spec, docs page, forum post, live response.
    taskRoot(root);
    const [source, summary, excerptFile] = args;
    if (!source || !summary?.trim()) die(help);
    const rawExcerptPath = excerptFile ? path.resolve(excerptFile) : null;
    const rawExcerpt = rawExcerptPath ? fs.readFileSync(rawExcerptPath, 'utf8') : '';
    const excerpt = rawExcerpt.slice(0, 200000);
    const leads = [...new Set((summary + '\n' + excerpt).match(/https?:\/\/[^\s)>\]"'`]+/g) || [])].filter(u => u !== source);
    const record = { status: 'noted', observed_at: new Date().toISOString(),
      source: { url: source, title: summary.trim().split('\n')[0].slice(0, 160), body: summary.trim(), description: excerpt || undefined },
      comments: [], leads,
      coverage: { kind: 'agent note', original_excerpt_chars: rawExcerpt.length, excerpt_chars: excerpt.length, truncated: excerpt.length < rawExcerpt.length, raw_excerpt_path: rawExcerptPath, excludes: ['Anything the agent did not quote or summarise', ...(excerpt.length < rawExcerpt.length ? ['Excerpt text beyond the first 200000 characters; inspect the raw input file'] : [])] } };
    print({ ...save(root, record), coverage: record.coverage, next: 'Noted. Searchable later; still evidence, not a decision.' });
  } else if (command === 'import') {
    taskRoot(root); if (!args[0]) die(help);
    print(save(root, json(path.resolve(args[0]))));
  } else if (command === 'collect') {
    taskRoot(root);
    const [kind, input] = args;
    if (!['github', 'bilibili'].includes(kind) || !input) die(help);
    fs.mkdirSync(path.join(root, 'evidence'), {recursive:true});
    const id = 'E-' + randomUUID().slice(0, 8), output = path.join(root, 'evidence', id + '.json');
    const result = spawnSync(process.execPath, [path.join(here, 'collect.mjs'), kind, input, output], { encoding:'utf8', timeout:140000, windowsHide:true, shell:false, maxBuffer:8*1024*1024 });
    if (!fs.existsSync(output)) die(result.stderr?.trim() || result.error?.message || 'Collector returned no observation.');
    const record = json(output);
    validateObservation(record);
    print({ id, file:output, status:record.status, coverage:record.coverage, errors:record.errors, next:`Read ${id}; choose useful leads from resume output. Collection does not accept a claim.` });
    process.exitCode = result.status === 0 ? 0 : 2;
  } else if (command === 'read') {
    taskRoot(root);
    const { entries, warnings } = evidence(root), entry = entries.find(e => e.id === args[0]);
    const scan = { warnings, evidence_scan_incomplete: warnings.length > 0 };
    if (!entry) {
      const damaged = warnings.find(warning => warning.id === args[0]);
      print({ id: args[0], error: damaged ? `Cannot read invalid evidence: ${damaged.file}` : 'Evidence ID not found; use resume to list saved records.', ...scan });
      process.exitCode = 1;
    } else if (!args[1]) print({id:entry.id, source:entry.record.source, status:entry.record.status, observed_at:entry.record.observed_at, coverage:entry.record.coverage, leads:entry.record.leads || [], contexts:contextRows(entry.record), ...scan});
    else {
      const rows = contextRows(entry.record), term = args[1].toLowerCase();
      const hits = rows.filter(row => row.text.toLowerCase().includes(term));
      const ids = new Set(hits.flatMap(row => [row.id, row.parent_id]).filter(Boolean));
      print({id:entry.id, source:entry.record.source, coverage:entry.record.coverage, filter:args[1], filtered:true, contexts:rows.filter(row => ids.has(row.id)), excluded:'Other thread text; read without a filter before resolving conflicting claims.', ...scan});
    }
  } else if (command === 'search') {
    const terms = (args[0] || '').toLowerCase().split(/\s+/).filter(Boolean), limit = Number(args[1] || 5);
    if (!terms.length || !Number.isInteger(limit) || limit < 1 || limit > 20) die(help);
    const results = [], warnings = [];
    for (const task of tasks(root)) {
      const found = evidence(task);
      warnings.push(...found.warnings);
      for (const entry of found.entries) {
        const rows = contextRows(entry.record), text = rows.map(r => r.text).join('\n').toLowerCase();
        const score = terms.filter(t => text.includes(t)).length;
        if (!score) continue;
        const matching = rows.filter(r => terms.some(t => r.text.toLowerCase().includes(t)));
        results.push({type:'raw_evidence', task, id:entry.id, score, title:entry.record.source.title, url:entry.record.source.url, observed_at:entry.record.observed_at, coverage:entry.record.coverage, matching_contexts:matching.slice(0,3).map(r => ({...r,text:r.text.slice(0,500)})), excerpted:true});
      }
      for (const [name, type] of [['RESULT.md', 'agent_result'], ['TASK.md', 'task_brief']]) {
        const resultFile = path.join(task, name);
        if (!fs.existsSync(resultFile)) continue;
        const body = fs.readFileSync(resultFile, 'utf8'), lower = body.toLowerCase(), score = terms.filter(t => lower.includes(t)).length;
        if (score) results.push({type,task,file:resultFile,score,excerpt:body.split('\n').filter(line => terms.some(t => line.toLowerCase().includes(t))).slice(0,8).join('\n').slice(0,1800),excerpted:true});
      }
    }
    const typeOrder = { agent_result: 0, raw_evidence: 1, task_brief: 2 };
    results.sort((a,b)=>b.score-a.score || typeOrder[a.type]-typeOrder[b.type] || a.task.localeCompare(b.task));
    print({query:args[0],scope:root,matching_records:results.length,results:results.slice(0,limit),limit,warnings,evidence_scan_incomplete:warnings.length > 0,note:'Local lexical retrieval, not semantic ranking or a quality score. Equal-score results prefer saved decisions. Read full context and task fit before reuse.'});
  } else {
    taskRoot(root);
    const { entries, warnings } = evidence(root), resultFile = path.join(root, 'RESULT.md');
    print({task:root,brief:fs.readFileSync(path.join(root,'TASK.md'),'utf8'),result:fs.existsSync(resultFile)?fs.readFileSync(resultFile,'utf8'):null,evidence:entries.map(e=>({id:e.id,title:e.record.source.title,url:e.record.source.url,status:e.record.status,coverage:e.record.coverage})),candidate_leads:frontier(entries),warnings,evidence_scan_incomplete:warnings.length > 0,next:'The calling agent reads RESULT.md, selects unresolved work, and continues. Leads are unreviewed; nothing is fetched or executed automatically.'});
  }
} catch (error) { console.error(error.message); process.exitCode=1; }
