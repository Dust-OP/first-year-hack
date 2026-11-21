// Each person is recorded once: signing in again, or signing in another way with the same
// verified email address, gives back the same account. In process, with the LinkedIn stand-in
// and a fake mailer; nothing leaves the machine.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../lib/api.mjs';
import { createEmailCode } from '../lib/email-code.mjs';
import { createLinkedin } from '../lib/linkedin.mjs';
import { createMemoryStore } from '../lib/store-memory.mjs';
import { createMockLinkedin } from '../dev/mock-linkedin.mjs';

const APP = 'https://compass.example.test';

function setup({ linkedinEmailVerified = true } = {}) {
  const mock = createMockLinkedin({ base: 'http://linkedin.mock.test' });
  // Stand in the way of LinkedIn's userinfo answer when a test needs the email unverified.
  const fetch = async (input, init) => {
    const res = await mock.fetch(input, init);
    if (linkedinEmailVerified || !String(input).endsWith('/v2/userinfo')) return res;
    const body = await res.json();
    return Response.json({ ...body, email_verified: false });
  };
  const linkedin = createLinkedin({
    clientId: mock.clientId, clientSecret: mock.clientSecret, mock: mock.base,
    authorizeUrl: `${mock.base}/oauth/v2/authorization`, tokenUrl: `${mock.base}/oauth/v2/accessToken`, userinfoUrl: `${mock.base}/v2/userinfo`,
  }, { fetch });
  const outbox = [];
  let t = Date.parse('2026-11-21T14:00:00Z');
  const now = () => t;
  const emailCode = createEmailCode({ send: async (m) => { outbox.push(m); }, now, log: () => {} });
  const store = createMemoryStore();
  const api = createApi({ store, demo: false, now, linkedin, emailCode });

  const call = (token) => async (method, path, body) => {
    const res = await api(new Request(APP + path, {
      method, body: body ? JSON.stringify(body) : undefined, headers: token ? { authorization: `Bearer ${token}` } : {},
    }));
    return { status: res.status, body: await res.json() };
  };

  async function viaLinkedin({ name = 'Ada Lovelace', email = 'ada@example.com' } = {}) {
    const start = await api(new Request(`${APP}/api/linkedin/start`));
    const cookie = start.headers.get('set-cookie').split(';')[0];
    const consent = new URL(start.headers.get('location'));
    for (const [k, v] of Object.entries({ name, email, decision: 'allow' })) consent.searchParams.set(k, v);
    const approved = await mock.handle(new Request(consent));
    const landed = await api(new Request(approved.headers.get('location'), { headers: { cookie } }));
    const code = new URLSearchParams(new URL(landed.headers.get('location')).hash.slice(1)).get('linkedin');
    const res = await api(new Request(`${APP}/api/linkedin/session`, { method: 'POST', body: JSON.stringify({ code }), headers: { cookie } }));
    return (await res.json());
  }

  async function viaEmail(email) {
    t += 2 * 60_000; // past the wait between two codes to one address
    const post = async (path, body, cookie) => api(new Request(APP + path, { method: 'POST', body: JSON.stringify(body), headers: cookie ? { cookie } : {} }), { client: '203.0.113.9' });
    const start = await post('/api/email-code/start', { email });
    const cookie = start.headers.get('set-cookie').split(';')[0];
    const code = outbox.at(-1).subject.match(/^(\d{6}) /)[1];
    return (await (await post('/api/email-code/verify', { code }, cookie)).json());
  }

  return { store, call, viaLinkedin, viaEmail };
}

const profile = { name: 'Ada Lovelace', linkedin: 'ada-lovelace', offers: 'maths', seeks: 'engines' };

test('signing in with LinkedIn again gives the same account, with its profile', async () => {
  const { call, viaLinkedin } = setup();
  const first = await viaLinkedin();
  assert.equal((await call(first.token)('POST', '/api/profile', profile)).status, 200);
  const again = await viaLinkedin();
  assert.equal(again.me.id, first.me.id);
  assert.equal(again.me.needsProfile, false);
});

test('an emailed code first, then LinkedIn with the same verified address: one account', async () => {
  const { store, call, viaLinkedin, viaEmail } = setup();
  const byEmail = await viaEmail('ada@example.com');
  assert.equal((await call(byEmail.token)('POST', '/api/profile', profile)).status, 200);

  const byLinkedin = await viaLinkedin({ email: 'Ada@Example.com' }); // case does not matter
  assert.equal(byLinkedin.me.id, byEmail.me.id);
  assert.equal(byLinkedin.me.needsProfile, false, 'the profile made before is kept');
  // The LinkedIn record is attached to that account, and its owner can see and delete it.
  assert.equal((await store.getLinkedinProfile(byEmail.me.id)).email, 'Ada@Example.com');
  const shown = (await call(byLinkedin.token)('GET', '/api/linkedin/me')).body;
  assert.equal(shown.linkedin, true);
  assert.equal(shown.profile.userId, byEmail.me.id);

  // And it keeps finding it.
  assert.equal((await viaLinkedin({ email: 'ada@example.com' })).me.id, byEmail.me.id);
  assert.equal((await viaEmail('ada@example.com')).me.id, byEmail.me.id);
});

test('LinkedIn first, then an emailed code to the same address: one account, which now keeps that address', async () => {
  const { store, call, viaLinkedin, viaEmail } = setup();
  const byLinkedin = await viaLinkedin();
  assert.equal((await call(byLinkedin.token)('POST', '/api/profile', profile)).status, 200);

  const byEmail = await viaEmail('ada@example.com');
  assert.equal(byEmail.me.id, byLinkedin.me.id);
  assert.equal(byEmail.me.needsProfile, false);
  assert.equal(byEmail.me.email, 'ada@example.com', 'the address the code proved goes on the account');

  // Deleting the LinkedIn data does not split the person in two at the next emailed code.
  assert.equal((await call(byEmail.token)('POST', '/api/linkedin/forget')).status, 200);
  assert.equal((await viaEmail('ada@example.com')).me.id, byLinkedin.me.id);
});

test('an address LinkedIn has not verified never joins two accounts', async () => {
  const { viaLinkedin, viaEmail } = setup({ linkedinEmailVerified: false });
  const byEmail = await viaEmail('ada@example.com');
  const byLinkedin = await viaLinkedin({ email: 'ada@example.com' });
  assert.notEqual(byLinkedin.me.id, byEmail.me.id);
  // The other direction: the code proves the address, but the LinkedIn account never did.
  const other = await viaLinkedin({ name: 'Ben Okoye', email: 'ben@example.com' });
  assert.notEqual((await viaEmail('ben@example.com')).me.id, other.me.id);
});

test('two sign-ins for the same identity at the same moment make one account', async () => {
  const store = createMemoryStore();
  const make = (id) => store.createUser({ id, sub: 'email|ada@example.com', email: 'ada@example.com', tokenHash: null, name: 'ada', headline: '', linkedin: null, offers: [], seeks: [], demo: false });
  const [a, b] = await Promise.all([make('one'), make('two')]);
  assert.equal(a.id, 'one');
  assert.equal(b.id, 'one');
});
