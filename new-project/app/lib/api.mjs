// HTTP API as a Web-standard handler: (Request) => Response.
// server.mjs wraps it for node:http; the same function can sit behind a
// serverless entry point later.
//
// Privacy rule: another person's coordinates never leave the server.
// Clients only ever receive a bearing and a distance.

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { avatarUrl, initialsSvg, photoBytes, pictureExpired, readPhoto } from './avatar.mjs';
import { offset } from './geo.mjs';
import { matchScore, normTags } from './match.mjs';

const RADIUS_M = 500; // how far the compass "sees"
const FRESH_MS = 45_000; // a location older than this is treated as offline
const BOT_ACCEPT_MS = 4_000; // demo bots accept an invitation after this long
const FOREVER = 32503680000000; // year 3000: demo bots never go stale
const HANDOFF_MS = 60_000; // how long the page has to collect its session after coming back from LinkedIn
const STATE_COOKIE = 'cc_li_state';
const CLEAR_STATE = `${STATE_COOKIE}=; Path=/api/linkedin; Max-Age=0; HttpOnly; SameSite=Lax`;
const PROFILE_BODY_MAX = 200_000; // the profile form may carry a small photo
const CODE_COOKIE = 'cc_ec'; // binds an emailed sign-in code to the browser that asked for it
const CLEAR_CODE = `${CODE_COOKIE}=; Path=/api/email-code; Max-Age=0; HttpOnly; SameSite=Strict`;
const EMAIL_SUB = 'email|'; // an email-code sign-in, told apart from Logto and LinkedIn in the user's `sub`

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

/** What other people may see. `picture` is always a URL an <img> can load from our own origin. */
const profile = (u) => ({
  id: u.id, name: u.name, headline: u.headline, linkedin: u.linkedin, offers: u.offers, seeks: u.seeks, demo: Boolean(u.demo),
  picture: avatarUrl(u.id),
});
const LINKEDIN_SUB = 'linkedin|'; // how a LinkedIn sign-in is told apart from a Logto one in the user's `sub`
const signedInWith = (u) =>
  u.sub?.startsWith(LINKEDIN_SUB) ? 'linkedin' : u.sub?.startsWith(EMAIL_SUB) ? 'email-code' : u.sub ? 'email' : 'quick';
/** What you may see about yourself. Email never goes to anyone else. `pictureVersion` makes a just-changed photo reload. */
const self = (u, pictureVersion) => ({
  ...profile(u), picture: avatarUrl(u.id, pictureVersion), email: u.email ?? null, needsProfile: !u.linkedin, signedInWith: signedInWith(u),
});
const newToken = () => randomBytes(24).toString('base64url');

