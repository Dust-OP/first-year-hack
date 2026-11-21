import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi } from '../lib/api.mjs';
import { bearingDeg, distanceM } from '../lib/geo.mjs';
import { createLinkedin } from '../lib/linkedin.mjs';
import { createSnowflakeStore } from '../lib/store-snowflake.mjs';
import { createMockLinkedin } from '../dev/mock-linkedin.mjs';

/**
 * A stand-in for the Snowflake account AS IT IS TODAY: USERS, LOCATIONS and REQUESTS exist,
 * LINKEDIN_PROFILES and USER_PHOTOS do not. It answers the statements the store sends for the
 * three existing tables and refuses the rest the way Snowflake does. It checks the store's own
 * logic, not Snowflake's SQL: that still needs `npm run snowflake:check` on the real account.
 */
function accountWithoutNewTables(refusal = (name) => `Snowflake 422: SQL compilation error:\nObject '${name}' does not exist or not authorized. (sqlState 42S02)`) {
  const users = [], locations = new Map(), requests = [];
  const sent = [];
  const row = (u) => ({ ...u, IS_DEMO: String(u.IS_DEMO) });
  async function query(sql, p = []) {
    const s = sql.replace(/\s+/g, ' ').trim();
    sent.push(s);
    if (/LINKEDIN_PROFILES|USER_PHOTOS/.test(s)) {
      throw new Error(refusal(s.match(/LINKEDIN_PROFILES|USER_PHOTOS/)[0]));
    }
    if (s.startsWith('INSERT INTO USERS')) {
      const [ID, LOGTO_SUB, EMAIL, TOKEN_HASH, NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS, IS_DEMO, CREATED_MS] = p;
      users.push({ ID, LOGTO_SUB, EMAIL, TOKEN_HASH, NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS, IS_DEMO, CREATED_MS });
      return [];
    }
    if (/FROM USERS WHERE TOKEN_HASH = \?/.test(s)) return users.filter((u) => u.TOKEN_HASH === p[0]).map(row);
    if (/FROM USERS WHERE LOGTO_SUB = \?/.test(s)) return users.filter((u) => u.LOGTO_SUB === p[0]).map(row);
    if (/FROM USERS WHERE ID IN/.test(s) || /^SELECT NAME FROM USERS WHERE ID = \?/.test(s)) return users.filter((u) => p.includes(u.ID)).map(row);
    if (s.startsWith('UPDATE USERS SET TOKEN_HASH')) { users.find((u) => u.ID === p[1]).TOKEN_HASH = p[0]; return []; }
    if (s.startsWith('UPDATE USERS SET NAME')) {
      const [NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS, id] = p;
      Object.assign(users.find((u) => u.ID === id), { NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS });
      return [];
    }
    if (s.startsWith('MERGE INTO LOCATIONS')) { locations.set(p[0], { lon: p[1], lat: p[2], ACCURACY_M: p[3], UPDATED_MS: p[4] }); return []; }
    if (s.startsWith('DELETE FROM LOCATIONS')) { locations.delete(p[0]); return []; }
    if (s.startsWith('SELECT u.ID, u.NAME')) {
      const [lon, lat, me, freshAfter, radius] = p;
      return [...locations].filter(([id, l]) => id !== me && l.UPDATED_MS > freshAfter && distanceM({ lat, lon }, l) <= radius)
        .map(([id, l]) => ({ ...row(users.find((u) => u.ID === id)), ACCURACY_M: l.ACCURACY_M, DISTANCE_M: distanceM({ lat, lon }, l), BEARING_DEG: bearingDeg({ lat, lon }, l) }));
    }
    if (s.startsWith('INSERT INTO REQUESTS')) {
      const [ID, FROM_ID, TO_ID, STATUS, CREATED_MS] = p;
      requests.push({ ID, FROM_ID, TO_ID, STATUS, CREATED_MS, RESPONDED_MS: null });
      return [];
    }
    if (/FROM REQUESTS WHERE ID = \?/.test(s)) return requests.filter((r) => r.ID === p[0]);
    if (s.startsWith('UPDATE REQUESTS SET STATUS')) { Object.assign(requests.find((r) => r.ID === p[2]), { STATUS: p[0], RESPONDED_MS: p[1] }); return []; }
    if (/FROM REQUESTS WHERE FROM_ID = \? OR TO_ID = \?/.test(s)) return requests.filter((r) => r.FROM_ID === p[0] || r.TO_ID === p[1]);
    throw new Error(`the stand-in account does not know this statement: ${s.slice(0, 80)}`);
  }
  return { query, sent, users };
}

