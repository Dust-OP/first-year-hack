import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../lib/api.mjs';
import { createLinkedin, linkedinRecord } from '../lib/linkedin.mjs';
import { createMemoryStore } from '../lib/store-memory.mjs';
import { createMockLinkedin } from '../dev/mock-linkedin.mjs';

const APP = 'https://compass.example.test';
const HERE = { lat: 51.5131, lon: -0.1174, accuracy: 5 };
// The smallest thing that passes as a JPEG: the start-of-image marker and a little more.
const JPEG = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 74, 70, 73, 70]).toString('base64');

/** Our API wired to the LinkedIn stand-in, in process: no ports, one adjustable clock. */
function setup({ secret = 'mock-secret', localeAs = 'text', demo = false, fetch = null } = {}) {
  const clock = { t: Date.parse('2026-11-21T14:00:00Z') };
  const mock = createMockLinkedin({ base: 'http://linkedin.mock.test', localeAs });
  const cfg = {
    clientId: mock.clientId, clientSecret: secret, mock: mock.base,
    authorizeUrl: `${mock.base}/oauth/v2/authorization`, tokenUrl: `${mock.base}/oauth/v2/accessToken`, userinfoUrl: `${mock.base}/v2/userinfo`,
  };
  const store = createMemoryStore();
  // `fetch(input, init, mock.fetch)` lets a test stand in the way of one call to LinkedIn.
  const api = createApi({ store, demo, now: () => clock.t, linkedin: createLinkedin(cfg, { fetch: fetch ? (input, init) => fetch(input, init, mock.fetch) : mock.fetch }) });
  /** `cookie` is the browser's cookie jar: what `signIn()` below returns for the browser that did the sign-in. */
  const call = (token, cookie) => async (method, path, body) => {
    const res = await api(new Request(APP + path, {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie } : {}) },
    }));
    return { status: res.status, body: await res.json() };
  };

  /** What a browser does between tapping "Sign in with LinkedIn" and landing back on our page. */
  async function signIn({ name = 'Ada Lovelace', email = 'ada@example.com', decision = 'allow', tamper = (u) => u } = {}) {
    const start = await api(new Request(`${APP}/api/linkedin/start`));
    assert.equal(start.status, 302);
    const cookie = start.headers.get('set-cookie').split(';')[0];
    const consent = new URL(start.headers.get('location'));
    for (const [k, v] of Object.entries({ name, email, decision })) consent.searchParams.set(k, v);
    const approved = await mock.handle(new Request(consent));
    assert.equal(approved.status, 302);
    const callback = tamper(approved.headers.get('location'));
    const landed = await api(new Request(callback, { headers: { cookie } }));
    assert.equal(landed.status, 302);
    const hash = new URLSearchParams(new URL(landed.headers.get('location')).hash.slice(1));
    return { start, consent, callback, landed, cookie, code: hash.get('linkedin'), error: hash.get('linkedin_error') };
  }
  /** The whole sign-in in one browser: the page collects its session with the cookie that browser still holds. */
  async function session(opts) {
    const { code, cookie } = await signIn(opts);
    return (await call(null, cookie)('POST', '/api/linkedin/session', { code })).body;
  }
  return { clock, mock, store, api, call, signIn, session };
}

