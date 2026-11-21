// One-command check of the Postgres store against a real database:
//   DATABASE_URL=... npm run db:check      (or put it in .env.local: `vercel env pull`)
// Runs sign-up, position, nearby, invite and accept through the API in a
// throwaway schema, then drops that schema. The app's own tables are not touched.

import assert from 'node:assert/strict';
import { createApi } from '../lib/api.mjs';
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
  console.log(`postgres check passed in ${Date.now() - t0} ms (schema ${schema}, bearing ${seen.nearby[0].bearing}°, ${seen.nearby[0].distanceM} m)`);
} finally {
  await store.dropSchema();
}