test('Snowflake store on an account without the LinkedIn and photo tables: the app keeps working and says so once', async (t) => {
  const warnings = [];
  t.mock.method(console, 'warn', (...args) => warnings.push(args.join(' ')));
  const account = accountWithoutNewTables();
  const mock = createMockLinkedin({ base: 'http://linkedin.mock.test' });
  const linkedin = createLinkedin({
    clientId: mock.clientId, clientSecret: mock.clientSecret, mock: mock.base,
    authorizeUrl: `${mock.base}/oauth/v2/authorization`, tokenUrl: `${mock.base}/oauth/v2/accessToken`, userinfoUrl: `${mock.base}/v2/userinfo`,
  }, { fetch: mock.fetch });
  const api = createApi({ store: createSnowflakeStore(account), demo: true, linkedin });
  const APP = 'https://compass.example.test';
  const call = (token, cookie) => async (method, path, body) => {
    const headers = { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie } : {}) };
    const res = await api(new Request(APP + path, { method, body: body ? JSON.stringify(body) : undefined, headers }));
    return { status: res.status, body: res.headers.get('content-type')?.includes('json') ? await res.json() : await res.text() };
  };
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]).toString('base64');

  // Quick sign-up with a picked photo: the account is made, the photo is skipped.
  const a = await call()('POST', '/api/signup', { name: 'Ada Lovelace', linkedin: 'ada', offers: 'backend', seeks: 'design', photo: jpeg });
  assert.equal(a.status, 200);
  // Sign in with LinkedIn: the account is made, the LinkedIn record is skipped.
  const start = await api(new Request(`${APP}/api/linkedin/start`));
  const consent = new URL(start.headers.get('location'));
  for (const [k, v] of Object.entries({ name: 'Ben Okoye', email: 'ben@example.com', decision: 'allow' })) consent.searchParams.set(k, v);
  const approved = await mock.handle(new Request(consent));
  const cookie = start.headers.get('set-cookie').split(';')[0];
  const landed = await api(new Request(approved.headers.get('location'), { headers: { cookie } }));
  const code = new URLSearchParams(new URL(landed.headers.get('location')).hash.slice(1)).get('linkedin');
  assert.ok(code, 'LinkedIn sign-in completes without the table');
  const b = await call(null, cookie)('POST', '/api/linkedin/session', { code }); // the same browser collects its session
  assert.equal(b.body.me.name, 'Ben Okoye');
  const ada = call(a.body.token), ben = call(b.body.token);
  assert.equal((await ben('POST', '/api/profile', { name: 'Ben Okoye', linkedin: 'ben-okoye', offers: 'design', seeks: 'backend', photo: jpeg })).status, 200);

  // The compass itself: position, who is near, invite, accept.
  const here = { lat: 51.5131, lon: -0.1174, accuracy: 5 };
  assert.equal((await ben('POST', '/api/sync', { ...here, lat: here.lat + 0.001 })).status, 200);
  const seen = (await ada('POST', '/api/sync', here)).body;
  assert.deepEqual(seen.nearby.map((n) => [n.name, n.distanceM, Math.round(n.bearing), n.score]), [['Ben Okoye', 111, 0, 3]]);
  const invite = await ada('POST', '/api/requests', { toId: seen.nearby[0].id });
  assert.equal(invite.status, 201);
  assert.equal((await ben('POST', '/api/requests/respond', { id: invite.body.id, action: 'accept' })).body.status, 'accepted');
  assert.equal((await ada('POST', '/api/sync', here)).body.connections[0].person.linkedin, 'https://www.linkedin.com/in/ben-okoye');

  // Pictures fall back to generated initials; the LinkedIn routes answer without failing.
  for (const [who, initials] of [[a, 'AL'], [b, 'BO']]) assert.match((await call()('GET', who.body.me.picture)).body, new RegExp(`>${initials}</text>`));
  assert.deepEqual((await ben('GET', '/api/linkedin/me')).body, { profile: null });
  assert.equal((await ben('POST', '/api/linkedin/forget')).status, 200);

  // Found out once, said once, and never asked again.
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /LINKEDIN_PROFILES \/ USER_PHOTOS are not in this account yet.*setup\.sql/);
  assert.equal(account.sent.filter((s) => /LINKEDIN_PROFILES|USER_PHOTOS/.test(s)).length, 1, 'only the first statement ever reached for the missing tables');
  assert.equal(account.users.find((u) => u.NAME === 'Ben Okoye').EMAIL, null, 'the LinkedIn email is not put into USERS instead');
});

test('Snowflake store: an unexpected failure on the new tables still lets people sign up and still shows a picture', async (t) => {
  const errors = [];
  t.mock.method(console, 'error', (...args) => errors.push(args.join(' ')));
  // The same account, but refusing in words the store does not recognise as "no such table".
  const account = accountWithoutNewTables(() => 'Snowflake 503: service unavailable (sqlState ?)');
  const api = createApi({ store: createSnowflakeStore(account), demo: true });
  const jpeg = 'data:image/jpeg;base64,' + Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16]).toString('base64');
  const signup = await api(new Request('http://x/api/signup', { method: 'POST', body: JSON.stringify({ name: 'Cy Young', linkedin: 'cy-young', photo: jpeg }) }));
  assert.equal(signup.status, 200, 'the account is made even though the photo could not be saved');
  const { me } = await signup.json();
  const picture = await api(new Request(`http://x${me.picture}`));
  assert.equal(picture.status, 200);
  assert.match(await picture.text(), />CY<\/text>/);
  assert.equal(errors.length, 2, 'each failure is logged');
  assert.match(errors.join('\n'), /picked photo was NOT saved[\s\S]*picture lookup failed, serving initials/);
});