test('LinkedIn sign-in: the member is recorded, adds a profile link, and a later sign-in refreshes the record', async () => {
  const { clock, store, call, signIn, session } = setup();
  const anon = call();
  assert.deepEqual((await anon('GET', '/api/health')).body.linkedin, { standIn: true });
  assert.equal((await anon('POST', '/api/signup', { name: 'Eve', linkedin: 'eve' })).status, 403, 'no unverified sign-ups once LinkedIn sign-in is on');

  // The request we send LinkedIn is the documented one, and carries no secret.
  const { start, consent, code, cookie } = await signIn();
  assert.equal(consent.pathname, '/oauth/v2/authorization');
  assert.equal(consent.searchParams.get('response_type'), 'code');
  assert.equal(consent.searchParams.get('scope'), 'openid profile email');
  assert.equal(consent.searchParams.get('redirect_uri'), `${APP}/api/linkedin/callback`);
  assert.match(start.headers.get('set-cookie'), /HttpOnly; SameSite=Lax; Secure$/);
  assert.doesNotMatch(start.headers.get('location') + start.headers.get('set-cookie'), /mock-secret/);

  const first = (await call(null, cookie)('POST', '/api/linkedin/session', { code })).body;
  assert.equal(first.me.name, 'Ada Lovelace', 'the name comes from LinkedIn');
  assert.equal(first.me.signedInWith, 'linkedin');
  assert.equal(first.me.needsProfile, true, 'LinkedIn does not give the profile address, so the person still adds it');
  assert.equal(first.me.email, null);
  assert.equal((await call(null, cookie)('POST', '/api/linkedin/session', { code })).status, 401, 'a handoff code works once');
  const ada = call(first.token);
  assert.equal((await ada('POST', '/api/sync', HERE)).body.located, false, 'off every compass until the profile is complete');

  const seenAt = clock.t;
  let rec = (await ada('GET', '/api/linkedin/me')).body.profile;
  assert.deepEqual(
    { ...rec, userId: null, sub: typeof rec.sub },
    {
      userId: null, sub: 'string', name: 'Ada Lovelace', givenName: 'Ada', familyName: 'Lovelace', email: 'ada@example.com', emailVerified: true,
      picture: `http://linkedin.mock.test/picture/${rec.sub}.svg`, locale: 'en-GB', profileUrl: null,
      claims: { sub: rec.sub, name: 'Ada Lovelace', given_name: 'Ada', family_name: 'Lovelace', picture: rec.picture, locale: 'en-GB', email: 'ada@example.com', email_verified: true },
      firstSeenMs: seenAt, lastRefreshedMs: seenAt,
    },
  );

  await ada('POST', '/api/profile', { name: 'Ada Lovelace', linkedin: 'linkedin.com/in/ada', offers: ['backend'] });
  assert.equal((await ada('GET', '/api/linkedin/me')).body.profile.profileUrl, 'https://www.linkedin.com/in/ada');
  assert.equal((await ada('POST', '/api/sync', HERE)).body.located, true);

  // A day later she signs in again and has changed her name on LinkedIn.
  clock.t += 86_400_000;
  const again = await session({ name: 'Ada King' });
  assert.equal(again.me.id, first.me.id, 'same LinkedIn member, same account');
  assert.equal(again.me.name, 'Ada Lovelace', 'the name she saved in the app is hers to keep');
  assert.equal(again.me.needsProfile, false);
  assert.equal((await ada('GET', '/api/me')).status, 401, 'the earlier session stops working');
  [rec] = await store.listLinkedinProfiles();
  assert.deepEqual([rec.name, rec.firstSeenMs, rec.lastRefreshedMs, rec.profileUrl], ['Ada King', seenAt, clock.t, 'https://www.linkedin.com/in/ada']);

  // She can have the LinkedIn record deleted and keep using the app.
  const ada2 = call(again.token);
  assert.equal((await ada2('POST', '/api/linkedin/forget')).status, 200);
  assert.equal((await ada2('GET', '/api/linkedin/me')).body.profile, null);
  assert.deepEqual(await store.listLinkedinProfiles(), []);
  assert.equal((await ada2('POST', '/api/sync', HERE)).body.located, true);
});

