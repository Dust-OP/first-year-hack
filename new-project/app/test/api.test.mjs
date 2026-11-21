import test from 'node:test';
import assert from 'node:assert/strict';
import { createApi, normLinkedin } from '../lib/api.mjs';
import { createMemoryStore } from '../lib/store-memory.mjs';
import { bearingDeg, distanceM, offset } from '../lib/geo.mjs';

const BUSH_HOUSE = { lat: 51.5131, lon: -0.1174 };

function client(api, token) {
  return async (method, path, body) => {
    const res = await api(new Request('http://x' + path, {
      method, body: body ? JSON.stringify(body) : undefined,
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }));
    return { status: res.status, body: await res.json() };
  };
}

test('bearing and distance match known directions', () => {
  const north = offset(BUSH_HOUSE, 0, 100);
  const east = offset(BUSH_HOUSE, 90, 250);
  assert.ok(Math.abs(bearingDeg(BUSH_HOUSE, north)) < 0.01);
  assert.ok(Math.abs(bearingDeg(BUSH_HOUSE, east) - 90) < 0.01);
  assert.ok(Math.abs(distanceM(BUSH_HOUSE, east) - 250) < 0.01);
  // Bush House -> Big Ben is south-west, about 1.4 km.
  const bigBen = { lat: 51.5007, lon: -0.1246 };
  assert.ok(Math.abs(bearingDeg(BUSH_HOUSE, bigBen) - 200) < 5);
  assert.ok(Math.abs(distanceM(BUSH_HOUSE, bigBen) - 1470) < 60);
});

test('LinkedIn input only ever becomes a linkedin.com/in/ URL', () => {
  assert.equal(normLinkedin('linkedin.com/in/ada-lovelace/'), 'https://www.linkedin.com/in/ada-lovelace');
  assert.equal(normLinkedin('https://uk.linkedin.com/in/ada?x=1'), 'https://www.linkedin.com/in/ada');
  assert.equal(normLinkedin('ada-lovelace'), 'https://www.linkedin.com/in/ada-lovelace');
  assert.equal(normLinkedin('javascript:alert(1)'), null);
  assert.equal(normLinkedin('https://evil.example/in/ada'), null);
});

test('two people: point, invite, accept, then both hold the LinkedIn link', async () => {
  let t = 1_000_000;
  const api = createApi({ store: createMemoryStore(), demo: true, now: () => t });
  const anon = client(api);

  const a = (await anon('POST', '/api/signup', { name: 'Ada', linkedin: 'linkedin.com/in/ada', offers: 'backend, python', seeks: 'design' })).body;
  const b = (await anon('POST', '/api/signup', { name: 'Ben', linkedin: 'ben-b', offers: 'Design', seeks: 'backend' })).body;
  const ada = client(api, a.token), ben = client(api, b.token);

  // Ben stands 120 m east of Ada.
  await ben('POST', '/api/sync', { ...offset(BUSH_HOUSE, 90, 120), accuracy: 5 });
  const seen = (await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 })).body;
  assert.equal(seen.nearby.length, 1);
  const p = seen.nearby[0];
  assert.equal(p.name, 'Ben');
  assert.ok(Math.abs(p.bearing - 90) < 0.5 && Math.abs(p.distanceM - 120) <= 1);
  assert.equal(p.score, 3); // he offers what Ada seeks (2) and seeks what she offers (1)
  assert.equal(p.lat, undefined, "another person's coordinates must not reach the client");
  assert.equal(p.lon, undefined);

  const sent = await ada('POST', '/api/requests', { toId: p.id });
  assert.equal(sent.status, 201);
  assert.equal((await ada('POST', '/api/requests', { toId: p.id })).body.id, sent.body.id, 'no duplicate invitations');

  const inbox = (await ben('POST', '/api/sync', {})).body;
  assert.equal(inbox.incoming.length, 1);
  assert.equal(inbox.incoming[0].person.linkedin, 'https://www.linkedin.com/in/ada');

  // Ada cannot accept her own invitation.
  assert.equal((await ada('POST', '/api/requests/respond', { id: sent.body.id, action: 'accept' })).status, 404);
  assert.equal((await ben('POST', '/api/requests/respond', { id: sent.body.id, action: 'accept' })).body.status, 'accepted');
  assert.equal((await ben('POST', '/api/requests/respond', { id: sent.body.id, action: 'decline' })).status, 409);

  const after = (await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 })).body;
  assert.equal(after.connections[0].person.linkedin, 'https://www.linkedin.com/in/ben-b');
  assert.equal(after.nearby[0].relation, 'connected');

  // Ben closes the app: after the freshness window he is no longer pointed at.
  t += 60_000;
  assert.equal((await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 })).body.nearby.length, 0);
});

