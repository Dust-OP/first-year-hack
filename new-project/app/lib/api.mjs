// HTTP API as a Web-standard handler: (Request) => Response.
// server.mjs wraps it for node:http; the same function can sit behind a
// serverless entry point later.
//
// Privacy rule: another person's coordinates never leave the server.
// Clients only ever receive a bearing and a distance.

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { offset } from './geo.mjs';
import { matchScore, normTags } from './match.mjs';

const RADIUS_M = 500; // how far the compass "sees"
const FRESH_MS = 45_000; // a location older than this is treated as offline
const BOT_ACCEPT_MS = 4_000; // demo bots accept an invitation after this long
const FOREVER = 32503680000000; // year 3000: demo bots never go stale

const sha = (s) => createHash('sha256').update(s).digest('hex');
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const fail = (status, error) => json({ error }, status);
const clean = (s, max) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

/** Accepts a full URL, "linkedin.com/in/x" or a bare handle. Only ever returns a linkedin.com/in/ URL. */
export function normLinkedin(input) {
  const raw = clean(input, 200);
  const m = raw.match(/^(?:https?:\/\/)?(?:[a-z]{2,3}\.)?linkedin\.com\/in\/([^/?#\s]+)/i) ?? raw.match(/^@?([\p{L}\p{N}_%-]{3,100})$/u);
  return m ? `https://www.linkedin.com/in/${encodeURIComponent(decodeURIComponent(m[1]))}` : null;
}

/** What other people may see. */
const profile = (u) => ({
  id: u.id, name: u.name, headline: u.headline, linkedin: u.linkedin, offers: u.offers, seeks: u.seeks, demo: Boolean(u.demo),
});
/** What you may see about yourself. Email never goes to anyone else. */
const self = (u) => ({ ...profile(u), email: u.email ?? null, needsProfile: !u.linkedin });
const newToken = () => randomBytes(24).toString('base64url');

/** Validates the profile form. Returns { error } or the cleaned fields. */
function readProfile(b) {
  const name = clean(b.name, 60);
  const linkedin = normLinkedin(b.linkedin);
  if (name.length < 2) return { error: 'Please enter your name.' };
  if (!linkedin) return { error: 'Please enter your LinkedIn profile, e.g. linkedin.com/in/your-name.' };
  return { name, headline: clean(b.headline, 100), linkedin, offers: normTags(b.offers), seeks: normTags(b.seeks) };
}

const DEMO_PEOPLE = [
  ['Amara Okafor', 'Product designer, fintech', ['design', 'figma', 'user research'], ['frontend', 'co-founder']],
  ['Lukas Brandt', 'Backend engineer, payments', ['backend', 'python', 'databases'], ['design', 'product']],
  ['Mei Tanaka', 'ML researcher, speech', ['machine learning', 'python', 'research'], ['frontend', 'data']],
  ['Sofia Marin', 'Founder, climate startup', ['product', 'fundraising', 'co-founder'], ['backend', 'machine learning']],
  ['Idris Bello', 'Frontend engineer, maps', ['frontend', 'react', 'maps'], ['design', 'mentor']],
];

/**
 * @param logto          { endpoint, appId } when email sign-in is configured, else null
 * @param verifyIdToken  from lib/logto.mjs; required when `logto` is set
 */
export function createApi({ store, demo = false, now = () => Date.now(), logto = null, verifyIdToken = null }) {
  // The quick sign-up has no email check. Once real sign-in is on, keep it only for demos.
  const quickSignup = !logto || demo;

  async function auth(request) {
    const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    return token ? store.getUserByTokenHash(sha(token)) : null;
  }

  async function readBody(request) {
    const text = await request.text();
    if (text.length > 10_000) throw Object.assign(new Error('body too large'), { status: 413 });
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      throw Object.assign(new Error('invalid JSON'), { status: 400 });
    }
  }

  /** The newest request between two people decides how they relate. */
  function relations(me, requests) {
    const rel = new Map();
    for (const r of [...requests].sort((a, b) => a.createdMs - b.createdMs)) {
      const other = r.fromId === me.id ? r.toId : r.fromId;
      const mine = r.fromId === me.id;
      const state =
        r.status === 'accepted' ? 'connected'
        : r.status === 'declined' ? (mine ? 'declined-by-them' : 'declined-by-me')
        : mine ? 'outgoing' : 'incoming';
      rel.set(other, { state, requestId: r.id });
    }
    return rel;
  }

  /** Demo bots accept a little after being invited, so one phone can show the whole flow. */
  async function settleBots(requests) {
    const pending = requests.filter((r) => r.status === 'pending' && now() - r.createdMs > BOT_ACCEPT_MS);
    if (!pending.length) return;
    const bots = new Set((await store.getUsers(pending.map((r) => r.toId))).filter((u) => u.demo).map((u) => u.id));
    for (const r of pending) {
      if (!bots.has(r.toId)) continue;
      await store.setRequestStatus(r.id, 'accepted', now());
      Object.assign(r, { status: 'accepted', respondedMs: now() });
    }
  }

  async function inbox(me, requests) {
    const ids = [...new Set(requests.map((r) => (r.fromId === me.id ? r.toId : r.fromId)))];
    const people = new Map((await store.getUsers(ids)).map((u) => [u.id, u]));
    const view = (r) => {
      const other = people.get(r.fromId === me.id ? r.toId : r.fromId);
      return other && { id: r.id, status: r.status, createdMs: r.createdMs, person: { ...profile(other), ...matchScore(me, other) } };
    };
    const newestFirst = [...requests].sort((a, b) => b.createdMs - a.createdMs);
    return {
      incoming: newestFirst.filter((r) => r.toId === me.id && r.status === 'pending').map(view).filter(Boolean),
      outgoing: newestFirst.filter((r) => r.fromId === me.id && r.status !== 'accepted').map(view).filter(Boolean),
      connections: newestFirst.filter((r) => r.status === 'accepted').map(view).filter(Boolean),
    };
  }

  const routes = {
    'GET /api/health': async () =>
      json({ ok: true, store: store.kind, demo, quickSignup, auth: logto ? { endpoint: logto.endpoint, appId: logto.appId } : null }),

    'POST /api/signup': async (request) => {
      if (!quickSignup) return fail(403, 'Please sign in with your email.');
      const p = readProfile(await readBody(request));
      if (p.error) return fail(400, p.error);
      const token = newToken();
      const user = await store.createUser({ id: randomUUID(), sub: null, email: null, tokenHash: sha(token), ...p, demo: false });
      return json({ token, me: self(user) });
    },

    // Email sign-in: the browser signed in at Logto and brings us the ID token once.
    'POST /api/session': async (request) => {
      if (!verifyIdToken) return fail(404, 'Email sign-in is not set up on this server.');
      const { idToken } = await readBody(request);
      let claims;
      try {
        claims = await verifyIdToken(idToken);
      } catch (err) {
        return fail(401, `Sign-in could not be verified (${err.message}).`);
      }
      const token = newToken();
      let user = await store.getUserBySub(claims.sub);
      if (user) {
        await store.setUserToken(user.id, sha(token));
      } else {
        // First visit: an account with no profile yet. It stays off every compass until the profile is filled in.
        const email = clean(claims.email, 200) || null;
        user = await store.createUser({
          id: randomUUID(), sub: claims.sub, email, tokenHash: sha(token),
          name: clean(claims.name || claims.username || (email ?? '').split('@')[0], 60),
          headline: '', linkedin: null, offers: [], seeks: [], demo: false,
        });
      }
      return json({ token, me: self(user) });
    },

    'POST /api/profile': async (request) => {
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      const p = readProfile(await readBody(request));
      if (p.error) return fail(400, p.error);
      return json({ me: self(await store.updateUser(me.id, p)) });
    },

    'GET /api/me': async (request) => {
      const me = await auth(request);
      return me ? json({ me: self(me) }) : fail(401, 'Not signed in.');
    },

    // One call per tick: report my position, get back who is around and my inbox.
    'POST /api/sync': async (request) => {
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      const b = await readBody(request);
      const lat = Number(b.lat), lon = Number(b.lon);
      // No profile yet = nothing for others to see, so that person is not placed on the map.
      const located = Boolean(me.linkedin) && b.lat != null && b.lon != null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
      const accuracy = Math.min(Math.max(Number(b.accuracy) || 0, 0), 5000);

      if (located) await store.setLocation(me.id, { lat, lon, accuracy, updatedMs: now() });
      const [around, requests] = await Promise.all([
        located ? store.nearby(me.id, { lat, lon }, RADIUS_M, now() - FRESH_MS) : [],
        store.requestsFor(me.id),
      ]);
      await settleBots(requests);
      const rel = relations(me, requests);

      const nearby = around.map((n) => {
        // If GPS error is as large as the gap between two people, the bearing
        // is a guess. Report the spread so the dial can show it honestly.
        const error = accuracy + (n.accuracy || 0);
        const spreadDeg = n.distanceM > 0 ? Math.min(180, (Math.atan2(error, n.distanceM) * 180) / Math.PI) : 180;
        return {
          ...profile(n.user), ...matchScore(me, n.user),
          distanceM: Math.round(n.distanceM), bearing: Math.round(n.bearingDeg * 10) / 10, spreadDeg: Math.round(spreadDeg),
          relation: rel.get(n.user.id)?.state ?? 'none', requestId: rel.get(n.user.id)?.requestId ?? null,
        };
      });
      nearby.sort((a, b) => b.score - a.score || a.distanceM - b.distanceM);
      return json({ located, radiusM: RADIUS_M, nearby, ...(await inbox(me, requests)), engine: store.last ?? null });
    },

    'POST /api/hide': async (request) => {
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      await store.clearLocation(me.id);
      return json({ ok: true });
    },

    'POST /api/requests': async (request) => {
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      const { toId } = await readBody(request);
      const [to] = await store.getUsers([String(toId ?? '')]);
      if (!to || to.id === me.id) return fail(404, 'That person was not found.');
      const existing = relations(me, await store.requestsFor(me.id)).get(to.id);
      // Someone who was declined cannot keep re-inviting; the person who declined may change their mind.
      if (existing && existing.state !== 'declined-by-me') return json({ id: existing.requestId, state: existing.state });
      const r = await store.createRequest({ id: randomUUID(), fromId: me.id, toId: to.id, status: 'pending', createdMs: now(), respondedMs: null });
      return json({ id: r.id, state: 'outgoing' }, 201);
    },

    'POST /api/requests/respond': async (request) => {
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      const { id, action } = await readBody(request);
      if (action !== 'accept' && action !== 'decline') return fail(400, 'action must be accept or decline.');
      const r = await store.getRequest(String(id ?? ''));
      // Only the person who received the invitation may answer it.
      if (!r || r.toId !== me.id) return fail(404, 'Invitation not found.');
      if (r.status !== 'pending') return fail(409, `Invitation already ${r.status}.`);
      const updated = await store.setRequestStatus(r.id, action === 'accept' ? 'accepted' : 'declined', now());
      return json({ id: r.id, status: updated.status });
    },

    // Demo only: place five bots around the caller; one of them invites the caller.
    'POST /api/demo/seed': async (request) => {
      if (!demo) return fail(404, 'Demo mode is off.');
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      const b = await readBody(request);
      const at = { lat: Number(b.lat), lon: Number(b.lon) };
      if (!Number.isFinite(at.lat) || !Number.isFinite(at.lon)) return fail(400, 'lat and lon are required.');
      const made = [];
      for (const [i, [name, headline, offers, seeks]] of DEMO_PEOPLE.entries()) {
        const bot = await store.createUser({
          id: randomUUID(), sub: null, email: null, tokenHash: null, name, headline, offers, seeks, demo: true,
          linkedin: 'https://www.linkedin.com/in/demo-' + name.toLowerCase().replace(/\s+/g, '-'),
        });
        await store.setLocation(bot.id, { ...offset(at, 20 + i * 72, 60 + i * 55), accuracy: 5, updatedMs: FOREVER });
        made.push(bot);
      }
      await store.createRequest({ id: randomUUID(), fromId: made[3].id, toId: me.id, status: 'pending', createdMs: now(), respondedMs: null });
      return json({ added: made.length }, 201);
    },
  };

  return async function handle(request) {
    const { pathname } = new URL(request.url);
    const route = routes[`${request.method} ${pathname}`];
    if (!route) return fail(404, 'Not found.');
    try {
      return await route(request);
    } catch (err) {
      if (err.status) return fail(err.status, err.message);
      console.error(`[api] ${request.method} ${pathname}:`, err);
      return fail(500, 'Server error.');
    }
  };
}