test('LinkedIn sign-in is refused when it is cancelled, tampered with, replayed or the secret is wrong', async (t) => {
  const { api, signIn } = setup();
  const logged = [];
  t.mock.method(console, 'error', (...args) => logged.push(args.join(' ')));
  // The page is only ever told which of its own sentences to show: a short code, never a sentence.
  assert.equal((await signIn({ decision: 'cancel' })).error, 'cancelled');
  // Any other error on the return, whether LinkedIn reported it or someone wrote it into a link:
  // the text from the address only goes to the server log.
  const planted = 'Your account is locked. Call 020 555 0100 to unlock it.';
  const reported = await api(new Request(`${APP}/api/linkedin/callback?error=access_denied&error_description=${encodeURIComponent(planted)}`));
  assert.equal(reported.headers.get('location'), `${APP}/#linkedin_error=failed`);
  assert.ok(logged.some((line) => line.includes('access_denied') && line.includes(planted)), 'what LinkedIn said is in the log');
  // A return that does not carry the state this browser was given (someone else's link).
  assert.equal((await signIn({ tamper: (u) => u.replace(/state=[^&]+/, 'state=forged') })).error, 'interrupted');
  // A return with no cookie at all, e.g. the callback link opened in another browser.
  const stray = await api(new Request(`${APP}/api/linkedin/callback?code=x&state=y`));
  assert.equal(stray.headers.get('location'), `${APP}/#linkedin_error=interrupted`);
  // A code LinkedIn never issued.
  assert.equal((await signIn({ tamper: (u) => u.replace(/code=[^&]+/, 'code=made-up') })).error, 'refused');
  // Replaying a whole callback, cookie included: LinkedIn's code was already spent.
  const good = await signIn();
  assert.ok(good.code);
  const replay = await api(new Request(good.callback, { headers: { cookie: good.cookie } }));
  assert.equal(replay.headers.get('location'), `${APP}/#linkedin_error=refused`);

  const wrong = setup({ secret: 'not-the-secret' });
  const refused = await wrong.signIn();
  assert.equal(refused.error, 'refused');
  assert.ok(logged.some((line) => /did not accept the sign-in \(invalid_client\)/.test(line)), 'the reason LinkedIn gave is in the log, not in the address');
  assert.equal(refused.code, null);
  assert.deepEqual(await wrong.store.listLinkedinProfiles(), [], 'nothing is recorded for a sign-in that failed');

  // LinkedIn takes the code but then gives no profile, or cannot be reached at all.
  const noProfile = setup({ fetch: (input, init, real) => (String(input).endsWith('/v2/userinfo') ? new Response('{}', { status: 401 }) : real(input, init)) });
  assert.equal((await noProfile.signIn()).error, 'no_profile');
  const unreachable = setup({ fetch: async () => { throw new TypeError('fetch failed'); } });
  assert.equal((await unreachable.signIn()).error, 'failed');

  // Without the two LinkedIn settings the routes do not exist and the app is as it was.
  const plain = createApi({ store: createMemoryStore() });
  assert.equal((await plain(new Request(`${APP}/api/linkedin/start`))).status, 404);
  assert.equal((await (await plain(new Request(`${APP}/api/health`))).json()).linkedin, null);
  assert.equal((await plain(new Request(`${APP}/api/signup`, { method: 'POST', body: JSON.stringify({ name: 'Ada', linkedin: 'ada' }) }))).status, 200);
});

test('what LinkedIn may leave out or shape differently still makes a usable record', () => {
  const full = linkedinRecord({ sub: 'abc', name: ' Ada  Lovelace ', given_name: 'Ada', family_name: 'Lovelace', picture: 'https://media.licdn.com/dms/image/x/0/?e=1&v=beta', locale: { country: 'US', language: 'en' }, email: 'ada@example.com', email_verified: true });
  assert.deepEqual([full.name, full.locale, full.picture], ['Ada Lovelace', 'en-US', 'https://media.licdn.com/dms/image/x/0/?e=1&v=beta']);
  const bare = linkedinRecord({ sub: 42, picture: 'javascript:alert(1)', email_verified: 'yes' });
  assert.deepEqual({ ...bare, claims: null }, { sub: '42', name: null, givenName: null, familyName: null, email: null, emailVerified: null, picture: null, locale: null, claims: null });
  assert.equal(linkedinRecord({ sub: 'x', picture: 'http://plain.example/p.jpg' }).picture, null, 'no plain-http pictures from the real LinkedIn');
});

