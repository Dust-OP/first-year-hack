// One-command check of the Postgres store against a real database:
//   DATABASE_URL=... npm run db:check      (or put it in .env.local: `vercel env pull`)
// Runs sign-up, position, nearby, invite and accept through the API, then the
// email-code sign-in state (no email is sent), in a throwaway schema, then drops
// that schema. The app's own tables are not touched.

import assert from 'node:assert/strict';
import { createApi } from '../lib/api.mjs';
import { createEmailCode } from '../lib/email-code.mjs';
import { createPostgresCodeState } from '../lib/email-code-postgres.mjs';
import { offset } from '../lib/geo.mjs';
import { createPostgresStore } from '../lib/store-postgres.mjs';
import { postgresQueryFromEnv } from '../lib/setup.mjs';

for (const f of ['../.env.local', '../.env']) {
  try { process.loadEnvFile(new URL(f, import.meta.url)); } catch { /* optional */ }
}
const query = await postgresQueryFromEnv();
if (!query) { console.error('DATABASE_URL is not set.'); process.exit(1); }

const schema = `check_${Date.now().toString(36)}`;
const store = createPostgresStore(query, { schema });
const api = createApi({ store, demo: true });
const call = (token) => async (method, path, body) => {
  const res = await api(new Request('http://x' + path, {
    method, body: body ? JSON.stringify(body) : undefined, headers: token ? { authorization: `Bearer ${token}` } : {},
  }));
  return { status: res.status, body: await res.json() };
};

const here = { lat: 51.5131, lon: -0.1174 }; // Bush House
const there = offset(here, 90, 120); // 120 m east
try {
  const t0 = Date.now();
  const a = (await call()('POST', '/api/signup', { name: 'Check A', linkedin: 'check-a', offers: 'design', seeks: 'backend' })).body;
  const b = (await call()('POST', '/api/signup', { name: 'Check B', linkedin: 'check-b', offers: 'backend', seeks: 'design' })).body;
  assert.ok(a.token && b.token, 'sign-up');
  await call(b.token)('POST', '/api/sync', { ...there, accuracy: 5 });
  const seen = (await call(a.token)('POST', '/api/sync', { ...here, accuracy: 5 })).body;
  assert.equal(seen.nearby.length, 1, 'A sees B');
  assert.ok(Math.abs(seen.nearby[0].bearing - 90) < 1 && Math.abs(seen.nearby[0].distanceM - 120) <= 1, 'bearing and distance');
  const inv = await call(a.token)('POST', '/api/requests', { toId: seen.nearby[0].id });
  assert.equal(inv.status, 201, 'invite');
  const inbox = (await call(b.token)('POST', '/api/sync', { ...there, accuracy: 5 })).body;
  assert.equal(inbox.incoming.length, 1, 'B has the invitation');
  assert.equal((await call(b.token)('POST', '/api/requests/respond', { id: inv.body.id, action: 'accept' })).body.status, 'accepted');
  const done = (await call(a.token)('POST', '/api/sync', { ...here, accuracy: 5 })).body;
  assert.equal(done.connections[0]?.person.linkedin, 'https://www.linkedin.com/in/check-b', 'A holds B\'s LinkedIn');
  // Email-code sign-in with its state in Postgres, as on Vercel. The mail service is a fake.
  const outbox = [];
  const ec = createEmailCode({ send: async (m) => outbox.push(m), log: () => {}, state: createPostgresCodeState(query, { schema }) });
  const mine = ec.newBrowserKey(), other = ec.newBrowserKey();
  await ec.start({ email: 'Check@Example.com', browserKey: mine, client: '192.0.2.1' });
  const code = outbox[0].text.match(/\b\d{6}\b/)[0];
  await assert.rejects(ec.start({ email: 'check@example.com', browserKey: other, client: '192.0.2.2' }), /wait a minute/, 'one code a minute per address');
  await assert.rejects(ec.verify({ browserKey: other, code }), /ask for a code first/, 'another browser cannot use the code');
  await assert.rejects(ec.verify({ browserKey: mine, code: code === '000000' ? '111111' : '000000' }), /not right/, 'wrong code');
  assert.equal(await ec.verify({ browserKey: mine, code }), 'check@example.com', 'right code');
  await assert.rejects(ec.verify({ browserKey: mine, code }), /ask for a code first/, 'a code works once');
  const tries = ec.newBrowserKey();
  await ec.start({ email: 'tries@example.com', browserKey: tries, client: '192.0.2.1' });
  const right = outbox[1].text.match(/\b\d{6}\b/)[0], wrong = right === '000000' ? '111111' : '000000';
  for (let i = 0; i < 4; i++) await assert.rejects(ec.verify({ browserKey: tries, code: wrong }), /not right/);
  await assert.rejects(ec.verify({ browserKey: tries, code: wrong }), /Too many wrong/, 'five wrong guesses end the code');
  await assert.rejects(ec.verify({ browserKey: tries, code: right }), /ask for a code first/, 'gone after too many tries');
  console.log('email-code state in postgres: passed');
  console.log(`postgres check passed in ${Date.now() - t0} ms (schema ${schema}, bearing ${seen.nearby[0].bearing}°, ${seen.nearby[0].distanceM} m)`);
} finally {
  await store.dropSchema();
}
