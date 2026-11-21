// server.mjs itself, run as a real process on a spare port with the in-memory store.
// Anyone can send it anything (`npm run phones` puts it on the internet), so a bad
// request has to get an answer and must never take the process down.

import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { connect, createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

const HOST = '127.0.0.1';
let child, port, log = '';

const sparePort = () => new Promise((resolve, reject) => {
  const s = createServer().once('error', reject).listen(0, () => {
    const found = s.address().port;
    s.close(() => resolve(found));
  });
});

before(async () => {
  port = await sparePort();
  assert.ok(port > 3300, 'never the port a developer is using');
  child = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], {
    stdio: ['ignore', 'pipe', 'pipe'],
    // Nothing from the developer's shell, and every setting a local .env could fill in is given here
    // (a value that is already set, even to nothing, wins over .env): memory store, no Logto, and
    // LinkedIn pointed at a stand-in address that these tests never reach.
    env: {
      PATH: process.env.PATH, PORT: String(port), PUBLIC_URL: '', DEMO: '1',
      SNOWFLAKE_ACCOUNT: '', SNOWFLAKE_PAT: '', SNOWFLAKE_PRIVATE_KEY_PATH: '', LOGTO_APP_ID: '',
      LINKEDIN_CLIENT_ID: 'mock-linkedin-app', LINKEDIN_CLIENT_SECRET: 'mock-secret', LINKEDIN_MOCK_URL: 'http://127.0.0.1:9',
    },
  });
  process.once('exit', () => child.kill('SIGKILL')); // even if the test run itself is cut short
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`server did not start:\n${log}`)), 10_000);
    const read = (chunk) => {
      log += chunk;
      if (log.includes(`http://localhost:${port}`)) { clearTimeout(timer); resolve(); }
    };
    child.stdout.on('data', read);
    child.stderr.on('data', read);
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`server stopped (code ${code}):\n${log}`)); });
  });
});

after(() => { child?.kill(); });

/**
 * Sends exactly these bytes, like `curl --path-as-is`: fetch() would tidy the path and refuse the
 * odd method and Host. `halfSent` leaves the request unfinished and waits for the server to answer anyway.
 */
function raw(head, { body = '', halfSent = false } = {}) {
  return new Promise((resolve, reject) => {
    let data = '';
    const socket = connect(port, HOST, () => socket.write(`${head}\r\n\r\n${body}`));
    socket.setEncoding('latin1');
    socket.setTimeout(5_000, () => socket.destroy(new Error(halfSent ? 'the server kept waiting for the rest of the body' : 'no answer within 5 s')));
    socket.on('data', (d) => { data += d; });
    socket.on('error', (err) => { if (!data) reject(err); }); // being cut off after the answer is fine
    socket.on('close', () => {
      const [statusLine, ...lines] = data.split('\r\n\r\n')[0].split('\r\n');
      const headers = Object.fromEntries(lines.map((l) => [l.slice(0, l.indexOf(':')).toLowerCase(), l.slice(l.indexOf(':') + 1).trim()]));
      resolve({ status: Number(statusLine.split(' ')[1]), headers });
    });
  });
}
const get = (target, host = `localhost:${port}`) => raw(`GET ${target} HTTP/1.1\r\nHost: ${host}\r\nConnection: close`);

async function assertStillUp(after) {
  assert.equal(child.exitCode, null, `the server process died after ${after}:\n${log}`);
  const res = await fetch(`http://${HOST}:${port}/api/health`);
  assert.equal(res.status, 200, `health after ${after}`);
  assert.equal((await res.json()).ok, true);
}

test('a request the server cannot make sense of gets 400, and the server keeps running', { timeout: 30_000 }, async () => {
  await assertStillUp('starting');
  const bad = {
    'a broken %-escape in the path': () => get('/%'),
    'TRACE, a method a Request cannot carry': () => raw(`TRACE /api/health HTTP/1.1\r\nHost: localhost:${port}\r\nConnection: close`),
    'a Host that is not an address': () => get('/api/health', '['),
  };
  for (const [what, send] of Object.entries(bad)) {
    assert.equal((await send()).status, 400, what);
    await assertStillUp(what);
  }

  // A client that goes away in the middle of sending gets no answer, and is no reason to stop either.
  await new Promise((resolve, reject) => {
    const socket = connect(port, HOST, () => {
      socket.write(`POST /api/signup HTTP/1.1\r\nHost: localhost:${port}\r\nContent-Type: application/json\r\nContent-Length: 1000\r\n\r\n{"name":`);
      setTimeout(() => socket.destroy(), 100);
    });
    socket.on('error', reject).on('close', resolve);
  });
  await new Promise((resolve) => setTimeout(resolve, 300));
  await assertStillUp('a client hanging up mid-request');
});

test('the path of a request never chooses the host a redirect goes to', { timeout: 30_000 }, async () => {
  const query = '/api/linkedin/callback?code=x&state=y';
  // What this route normally does with a return it does not recognise: back to our own page, with a message.
  const own = await get(query);
  assert.equal(own.status, 302);
  assert.match(own.headers.location, new RegExp(`^http://localhost:${port}/#linkedin_error=`));

  for (const target of [`//evil.example${query}`, `/\\evil.example${query}`, `///evil.example${query}`, `http://evil.example${query}`]) {
    const res = await get(target);
    assert.ok(res.status >= 400 && res.status < 500, `${target} answered ${res.status}`);
    assert.equal(res.headers.location, undefined, `${target} must not redirect`);
    await assertStillUp(target);
  }
  // The tunnel's own header still decides between http and https, and nothing else.
  const viaTunnel = await raw(`GET ${query} HTTP/1.1\r\nHost: localhost:${port}\r\nX-Forwarded-Proto: https\r\nConnection: close`);
  assert.match(viaTunnel.headers.location, new RegExp(`^https://localhost:${port}/#linkedin_error=`));
});

test('an upload is cut off at 413 long before it could fill memory; a profile with the largest photo still fits', { timeout: 30_000 }, async () => {
  // 5 MB announced, 260 kB sent. The answer must come now, not after the rest has arrived.
  const refused = await raw(
    `POST /api/linkedin/session HTTP/1.1\r\nHost: localhost:${port}\r\nContent-Type: application/json\r\nContent-Length: 5000000`,
    { body: 'x'.repeat(260_000), halfSent: true },
  );
  assert.equal(refused.status, 413);
  await assertStillUp('an oversized upload');

  // The largest photo the API takes: 150,000 characters of JPEG data URL (MAX_PHOTO_CHARS in lib/avatar.mjs).
  const bytes = Buffer.alloc(112_482);
  bytes.set([0xff, 0xd8, 0xff, 0xe0]);
  const photo = `data:image/jpeg;base64,${bytes.toString('base64')}`;
  assert.equal(photo.length, 149_999);
  const signup = await fetch(`http://${HOST}:${port}/api/signup`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Ada Lovelace', linkedin: 'ada', offers: 'backend', seeks: 'design', photo }),
  });
  assert.equal(signup.status, 200);
  const { me } = await signup.json();
  const picture = await fetch(`http://${HOST}:${port}${me.picture}`);
  assert.equal(picture.headers.get('content-type'), 'image/jpeg');
  assert.equal((await picture.arrayBuffer()).byteLength, bytes.length);
});