test('everyone the API returns has a picture an <img> can load; email is never shown to others', async () => {
  const { clock, store, api, call, session } = setup({ demo: true });
  const image = async (url) => {
    const res = await api(new Request(new URL(url, APP)));
    return { status: res.status, type: res.headers.get('content-type'), location: res.headers.get('location'), bytes: Buffer.from(await res.arrayBuffer()) };
  };

  // Ada signed in with LinkedIn, Ben used the quick sign-up and picked a photo, the rest are demo bots.
  const a = await session();
  const ada = call(a.token);
  await ada('POST', '/api/profile', { name: 'Ada Lovelace', linkedin: 'ada' });
  assert.equal((await call()('POST', '/api/signup', { name: 'Ben', linkedin: 'ben', photo: 'data:image/png;base64,AAAA' })).status, 400, 'only a JPEG is taken');
  assert.equal((await call()('POST', '/api/signup', { name: 'Ben', linkedin: 'ben', photo: 'data:image/jpeg;base64,PHN2Zz4=' })).status, 400, 'and it must really be one');
  const b = (await call()('POST', '/api/signup', { name: 'Ben', linkedin: 'ben', photo: JPEG })).body;
  const ben = call(b.token);
  await ada('POST', '/api/sync', HERE);
  await ben('POST', '/api/demo/seed', HERE);
  await ben('POST', '/api/requests', { toId: a.me.id });
  const benView = (await ben('POST', '/api/sync', { ...HERE, lat: HERE.lat + 0.0005 })).body;
  const adaView = (await ada('POST', '/api/sync', HERE)).body;

  const people = [a.me, b.me, ...benView.nearby, ...adaView.nearby, ...adaView.incoming.map((i) => i.person), ...benView.incoming.map((i) => i.person), ...benView.outgoing.map((i) => i.person)];
  assert.equal(benView.nearby.length, 6);
  assert.ok(adaView.incoming.length === 1 && benView.incoming.length === 1 && benView.outgoing.length === 1);
  for (const p of people) assert.match(p.picture, /^\/api\/avatar\?id=[0-9a-f-]{36}$/, `${p.name} has a picture`);
  for (const p of [...benView.nearby, ...adaView.nearby]) assert.equal(p.email, undefined);
  assert.doesNotMatch(JSON.stringify(benView), /ada@example\.com/, "Ada's LinkedIn email never reaches Ben");

  // The privacy boundary, on what a stranger receives about someone who signed in with LinkedIn:
  // her profile in the app, where she is relative to him, and `picture`. `picture` is the only new field.
  const stranger = benView.nearby.find((p) => p.id === a.me.id);
  assert.deepEqual(Object.keys(stranger).sort(), [
    'bearing', 'demo', 'distanceM', 'headline', 'helpsMe', 'iHelp', 'id', 'linkedin', 'name', 'offers', 'picture', 'relation', 'requestId', 'score', 'seeks', 'spreadDeg',
  ]);
  assert.deepEqual(Object.keys(benView.outgoing[0].person).sort(), ['demo', 'headline', 'helpsMe', 'iHelp', 'id', 'linkedin', 'name', 'offers', 'picture', 'score', 'seeks']);
  // Nothing LinkedIn told us is in it: not her LinkedIn id, email, locale, name parts or raw claims.
  const kept = await store.getLinkedinProfile(a.me.id);
  assert.ok(kept.sub && kept.email && kept.locale && kept.claims.given_name);
  for (const secret of [kept.sub, kept.email, kept.locale, kept.picture, 'email_verified', 'given_name', 'claims', 'linkedin|', 'signedInWith']) {
    assert.equal(JSON.stringify(benView).includes(secret), false, `"${secret}" must not reach another user`);
  }

  // A demo bot: generated initials, never a photo.
  const bot = benView.nearby.find((p) => p.name === 'Amara Okafor');
  const tile = await image(bot.picture);
  assert.equal(tile.type, 'image/svg+xml; charset=utf-8');
  assert.match(tile.bytes.toString(), />AO<\/text>/);
  // Ada: her LinkedIn picture, fetched by our server and served from our own origin.
  const fromLinkedin = await image(a.me.picture);
  assert.deepEqual([fromLinkedin.status, fromLinkedin.type, fromLinkedin.location], [200, 'image/svg+xml', null]);
  assert.match(fromLinkedin.bytes.toString(), /mock picture/);
  // Ben: the photo he picked.
  const picked = await image(b.me.picture);
  assert.equal(picked.type, 'image/jpeg');
  assert.deepEqual([...picked.bytes.subarray(0, 3)], [0xff, 0xd8, 0xff]);

  // Ada picks her own photo: it wins over the LinkedIn one, and her own link changes so the page reloads it.
  const changed = (await ada('POST', '/api/profile', { name: 'Ada Lovelace', linkedin: 'ada', photo: JPEG })).body.me;
  assert.equal(changed.picture, `${a.me.picture}&v=${clock.t}`);
  assert.equal((await image(changed.picture)).type, 'image/jpeg');
  // Removing it brings the LinkedIn picture back.
  await ada('POST', '/api/profile', { name: 'Ada Lovelace', linkedin: 'ada', photo: '' });
  assert.match((await image(a.me.picture)).bytes.toString(), /mock picture/);
  // A LinkedIn link that has stopped working, or says it has expired, becomes initials: never a broken image.
  const rec = await store.getLinkedinProfile(a.me.id);
  for (const picture of ['http://linkedin.mock.test/gone.jpg', `http://linkedin.mock.test/picture/x.svg?e=${Math.floor(clock.t / 1000) - 60}`]) {
    await store.saveLinkedinProfile(a.me.id, { ...rec, picture }, clock.t);
    assert.match((await image(a.me.picture)).bytes.toString(), />AL<\/text>/, picture);
  }
  // So does deleting her LinkedIn record.
  await store.saveLinkedinProfile(a.me.id, rec, clock.t);
  assert.match((await image(a.me.picture)).bytes.toString(), /mock picture/);
  await ada('POST', '/api/linkedin/forget');
  assert.match((await image(a.me.picture)).bytes.toString(), />AL<\/text>/);

  assert.equal((await image('/api/avatar?id=nobody')).status, 404);
  // A name cannot smuggle markup into the generated image.
  const x = (await call()('POST', '/api/signup', { name: '<script>alert(1)</script> "x"', linkedin: 'xss' })).body;
  assert.doesNotMatch((await image(x.me.picture)).bytes.toString(), /<script|"x"/);
});

