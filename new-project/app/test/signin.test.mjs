import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync } from 'node:crypto';
import { createApi } from '../lib/api.mjs';
import { createIdTokenVerifier } from '../lib/logto.mjs';
import { createMemoryStore } from '../lib/store-memory.mjs';
import { createMockOidc } from '../dev/mock-oidc.mjs';

const ENDPOINT = 'https://auth.example.test';

/** A fake Logto plus a verifier wired to its keys, sharing one adjustable clock. */
function setup({ demo = false } = {}) {
  const clock = { t: Date.parse('2026-11-21T13:00:00Z') };
  const now = () => clock.t;
  const idp = createMockOidc({ issuer: `${ENDPOINT}/oidc`, appId: 'compass-app', now });
  const cfg = { endpoint: ENDPOINT, appId: 'compass-app', issuer: `${ENDPOINT}/oidc`, jwksUri: `${ENDPOINT}/oidc/jwks` };
  let jwksReads = 0;
  const fetch = async () => { jwksReads += 1; return new Response(JSON.stringify(idp.jwks)); };
  const verifyIdToken = createIdTokenVerifier(cfg, { fetch, now });
  const api = createApi({ store: createMemoryStore(), demo, now, logto: cfg, verifyIdToken });
  const call = (token) => async (method, path, body) => {
    const res = await api(new Request('http://x' + path, {
      method, body: body ? JSON.stringify(body) : undefined, headers: token ? { authorization: `Bearer ${token}` } : {},
    }));
    return { status: res.status, body: await res.json() };
  };
  return { clock, idp, verifyIdToken, call, jwksReads: () => jwksReads };
}

test('ID token: a genuine one passes, every kind of wrong one is refused', async () => {
  const { clock, idp, verifyIdToken, jwksReads } = setup();
  const good = idp.idToken({ sub: 'u1', email: 'ada@example.com' });
  assert.equal((await verifyIdToken(good)).sub, 'u1');
  await verifyIdToken(good);
  assert.equal(jwksReads(), 1, 'keys are read once and cached');

  const refused = (token, why) => assert.rejects(() => verifyIdToken(token), why);
  await refused('not.a.token', /malformed/);
  await refused(idp.idToken({ sub: 'u1', aud: 'some-other-app' }), /different app/);
  await refused(idp.idToken({ sub: 'u1', iss: 'https://evil.example/oidc' }), /wrong issuer/);
  await refused(idp.idToken({ aud: 'compass-app' }), /no user id/);

  // Signed by someone else's key but claiming our key id.
  const stranger = generateKeyPairSync('ec', { namedCurve: 'P-384' }).privateKey;
  await refused(idp.idToken({ sub: 'u1' }, { key: stranger }), /bad signature/);
  // Payload edited after signing.
  const [h, , s] = good.split('.');
  const forged = Buffer.from(JSON.stringify({ iss: `${ENDPOINT}/oidc`, aud: 'compass-app', sub: 'admin', iat: clock.t / 1000, exp: clock.t / 1000 + 60 })).toString('base64url');
  await refused(`${h}.${forged}.${s}`, /bad signature/);
  // "alg: none" and symmetric algorithms are never accepted.
  await refused(idp.idToken({ sub: 'u1' }, { header: { alg: 'none' } }), /unsupported/);
  await refused(idp.idToken({ sub: 'u1' }, { header: { alg: 'HS256' } }), /unsupported/);

  clock.t += 11 * 60_000;
  await refused(good, /too old/); // replaying a token long after the sign-in
  clock.t += 60 * 60_000;
  await refused(good, /expired/);
});

test('email sign-in: first visit needs a profile, then the compass works; signing in again keeps the account', async () => {
  const { idp, call } = setup();
  const anon = call();
  assert.deepEqual((await anon('GET', '/api/health')).body.auth, { endpoint: ENDPOINT, appId: 'compass-app' });
  assert.equal((await anon('POST', '/api/session', { idToken: 'junk' })).status, 401);
  assert.equal((await anon('POST', '/api/signup', { name: 'Eve', linkedin: 'eve' })).status, 403, 'no unverified sign-ups once email sign-in is on');

  const first = (await anon('POST', '/api/session', { idToken: idp.idToken({ sub: 'u-ada', email: 'ada@example.com' }) })).body;
  assert.equal(first.me.needsProfile, true);
  assert.equal(first.me.name, 'ada', 'name starts from the email until the profile is filled in');
  assert.equal(first.me.email, 'ada@example.com');
  const ada = call(first.token);

  // Without a profile she is not placed on anyone's compass.
  const here = { lat: 51.5131, lon: -0.1174, accuracy: 5 };
  assert.equal((await ada('POST', '/api/sync', here)).body.located, false);
  assert.equal((await ada('POST', '/api/profile', { name: 'Ada', linkedin: 'nope!!' })).status, 400);
  const saved = (await ada('POST', '/api/profile', { name: 'Ada Lovelace', linkedin: 'linkedin.com/in/ada', offers: ['backend'] })).body.me;
  assert.equal(saved.needsProfile, false);
  assert.equal((await ada('POST', '/api/sync', here)).body.located, true);

  // Someone standing next to her sees her profile but never her email.
  const ben = call((await anon('POST', '/api/session', { idToken: idp.idToken({ sub: 'u-ben', email: 'ben@example.com' }) })).body.token);
  await ben('POST', '/api/profile', { name: 'Ben', linkedin: 'ben' });
  const seen = (await ben('POST', '/api/sync', { ...here, lat: here.lat + 0.001 })).body.nearby;
  assert.equal(seen[0].name, 'Ada Lovelace');
  assert.equal(seen[0].email, undefined);

  // Signing in again: same account, profile kept, and the old session stops working.
  const again = (await anon('POST', '/api/session', { idToken: idp.idToken({ sub: 'u-ada', email: 'ada@example.com' }) })).body;
  assert.equal(again.me.id, first.me.id);
  assert.equal(again.me.needsProfile, false);
  assert.equal((await ada('GET', '/api/me')).status, 401);
  assert.equal((await call(again.token)('GET', '/api/me')).body.me.name, 'Ada Lovelace');
});

test('demo mode keeps the quick sign-up next to email sign-in', async () => {
  const { call } = setup({ demo: true });
  assert.equal((await call()('GET', '/api/health')).body.quickSignup, true);
  assert.equal((await call()('POST', '/api/signup', { name: 'Judge', linkedin: 'judge' })).status, 200);
});
