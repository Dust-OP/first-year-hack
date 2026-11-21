// Run one worker per persistent directory. The web app can run on a separate host.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { createHash, createCipheriv, createDecipheriv, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';
import { chromium } from 'playwright-core';
import { connectionTarget } from './lib/connection-client.mjs';
import { invite } from './lib/connection-browser.mjs';

process.umask(0o077);
const dir = process.env.CONNECTION_DATA_DIR || '';
const key = Buffer.from(process.env.CONNECTION_SESSION_KEY || '', 'base64');
if (!isAbsolute(dir) || key.length !== 32) throw new Error('Set CONNECTION_DATA_DIR and a 32-byte base64 CONNECTION_SESSION_KEY.');
mkdirSync(dir, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(join(dir, 'connections.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
  CREATE TABLE IF NOT EXISTS accounts(owner TEXT PRIMARY KEY, session BLOB, pairing TEXT UNIQUE, expires INTEGER);
  CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, owner TEXT NOT NULL, target TEXT NOT NULL,
    status TEXT NOT NULL, created INTEGER NOT NULL, UNIQUE(owner,target));`);
const hash = (value) => createHash('sha256').update(value).digest();
const browserOptions = { chromiumSandbox: true, executablePath: process.env.CONNECTION_CHROME || undefined };
function seal(owner, state) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(Buffer.from(owner));
  const data = Buffer.concat([cipher.update(JSON.stringify(state), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]);
}
function unseal(owner, bytes) {
  const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
  decipher.setAAD(Buffer.from(owner));
  decipher.setAuthTag(bytes.subarray(12, 28));
  return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]));
}

let active = null;
async function processNext() {
  if (active) return;
  const job = db.prepare("SELECT * FROM jobs WHERE status='queued' ORDER BY created LIMIT 1").get();
  if (!job) return;
  db.prepare("UPDATE jobs SET status='running' WHERE id=?").run(job.id);
  const run = active = { owner: job.owner, cancelled: false };
  let status = 'failed';
  try {
    const session = db.prepare('SELECT session FROM accounts WHERE owner=?').get(job.owner)?.session;
    if (!session) { status = 'verification_required'; return; }
    const storageState = unseal(job.owner, session);
    run.browser = await chromium.launch(browserOptions);
    if (run.cancelled) return;
    const context = await run.browser.newContext({ storageState, locale: 'en-US' });
    const page = await context.newPage();
    page.setDefaultTimeout(7000);
    status = await invite(page, job.target);
  } finally {
    await run.browser?.close().catch(() => {});
    db.prepare('UPDATE jobs SET status=? WHERE id=?').run(status, job.id);
    active = null;
  }
}

function command(op, { owner, profileUrl, jobId }) {
  if (typeof owner !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(owner)) return [400, { error: 'Invalid account.' }];
  if (op === '/pair') {
    const code = randomBytes(12).toString('base64url');
    db.prepare(`INSERT INTO accounts(owner,pairing,expires) VALUES(?,?,?) ON CONFLICT(owner)
      DO UPDATE SET pairing=excluded.pairing, expires=excluded.expires`).run(owner, hash(code).toString('hex'), Date.now() + 600000);
    return [200, { code }];
  }
  if (op === '/disconnect') {
    db.prepare('DELETE FROM accounts WHERE owner=?').run(owner);
    db.prepare('DELETE FROM jobs WHERE owner=?').run(owner);
    if (active?.owner === owner) { active.cancelled = true; active.browser?.close().catch(() => {}); }
    return [200, { disconnected: true }];
  }
  if (op === '/status') {
    const job = db.prepare('SELECT id AS jobId,status FROM jobs WHERE owner=? AND id=?').get(owner, String(jobId));
    return job ? [200, job] : [404, { error: 'Job not found.' }];
  }
  if (op !== '/submit') return [404, { error: 'Unknown operation.' }];
  const target = connectionTarget(profileUrl);
  if (!target) return [400, { error: 'Invalid profile.' }];
  if (!db.prepare('SELECT 1 FROM accounts WHERE owner=? AND session IS NOT NULL').get(owner)) return [200, { status: 'verification_required' }];
  const previous = db.prepare('SELECT id AS jobId,status FROM jobs WHERE owner=? AND target=?').get(owner, target);
  if (previous && !['verification_required','failed'].includes(previous.status)) return [200, previous];
  const id = previous?.jobId || randomUUID();
  db.prepare(`INSERT INTO jobs VALUES(?,?,?,'queued',?) ON CONFLICT(owner,target)
    DO UPDATE SET status='queued',created=excluded.created`).run(id, owner, target, Date.now());
  return [202, { jobId: id, status: 'queued' }];
}

async function serve() {
  const token = process.env.CONNECTION_WORKER_TOKEN || '';
  if (token.length < 32) throw new Error('Set a random CONNECTION_WORKER_TOKEN of at least 32 characters.');
  const server = createServer(async (req, res) => {
    const reply = (code, data) => res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify(data));
    const enrolling = req.url === '/enroll';
    if (req.method !== 'POST' || (!enrolling && !timingSafeEqual(hash(req.headers.authorization || ''), hash('Bearer ' + token)))) return reply(403, { error: 'Forbidden.' });
    try {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > (enrolling ? 131072 : 4096)) return reply(413, { error: 'Body too large.' });
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString());
      if (enrolling) {
        const pairing = hash(String(body.code)).toString('hex');
        const account = db.prepare('SELECT owner FROM accounts WHERE pairing=? AND expires>?').get(pairing, Date.now());
        if (!account) return reply(403, { error: 'Pairing code expired or incorrect.' });
        const cookies = body.cookies.filter(c => ['.linkedin.com','www.linkedin.com','linkedin.com'].includes(c.domain));
        if (!cookies.some(c => c.name === 'li_at' && c.value)) return reply(400, { error: 'Sign-in incomplete.' });
        const session = seal(account.owner, { cookies, origins: [] });
        db.prepare('UPDATE accounts SET session=?, pairing=NULL WHERE owner=?').run(session, account.owner);
        return reply(200, { linked: true });
      }
      reply(...command(req.url, body));
    } catch { reply(400, { error: 'Invalid worker request.' }); }
  });
  server.listen(Number(process.env.CONNECTION_PORT || 3310), '127.0.0.1', () => {
    // A killed worker may already have clicked Send. Never replay an interrupted job.
    db.exec("UPDATE jobs SET status='outcome_unknown' WHERE status='running'");
    setInterval(() => processNext().catch(() => console.error('Connection job failed.')), 500);
    console.log('Connection worker listening on loopback.');
  });
}
await serve();