test('a handoff code is only good in the browser that went through LinkedIn', async () => {
  const { api, call, signIn } = setup();
  const redeem = (code, cookie) => call(null, cookie)('POST', '/api/linkedin/session', { code });
  const asMallory = { name: 'Mallory Bait', email: 'mallory@example.com' };

  // Mallory has an account and a session that works.
  const own = await signIn(asMallory);
  assert.equal(own.landed.headers.get('set-cookie'), null, 'the state cookie stays in the browser until the session is collected');
  const mallory = (await redeem(own.code, own.cookie)).body;
  assert.equal((await call(mallory.token)('GET', '/api/me')).status, 200);

  // Someone else is half way through a sign-in of their own.
  const victim = await signIn({ name: 'Victor Victim', email: 'victor@example.com' });

  // Mallory signs in again, stops before her page collects the session, and sends the link
  // (/#linkedin=<her code>) to someone else. The browser that opens it has no state cookie,
  // or the cookie of its own sign-in, or whatever else: it is never signed in as Mallory.
  let bait;
  for (const jar of [undefined, victim.cookie, 'cc_li_state=', 'cc_li_state=undefined', `cc_li_state=${own.cookie.split('=')[1]}`, 'something=else']) {
    bait = await signIn(asMallory);
    const refused = await redeem(bait.code, jar);
    assert.equal(refused.status, 401, `cookie: ${jar}`);
    assert.deepEqual(Object.keys(refused.body), ['error'], 'no token, no profile');
  }
  // None of those collected a session: doing so would have ended Mallory's earlier one.
  assert.equal((await call(mallory.token)('GET', '/api/me')).status, 200, 'a refused code does not touch the account');
  // A refused code is spent all the same, even for the browser it was made for.
  assert.equal((await redeem(bait.code, bait.cookie)).status, 401);

  // The other person's own sign-in is untouched by all this and completes in their own browser, as themselves.
  const done = await api(new Request(`${APP}/api/linkedin/session`, { method: 'POST', body: JSON.stringify({ code: victim.code }), headers: { cookie: victim.cookie } }));
  assert.equal(done.status, 200);
  assert.match(done.headers.get('set-cookie'), /^cc_li_state=; Path=\/api\/linkedin; Max-Age=0/, 'the state cookie is cleared once it has done its job');
  assert.equal((await done.json()).me.name, 'Victor Victim');
});