/** Validates the profile form. Returns { error } or { fields, photo } (photo: undefined = leave as it is). */
function readProfile(b) {
  const name = clean(b.name, 60);
  const linkedin = normLinkedin(b.linkedin);
  if (name.length < 2) return { error: 'Please enter your name.' };
  if (!linkedin) return { error: 'Please enter your LinkedIn profile, e.g. linkedin.com/in/your-name.' };
  const { photo, error } = readPhoto(b.photo);
  if (error) return { error };
  return { photo, fields: { name, headline: clean(b.headline, 100), linkedin, offers: normTags(b.offers), seeks: normTags(b.seeks) } };
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
 * @param linkedin       from createLinkedin() in lib/linkedin.mjs when LinkedIn sign-in is configured, else null
 * @param publicUrl      the app's own address when it is fixed; otherwise the address each request came in on
 * @param emailCode      from createEmailCode() in lib/email-code.mjs when email-code sign-in is on, else null.
 *                       Its state is in process memory: only enable it on a single long-running server.
 */
export function createApi({ store, demo = false, now = () => Date.now(), logto = null, verifyIdToken = null, linkedin = null, publicUrl = null, emailCode = null }) {
  // The quick sign-up has no email check. Once real sign-in is on, keep it only for demos.
  const quickSignup = (!logto && !linkedin && !emailCode) || demo;
  // One-time codes that hand a finished LinkedIn sign-in over to the page. Kept in memory: one server process.
  const handoffs = new Map(); // code -> { userId, expiresMs, state }
  const originOf = (request) => (publicUrl || new URL(request.url).origin).replace(/\/+$/, '');
  /** The `state` this browser was given when it started a LinkedIn sign-in, read from its cookie. */
  const stateOf = (request) => new RegExp(`(?:^|;\\s*)${STATE_COOKIE}=([^;]+)`).exec(request.headers.get('cookie') ?? '')?.[1];
  /** The key this browser was given when it asked for an email code, read from its cookie. */
  const codeKeyOf = (request) => new RegExp(`(?:^|;\\s*)${CODE_COOKIE}=([^;]+)`).exec(request.headers.get('cookie') ?? '')?.[1];
  /**
   * Photos and LinkedIn records ride along with a sign-up or sign-in. If the store cannot save one
   * (for example on a database that is not ready for them), the person still gets in; it is logged.
   */
  const extra = async (what, run) => {
    try { await run(); } catch (err) { console.error(`[api] ${what} was NOT saved:`, err.message); }
  };

  async function auth(request) {
    const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
    return token ? store.getUserByTokenHash(sha(token)) : null;
  }

  async function readBody(request, max = 10_000) {
    const text = await request.text();
    if (text.length > max) throw Object.assign(new Error('body too large'), { status: 413 });
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
      json({
        ok: true, store: store.kind, demo, quickSignup, auth: logto ? { endpoint: logto.endpoint, appId: logto.appId } : null,
        // Only whether it is on. The client id and the secret stay on the server.
        linkedin: linkedin ? { standIn: Boolean(linkedin.mock) } : null,
        emailCode: Boolean(emailCode),
      }),

    'POST /api/signup': async (request) => {
      if (!quickSignup) return fail(403, 'Please sign in first.');
      const p = readProfile(await readBody(request, PROFILE_BODY_MAX));
      if (p.error) return fail(400, p.error);
      const token = newToken();
      const user = await store.createUser({ id: randomUUID(), sub: null, email: null, tokenHash: sha(token), ...p.fields, demo: false });
      if (p.photo) await extra('the picked photo', () => store.setPhoto(user.id, p.photo));
      return json({ token, me: self(user) });
    },

    // ----- Sign in with LinkedIn: three steps, because the code exchange needs our client secret -----

    // 1. The "Sign in with LinkedIn" button brings the browser here, and we send it on to LinkedIn.
    'GET /api/linkedin/start': async (request) => {
      if (!linkedin) return fail(404, 'LinkedIn sign-in is not set up on this server.');
      const origin = originOf(request);
      const state = newToken();
      return new Response(null, {
        status: 302,
        headers: {
          Location: linkedin.authorizeUrl({ redirectUri: `${origin}/api/linkedin/callback`, state }),
          // Remembered in this browser only, so the callback can tell it belongs to the sign-in started here.
          'Set-Cookie': `${STATE_COOKIE}=${state}; Path=/api/linkedin; Max-Age=600; HttpOnly; SameSite=Lax${origin.startsWith('https:') ? '; Secure' : ''}`,
          'Cache-Control': 'no-store',
        },
      });
    },

    // 2. LinkedIn sends the browser back with a one-time code. We swap it (server to server, with the
    //    secret), record what LinkedIn says about the member, and give the page a handoff code.
    'GET /api/linkedin/callback': async (request) => {
      if (!linkedin) return fail(404, 'LinkedIn sign-in is not set up on this server.');
      const origin = originOf(request);
      const q = new URL(request.url).searchParams;
      const back = (key, value, keepState = false) => new Response(null, {
        status: 302,
        headers: {
          Location: `${origin}/#${key}=${encodeURIComponent(value)}`,
          ...(keepState ? {} : { 'Set-Cookie': CLEAR_STATE }),
          'Cache-Control': 'no-store',
        },
      });
      const expected = stateOf(request);
      if (q.get('error')) {
        // Anyone can write a link to this address with any `error_description`, and nothing has been
        // checked yet. So that text goes to the log, and the page only ever shows our own sentences.
        const cancelled = /^user_cancelled/.test(q.get('error'));
        if (!cancelled) console.error('[linkedin] callback error:', clean(q.get('error'), 60), clean(q.get('error_description'), 200));
        return back('linkedin_error', cancelled ? 'You cancelled the LinkedIn sign-in.' : 'LinkedIn did not complete the sign-in. Please try again.');
      }
      // `state` proves this return belongs to the sign-in this browser started.
      if (!expected || !q.get('code') || q.get('state') !== expected) return back('linkedin_error', 'Sign-in was interrupted. Please try again.');

      let member;
      try {
        member = await linkedin.memberFor({ code: q.get('code'), redirectUri: `${origin}/api/linkedin/callback` });
      } catch (err) {
        console.error('[linkedin]', err.message);
        return back('linkedin_error', `${err.message}. Please try again.`);
      }
      let user = await store.getUserBySub(LINKEDIN_SUB + member.sub);
      if (!user) {
        // First visit: an account with no profile yet. LinkedIn does not tell us the person's profile
        // address, so they add it on the profile form and stay off every compass until then.
        // Their email is kept in the LinkedIn record only.
        user = await store.createUser({
          id: randomUUID(), sub: LINKEDIN_SUB + member.sub, email: null, tokenHash: null,
          name: clean(member.name || [member.givenName, member.familyName].filter(Boolean).join(' '), 60) || 'LinkedIn member',
          headline: '', linkedin: null, offers: [], seeks: [], demo: false,
        });
      }
      // Recorded now, while the person is signing in. It is never refreshed on a schedule.
      await extra('the LinkedIn record', () => store.saveLinkedinProfile(user.id, { ...member, profileUrl: user.linkedin ?? null }, now()));

      for (const [code, h] of handoffs) if (h.expiresMs < now()) handoffs.delete(code);
      const code = newToken();
      // The handoff belongs to this browser's `state`, and the cookie stays until this browser has collected its session.
      handoffs.set(code, { userId: user.id, expiresMs: now() + HANDOFF_MS, state: expected });
      return back('linkedin', code, true);
    },

    // 3. The page swaps the handoff code for its session token, so the token itself is never in a URL.
    //    The code alone is not enough: a link carrying someone else's code (/#linkedin=<their code>)
    //    would sign the person who opens it in to that other account. Only the browser that went
    //    through LinkedIn still holds the state cookie, so only it may collect the session.
    'POST /api/linkedin/session': async (request) => {
      const code = String((await readBody(request)).code ?? '');
      const handoff = handoffs.get(code);
      handoffs.delete(code);
      const state = stateOf(request);
      const mine = Boolean(handoff && state) && handoff.expiresMs >= now() && handoff.state === state;
      const [user] = mine ? await store.getUsers([handoff.userId]) : [];
      if (!user) return fail(401, 'That sign-in has expired. Please sign in again.');
      const token = newToken();
      await store.setUserToken(user.id, sha(token));
      const res = json({ token, me: self(user) });
      res.headers.set('Set-Cookie', CLEAR_STATE);
      return res;
    },

    // What we hold from LinkedIn about the caller, and the way to have it deleted.
    'GET /api/linkedin/me': async (request) => {
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      return json({ profile: signedInWith(me) === 'linkedin' ? await store.getLinkedinProfile(me.id) : null });
    },
    'POST /api/linkedin/forget': async (request) => {
      const me = await auth(request);
      if (!me) return fail(401, 'Not signed in.');
      await store.deleteLinkedinProfile(me.id);
      return json({ ok: true });
    },

    // ----- Sign in with an emailed code (lib/email-code.mjs) -----

    // 1. Email a 6-digit code. The answer never says whether the address already has an account.
    'POST /api/email-code/start': async (request, ctx) => {
      if (!emailCode) return fail(404, 'Email sign-in is not set up on this server.');
      const { email } = await readBody(request);
      const browserKey = emailCode.newBrowserKey();
      const out = await emailCode.start({ email, browserKey, client: ctx.client });
      const res = json({ email: out.email, expiresMs: out.expiresMs, resendWaitMs: emailCode.resendWaitMs });
      // Only this browser can redeem the code: the key is in an HttpOnly cookie, never in the page or a URL.
      const secure = originOf(request).startsWith('https:') ? '; Secure' : '';
      res.headers.set('Set-Cookie', `${CODE_COOKIE}=${browserKey}; Path=/api/email-code; Max-Age=${emailCode.ttlMs / 1000}; HttpOnly; SameSite=Strict${secure}`);
      return res;
    },

    // 2. Check the code. First visit: an account with no profile yet, which stays off every compass until
    //    the profile is filled in. Accounts are not merged with Logto or LinkedIn ones that share the address.
    'POST /api/email-code/verify': async (request) => {
      if (!emailCode) return fail(404, 'Email sign-in is not set up on this server.');
      const { code } = await readBody(request);
      const email = emailCode.verify({ browserKey: codeKeyOf(request), code });
      const token = newToken();
      let user = await store.getUserBySub(EMAIL_SUB + email);
      if (user) {
        await store.setUserToken(user.id, sha(token));
      } else {
        user = await store.createUser({
          id: randomUUID(), sub: EMAIL_SUB + email, email, tokenHash: sha(token),
          name: clean(email.split('@')[0], 60), headline: '', linkedin: null, offers: [], seeks: [], demo: false,
        });
      }
      const res = json({ token, me: self(user) });
      res.headers.set('Set-Cookie', CLEAR_CODE);
      return res;
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
      const p = readProfile(await readBody(request, PROFILE_BODY_MAX));
      if (p.error) return fail(400, p.error);
      const saved = await store.updateUser(me.id, p.fields);
      if (p.photo !== undefined) await extra('the picked photo', () => store.setPhoto(me.id, p.photo));
      if (signedInWith(me) === 'linkedin') await extra('the profile address in the LinkedIn record', () => store.setLinkedinProfileUrl(me.id, p.fields.linkedin));
      return json({ me: self(saved, p.photo !== undefined ? now() : undefined) });
    },

    // The image behind every person's `picture` URL. No sign-in is asked: an <img> cannot send our
    // token, and ids are random. It gives away a face or initials, never a position or an email.
    'GET /api/avatar': async (request) => {
      const id = new URL(request.url).searchParams.get('id') ?? '';
      // On a Snowflake account without the photo and LinkedIn tables the store answers with the name only.
      // Should that lookup fail for any other reason, initials are still better than a broken image.
      const a = await store.getAvatar(id).catch(async (err) => {
        console.error('[api] picture lookup failed, serving initials:', err.message);
        const [u] = await store.getUsers([id]);
        return u ? { name: u.name, photo: null, picture: null } : null;
      });
      if (!a) return fail(404, 'Not found.');
      const headers = { 'Cache-Control': 'private, max-age=300', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" };
      if (a.photo) return new Response(photoBytes(a.photo), { headers: { ...headers, 'Content-Type': 'image/jpeg' } });
      // The LinkedIn picture is fetched and passed on, not redirected to: the <img> stays on our origin,
      // the viewer's browser never contacts LinkedIn, and a dead link turns into initials instead of a broken image.
      const fromLinkedin = a.picture && linkedin && !pictureExpired(a.picture, now()) ? await linkedin.picture(a.picture) : null;
      if (fromLinkedin) return new Response(fromLinkedin.bytes, { headers: { ...headers, 'Content-Type': fromLinkedin.type } });
      return new Response(initialsSvg(a.name, id), { headers: { ...headers, 'Content-Type': 'image/svg+xml; charset=utf-8' } });
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

  /** `ctx.client`: who is asking (the server passes the client's IP address), for the email-code send limits. */
  return async function handle(request, ctx = {}) {
    const { pathname } = new URL(request.url);
    const route = routes[`${request.method} ${pathname}`];
    if (!route) return fail(404, 'Not found.');
    try {
      return await route(request, ctx);
    } catch (err) {
      if (err.status) return fail(err.status, err.message);
      console.error(`[api] ${request.method} ${pathname}:`, err);
      return fail(500, 'Server error.');
    }
  };
}
