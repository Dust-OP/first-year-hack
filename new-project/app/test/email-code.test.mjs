// Email-code sign-in (lib/email-code.mjs + the two routes in lib/api.mjs).
// A fake mailer collects the emails; nothing is sent.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../lib/api.mjs';
import { createEmailCode, normEmail } from '../lib/email-code.mjs';
import { createResendMailer } from '../lib/mailer.mjs';
import { createMemoryStore } from '../lib/store-memory.mjs';

function setup({ sendFails = false } = {}) {
  let t = 1_000_000;
  const now = () => t;
  const outbox = [];
  const send = async (mail) => { if (sendFails) throw new Error('down'); outbox.push(mail); };
  const emailCode = createEmailCode({ send, now, log: () => {} });
  const store = createMemoryStore();
  const api = createApi({ store, now, demo: false, emailCode });
  /** One browser: keeps its own cookie jar, like a real one. */
  const browser = (client = '203.0.113.1') => {
    const jar = new Map();
    return async (path, body, token) => {
      const res = await api(new Request('http://x' + path, {
        method: 'POST', body: JSON.stringify(body ?? {}),
        headers: { cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '), ...(token ? { authorization: `Bearer ${token}` } : {}) },
      }), { client });
      const set = res.headers.get('set-cookie');
      if (set) {
        const [pair] = set.split(';');
        const [k, v] = pair.split('=');
        v ? jar.set(k, v) : jar.delete(k);
      }
      return { status: res.status, body: await res.json(), cookie: set };
    };
  };
  const codeIn = (mail) => mail.subject.match(/^(\d{6}) /)[1];
  return { outbox, browser, codeIn, store, advance: (ms) => { t += ms; } };
}

test('addresses are normalised, and junk is refused', () => {
  assert.equal(normEmail('  Ada@Example.COM '), 'ada@example.com');
  assert.equal(normEmail('not-an-address'), null);
  assert.equal(normEmail('a@b'), null);
  assert.equal(normEmail('x<script>@example.com'), null);
});

test('code by email signs in, first time asks for a profile, second time is the same account', async () => {
  const { outbox, browser, codeIn } = setup();
  const b = browser();
  const start = await b('/api/email-code/start', { email: 'Ada@Example.com' });
  assert.equal(start.status, 200);
  assert.equal(start.body.email, 'ada@example.com');
  assert.match(start.cookie, /^cc_ec=[^;]+; Path=\/api\/email-code; Max-Age=600; HttpOnly; SameSite=Strict/);
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0].to, 'ada@example.com');
  assert.ok(!JSON.stringify(start.body).includes(codeIn(outbox[0])), 'the code is only in the email');

  const ok = await b('/api/email-code/verify', { code: codeIn(outbox[0]) });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.me.email, 'ada@example.com');
  assert.equal(ok.body.me.needsProfile, true);
  assert.equal(ok.body.me.signedInWith, 'email-code');
  assert.match(ok.cookie, /Max-Age=0/);

  // The profile form completes the account, and only then is it off the profile screen.
  const saved = await b('/api/profile', { name: 'Ada', linkedin: 'linkedin.com/in/ada' }, ok.body.token);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.me.needsProfile, false);
});

test('a returning address gets its old account back', async () => {
  const { outbox, browser, codeIn, advance } = setup();
  const b = browser();
  await b('/api/email-code/start', { email: 'ada@example.com' });
  const first = (await b('/api/email-code/verify', { code: codeIn(outbox[0]) })).body.me;
  advance(61_000);
  await b('/api/email-code/start', { email: 'ada@example.com' });
  const second = await b('/api/email-code/verify', { code: codeIn(outbox[1]) });
  assert.equal(second.status, 200);
  assert.equal(second.body.me.id, first.id);
});

test('the code only works in the browser that asked for it', async () => {
  const { outbox, browser, codeIn } = setup();
  const mine = browser();
  const other = browser();
  await mine('/api/email-code/start', { email: 'ada@example.com' });
  const stolen = await other('/api/email-code/verify', { code: codeIn(outbox[0]) });
  assert.equal(stolen.status, 400);
  assert.equal(stolen.body.token, undefined);
  // The owner can still use it.
  assert.equal((await mine('/api/email-code/verify', { code: codeIn(outbox[0]) })).status, 200);
});