test('decline, and out-of-range people stay hidden', async () => {
  const api = createApi({ store: createMemoryStore() });
  const anon = client(api);
  const a = (await anon('POST', '/api/signup', { name: 'Ada', linkedin: 'ada' })).body;
  const b = (await anon('POST', '/api/signup', { name: 'Ben', linkedin: 'ben' })).body;
  const ada = client(api, a.token), ben = client(api, b.token);
  await ben('POST', '/api/sync', { ...offset(BUSH_HOUSE, 10, 2000), accuracy: 5 });
  assert.equal((await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 })).body.nearby.length, 0);

  const sent = await ada('POST', '/api/requests', { toId: b.me.id });
  assert.equal((await ben('POST', '/api/requests/respond', { id: sent.body.id, action: 'decline' })).body.status, 'declined');
  const view = (await ada('POST', '/api/sync', {})).body;
  assert.equal(view.outgoing[0].status, 'declined');
  assert.equal(view.connections.length, 0);
  assert.equal((await anon('POST', '/api/sync', {})).status, 401);
  assert.equal((await ada('POST', '/api/demo/seed', BUSH_HOUSE)).status, 404, 'seeding is off unless demo is on');
});

test('demo bots: five appear, one invites me, an invited bot accepts', async () => {
  let t = 5_000_000;
  const api = createApi({ store: createMemoryStore(), demo: true, now: () => t });
  const a = (await client(api)('POST', '/api/signup', { name: 'Ada', linkedin: 'ada', seeks: 'design' })).body;
  const ada = client(api, a.token);
  assert.equal((await ada('POST', '/api/demo/seed', BUSH_HOUSE)).status, 201);
  let view = (await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 })).body;
  assert.equal(view.nearby.length, 5);
  assert.equal(view.incoming.length, 1);
  assert.equal(view.nearby[0].name, 'Amara Okafor', 'best match first: she offers design');
  const target = view.nearby[1];
  await ada('POST', '/api/requests', { toId: target.id });
  t += 5_000;
  view = (await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 })).body;
  assert.ok(view.connections.some((c) => c.person.id === target.id));
});

test('deleting an account removes the person everywhere and ends their session', async () => {
  const t = 2_000_000;
  const store = createMemoryStore();
  const api = createApi({ store, demo: true, now: () => t });
  const anon = client(api);
  const signup = async (name, offers, seeks) => client(api, (await anon('POST', '/api/signup', { name, linkedin: `${name.toLowerCase()}-tester`, offers, seeks })).body.token);
  const ada = await signup('Ada', 'backend', 'design');
  const ben = await signup('Ben', 'design', 'backend');
  const cy = await signup('Cy', 'data', 'backend');

  await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 });
  await cy('POST', '/api/sync', { ...offset(BUSH_HOUSE, 180, 80), accuracy: 5 });
  const benNear = (await ben('POST', '/api/sync', { ...offset(BUSH_HOUSE, 90, 50), accuracy: 5 })).body.nearby;
  const adaId = benNear.find((p) => p.name === 'Ada').id;
  const benId = (await ada('POST', '/api/sync', { ...BUSH_HOUSE, accuracy: 5 })).body.nearby.find((p) => p.name === 'Ben').id;

  // Ada invited Ben (accepted) and Cy invited Ada (pending): both directions must go.
  const r1 = (await ada('POST', '/api/requests', { toId: benId })).body;
  await ben('POST', '/api/requests/respond', { id: r1.id, action: 'accept' });
  await cy('POST', '/api/requests', { toId: adaId });
  await store.saveLinkedinProfile(adaId, { sub: 'li-ada', name: 'Ada', email: 'ada@example.com' }, t);
  await store.setPhoto(adaId, 'data:image/jpeg;base64,AAAA');
  assert.equal((await store.requestsFor(adaId)).length, 2);

  assert.equal((await anon('POST', '/api/account/delete')).status, 401, 'needs a session');
  const del = await ada('POST', '/api/account/delete');
  assert.equal(del.status, 200);
  assert.equal(del.body.deleted, true);

  const benAfter = (await ben('POST', '/api/sync', { ...offset(BUSH_HOUSE, 90, 50), accuracy: 5 })).body;
  assert.equal(benAfter.nearby.some((p) => p.id === adaId), false, 'gone from the compass');
  assert.equal(benAfter.connections.length, 0, 'gone from connections');
  assert.equal((await cy('POST', '/api/sync', {})).body.outgoing.length, 0, 'invitation to her is gone');
  assert.equal((await store.requestsFor(adaId)).length, 0, 'invitation rows deleted, not just hidden');
  assert.equal((await store.requestsFor(benId)).length, 0);
  assert.equal((await ada('GET', '/api/me')).status, 401, 'old token no longer works');
  assert.equal(await store.getLinkedinProfile(adaId), null, 'LinkedIn record gone');
  assert.equal(await store.getAvatar(adaId), null, 'photo and profile gone');
  assert.equal((await ada('POST', '/api/account/delete')).status, 401, 'cannot delete twice');
});