test('the page shows its own sentence for every reason the server can give, and never text from the address', async (t) => {
  // public/auth.js is browser code; it only needs the address and the history of the page it runs in.
  const { linkedin } = await import('../public/auth.js');
  const visit = (hash) => {
    globalThis.location = { hash, pathname: '/', search: '' };
    globalThis.history = { replaceState() {} };
    return linkedin.takeReturn();
  };
  t.after(() => { delete globalThis.location; delete globalThis.history; });

  // Every code /api/linkedin/callback can put in the address (collected in the test above).
  const { signIn } = setup();
  const noProfile = setup({ fetch: (input, init, real) => (String(input).endsWith('/v2/userinfo') ? new Response('{}', { status: 401 }) : real(input, init)) });
  t.mock.method(console, 'error', () => {});
  const landings = [
    await signIn({ decision: 'cancel' }),
    await signIn({ tamper: (u) => u.replace(/state=[^&]+/, 'state=forged') }),
    await signIn({ tamper: (u) => u.replace(/code=[^&]+/, 'code=made-up') }),
    await noProfile.signIn(),
    await setup({ fetch: async () => { throw new TypeError('fetch failed'); } }).signIn(),
  ];
  assert.deepEqual(landings.map((l) => l.error), ['cancelled', 'interrupted', 'refused', 'no_profile', 'failed']);
  const general = 'Sign-in did not complete. Please try again.';
  const shown = landings.map((l) => visit(new URL(l.landed.headers.get('location')).hash).error);
  assert.deepEqual(shown, [
    'You cancelled the LinkedIn sign-in.',
    'Sign-in was interrupted. Please try again.',
    'LinkedIn did not accept the sign-in. Please try again.',
    'LinkedIn did not return a profile. Please try again.',
    'LinkedIn did not complete the sign-in. Please try again.',
  ]);

  // A hand-written link: whatever follows the "=" is never shown, not even a name every object has.
  for (const text of ['Your account is locked. Call 020 555 0100 to unlock it.', '<b>hello</b>', 'constructor', 'toString', '__proto__', 'Cancelled', '']) {
    assert.deepEqual(visit(`#linkedin_error=${encodeURIComponent(text)}`), { error: general }, text);
  }
  // A good return carries the handoff code, and an ordinary address is left alone.
  assert.deepEqual(visit('#linkedin=abc'), { code: 'abc' });
  assert.equal(visit(''), null);
});