test('a code works once, and expires after 10 minutes', async () => {
  const { outbox, browser, codeIn, advance } = setup();
  const b = browser();
  await b('/api/email-code/start', { email: 'ada@example.com' });
  const code = codeIn(outbox[0]);
  assert.equal((await b('/api/email-code/verify', { code })).status, 200);
  // The cookie was cleared on success; even with the old key the record is gone.
  assert.equal((await b('/api/email-code/verify', { code })).status, 400);

  advance(61_000);
  const b2 = browser();
  await b2('/api/email-code/start', { email: 'ada@example.com' });
  advance(10 * 60_000 + 1);
  const late = await b2('/api/email-code/verify', { code: codeIn(outbox[1]) });
  assert.equal(late.status, 400);
  assert.match(late.body.error, /expired/);
});

test('five wrong codes end the code, even if the right one comes next', async () => {
  const { outbox, browser, codeIn } = setup();
  const b = browser();
  await b('/api/email-code/start', { email: 'ada@example.com' });
  const right = codeIn(outbox[0]);
  const wrong = right === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) assert.equal((await b('/api/email-code/verify', { code: wrong })).status, 400);
  assert.equal((await b('/api/email-code/verify', { code: wrong })).status, 429);
  assert.equal((await b('/api/email-code/verify', { code: right })).status, 400, 'the code is gone after too many tries');
});

test('sending is limited per address, per client and per day', async () => {
  const { browser, advance } = setup();
  const b = browser('198.51.100.7');
  assert.equal((await b('/api/email-code/start', { email: 'a@example.com' })).status, 200);
  assert.equal((await b('/api/email-code/start', { email: 'a@example.com' })).status, 429, 'one minute between codes to one address');
  for (let i = 0; i < 4; i++) { advance(61_000); await b('/api/email-code/start', { email: 'a@example.com' }); }
  advance(61_000);
  assert.equal((await b('/api/email-code/start', { email: 'a@example.com' })).status, 429, 'five an hour per address');

  // One client spraying many addresses: ten an hour (five already used above).
  const codes = [];
  for (let i = 0; i < 6; i++) codes.push((await b('/api/email-code/start', { email: `x${i}@example.com` })).status);
  assert.deepEqual(codes, [200, 200, 200, 200, 200, 429]);
  // Another client is not affected.
  assert.equal((await browser('198.51.100.8')('/api/email-code/start', { email: 'y@example.com' })).status, 200);
});

test('the answer to /start is the same for known and unknown addresses', async () => {
  const { outbox, browser, codeIn, advance } = setup();
  const b = browser();
  await b('/api/email-code/start', { email: 'known@example.com' });
  await b('/api/email-code/verify', { code: codeIn(outbox[0]) });
  advance(61_000);
  const known = await browser()('/api/email-code/start', { email: 'known@example.com' });
  const unknown = await browser()('/api/email-code/start', { email: 'new@example.com' });
  assert.deepEqual(Object.keys(known.body).sort(), Object.keys(unknown.body).sort());
  assert.equal(known.status, unknown.status);
});

test('a failing mail service gives a fixed sentence, and no code is redeemable', async () => {
  const { browser } = setup({ sendFails: true });
  const b = browser();
  const r = await b('/api/email-code/start', { email: 'ada@example.com' });
  assert.equal(r.status, 502);
  assert.equal(r.body.error, 'The code could not be sent. Please try again in a minute.');
  assert.equal(r.cookie, null);
});

test('errors never echo what was sent', async () => {
  const { browser } = setup();
  const r = await browser()('/api/email-code/start', { email: '<img src=x onerror=alert(1)>' });
  assert.equal(r.status, 400);
  assert.ok(!r.body.error.includes('<img'));
});

test('without a mail service the routes are off and quick sign-up stays', async () => {
  const api = createApi({ store: createMemoryStore() });
  const health = await (await api(new Request('http://x/api/health'))).json();
  assert.equal(health.emailCode, false);
  assert.equal(health.quickSignup, true);
  const res = await api(new Request('http://x/api/email-code/start', { method: 'POST', body: '{"email":"a@example.com"}' }));
  assert.equal(res.status, 404);
});

test('the Resend mailer sends the right request and turns failures into errors', async () => {
  const calls = [];
  const ok = createResendMailer({ apiKey: 'k', from: 'Wayrise <hello@wayrise.app>', fetchImpl: async (url, init) => { calls.push({ url, init }); return new Response('{"id":"1"}'); } });
  await ok({ to: 'a@example.com', subject: 's', text: 't', html: 'h' });
  assert.equal(calls[0].url, 'https://api.resend.com/emails');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer k');
  assert.deepEqual(JSON.parse(calls[0].init.body).to, ['a@example.com']);
  const bad = createResendMailer({ apiKey: 'k', from: 'x', fetchImpl: async () => new Response('{"message":"nope"}', { status: 403 }) });
  await assert.rejects(bad({ to: 'a@example.com', subject: 's', text: 't', html: 'h' }), /nope/);
});
