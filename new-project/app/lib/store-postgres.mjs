// Postgres store, for the Vercel deployment (Neon from the Vercel Marketplace).
// Same interface as store-memory.mjs. Tables are created on first use, so a
// fresh database needs no setup step.
//
// Bearing and distance are worked out in JS (lib/geo.mjs) after a bounding-box
// query, so plain Postgres is enough: no PostGIS needed.
//
// `query(text, params)` returns an array of row objects. In production it is
// the Neon serverless driver over HTTP (see postgresQueryFromEnv in setup.mjs).

import { bearingDeg, distanceM } from './geo.mjs';

const num = (v) => (v === null || v === undefined ? null : Number(v));
const M_PER_DEG_LAT = 111_320;

const toUser = (r) => ({
  id: r.id,
  sub: r.logto_sub ?? null,
  email: r.email ?? null,
  name: r.name,
  headline: r.headline,
  linkedin: r.linkedin_url,
  offers: r.offers ?? [],
  seeks: r.seeks ?? [],
  demo: Boolean(r.is_demo),
});
const toRequest = (r) => ({
  id: r.id,
  fromId: r.from_id,
  toId: r.to_id,
  status: r.status,
  createdMs: num(r.created_ms),
  respondedMs: num(r.responded_ms),
});
const toLinkedinProfile = (r) => ({
  userId: r.user_id,
  profileUrl: r.profile_url ?? null,
  sub: r.linkedin_sub,
  name: r.name ?? null,
  givenName: r.given_name ?? null,
  familyName: r.family_name ?? null,
  email: r.email ?? null,
  emailVerified: r.email_verified ?? null,
  picture: r.picture_url ?? null,
  locale: r.locale ?? null,
  claims: r.raw_claims ?? {},
  firstSeenMs: num(r.first_seen_ms),
  lastRefreshedMs: num(r.last_refreshed_ms),
});

/** @param schema  table namespace; the check script uses a throwaway one */
export function createPostgresStore(query, { schema = 'public' } = {}) {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('bad schema name');
  const T = {
    users: `${schema}.users`, locations: `${schema}.locations`, requests: `${schema}.requests`,
    linkedin: `${schema}.linkedin_profiles`, photos: `${schema}.user_photos`,
  };
  const USER_COLS = 'u.id, u.logto_sub, u.email, u.name, u.headline, u.linkedin_url, u.offers, u.seeks, u.is_demo';

  // One round of CREATE ... IF NOT EXISTS per cold start.
  let ready = null;
  const ensure = () =>
    (ready ??= (async () => {
      if (schema !== 'public') await query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      await query(`CREATE TABLE IF NOT EXISTS ${T.users} (
        id text PRIMARY KEY, logto_sub text UNIQUE, email text, token_hash text UNIQUE,
        name text NOT NULL, headline text NOT NULL DEFAULT '', linkedin_url text,
        offers jsonb NOT NULL DEFAULT '[]', seeks jsonb NOT NULL DEFAULT '[]',
        is_demo boolean NOT NULL DEFAULT false, created_ms bigint NOT NULL)`);
      await query(`CREATE TABLE IF NOT EXISTS ${T.locations} (
        user_id text PRIMARY KEY REFERENCES ${T.users}(id) ON DELETE CASCADE,
        lat double precision NOT NULL, lon double precision NOT NULL,
        accuracy_m double precision NOT NULL DEFAULT 0, updated_ms bigint NOT NULL)`);
      await query(`CREATE TABLE IF NOT EXISTS ${T.requests} (
        id text PRIMARY KEY, from_id text NOT NULL REFERENCES ${T.users}(id) ON DELETE CASCADE,
        to_id text NOT NULL REFERENCES ${T.users}(id) ON DELETE CASCADE,
        status text NOT NULL, created_ms bigint NOT NULL, responded_ms bigint)`);
      // What LinkedIn returned at sign-in, kept apart from the app's own profile (see store-memory.mjs).
      await query(`CREATE TABLE IF NOT EXISTS ${T.linkedin} (
        user_id text PRIMARY KEY REFERENCES ${T.users}(id) ON DELETE CASCADE, linkedin_sub text NOT NULL,
        name text, given_name text, family_name text, email text, email_verified boolean,
        picture_url text, locale text, profile_url text, raw_claims jsonb NOT NULL DEFAULT '{}',
        first_seen_ms bigint NOT NULL, last_refreshed_ms bigint NOT NULL)`);
      await query(`CREATE TABLE IF NOT EXISTS ${T.photos} (
        user_id text PRIMARY KEY REFERENCES ${T.users}(id) ON DELETE CASCADE,
        photo text NOT NULL, updated_ms bigint NOT NULL)`);
      await query(`CREATE INDEX IF NOT EXISTS requests_from_idx ON ${T.requests} (from_id)`);
      await query(`CREATE INDEX IF NOT EXISTS requests_to_idx ON ${T.requests} (to_id)`);
    })().catch((err) => { ready = null; throw err; }));
  const q = async (text, params = []) => { await ensure(); return query(text, params); };

  return {
    kind: 'postgres',

    /**
     * A sign-in identity has one account: logto_sub is UNIQUE, and when two sign-ins for the same
     * identity race (a double tap, two tabs), the second gets the first one's account back
     * instead of an error.
     */
    async createUser(u) {
      const rows = await q(
        `INSERT INTO ${T.users} (id, logto_sub, email, token_hash, name, headline, linkedin_url, offers, seeks, is_demo, created_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)
         ON CONFLICT (logto_sub) DO NOTHING RETURNING id`,
        [u.id, u.sub ?? null, u.email ?? null, u.tokenHash ?? null, u.name, u.headline ?? '', u.linkedin ?? null,
          JSON.stringify(u.offers ?? []), JSON.stringify(u.seeks ?? []), Boolean(u.demo), Date.now()],
      );
      return rows.length ? u : this.getUserBySub(u.sub);
    },
    /** See store-memory.mjs. Email is compared without case; a LinkedIn address counts only when LinkedIn says it is verified. */
    async findUserByEmail(email) {
      const rows = await q(
        `SELECT ${USER_COLS} FROM ${T.users} u
         WHERE NOT u.is_demo AND (lower(u.email) = $1 OR EXISTS (
           SELECT 1 FROM ${T.linkedin} l WHERE l.user_id = u.id AND l.email_verified AND lower(l.email) = $1))
         ORDER BY u.created_ms LIMIT 1`,
        [email],
      );
      return rows[0] ? toUser(rows[0]) : null;
    },
    async setUserEmail(id, email) {
      await q(`UPDATE ${T.users} SET email = $1 WHERE id = $2`, [email, id]);
    },
    async getUserBySub(sub) {
      const rows = await q(`SELECT ${USER_COLS} FROM ${T.users} u WHERE u.logto_sub = $1`, [sub]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    /** A new sign-in replaces the previous session token. */
    async setUserToken(id, tokenHash) {
      await q(`UPDATE ${T.users} SET token_hash = $1 WHERE id = $2`, [tokenHash, id]);
    },
    async updateUser(id, p) {
      const rows = await q(
        `UPDATE ${T.users} u SET name = $1, headline = $2, linkedin_url = $3, offers = $4::jsonb, seeks = $5::jsonb
         WHERE u.id = $6 RETURNING ${USER_COLS}`,
        [p.name, p.headline, p.linkedin, JSON.stringify(p.offers), JSON.stringify(p.seeks), id],
      );
      return rows[0] ? toUser(rows[0]) : null;
    },
    async getUserByTokenHash(hash) {
      const rows = await q(`SELECT ${USER_COLS} FROM ${T.users} u WHERE u.token_hash = $1`, [hash]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    async getUsers(ids) {
      if (!ids.length) return [];
      const rows = await q(`SELECT ${USER_COLS} FROM ${T.users} u WHERE u.id = ANY($1::text[])`, [ids]);
      return rows.map(toUser);
    },

    async setLocation(userId, { lat, lon, accuracy, updatedMs }) {
      await q(
        `INSERT INTO ${T.locations} (user_id, lat, lon, accuracy_m, updated_ms) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET lat = EXCLUDED.lat, lon = EXCLUDED.lon,
           accuracy_m = EXCLUDED.accuracy_m, updated_ms = EXCLUDED.updated_ms`,
        [userId, lat, lon, Number(accuracy) || 0, updatedMs],
      );
    },
    async clearLocation(userId) {
      await q(`DELETE FROM ${T.locations} WHERE user_id = $1`, [userId]);
    },
    /** People with a fresh location within radiusM of `at`, nearest first. */
    async nearby(userId, at, radiusM, freshAfterMs) {
      // A box a little larger than the circle; the exact cut is done below.
      const dLat = (radiusM / M_PER_DEG_LAT) * 1.1;
      const dLon = dLat / Math.max(Math.cos((at.lat * Math.PI) / 180), 0.01);
      const rows = await q(
        `SELECT ${USER_COLS}, l.lat, l.lon, l.accuracy_m
         FROM ${T.locations} l JOIN ${T.users} u ON u.id = l.user_id
         WHERE l.user_id <> $1 AND l.updated_ms > $2
           AND l.lat BETWEEN $3 AND $4 AND l.lon BETWEEN $5 AND $6
         LIMIT 200`,
        [userId, freshAfterMs, at.lat - dLat, at.lat + dLat, at.lon - dLon, at.lon + dLon],
      );
      const out = [];
      for (const r of rows) {
        const loc = { lat: Number(r.lat), lon: Number(r.lon) };
        const d = distanceM(at, loc);
        if (d > radiusM) continue;
        out.push({ user: toUser(r), accuracy: num(r.accuracy_m), distanceM: d, bearingDeg: bearingDeg(at, loc) });
      }
      return out.sort((a, b) => a.distanceM - b.distanceM).slice(0, 50);
    },

    async createRequest(r) {
      await q(`INSERT INTO ${T.requests} (id, from_id, to_id, status, created_ms) VALUES ($1, $2, $3, $4, $5)`, [
        r.id, r.fromId, r.toId, r.status, r.createdMs,
      ]);
      return r;
    },
    async getRequest(id) {
      const rows = await q(`SELECT * FROM ${T.requests} WHERE id = $1`, [id]);
      return rows[0] ? toRequest(rows[0]) : null;
    },
    async setRequestStatus(id, status, respondedMs) {
      const rows = await q(`UPDATE ${T.requests} SET status = $1, responded_ms = $2 WHERE id = $3 RETURNING *`, [status, respondedMs, id]);
      return rows[0] ? toRequest(rows[0]) : null;
    },
    async requestsFor(userId) {
      const rows = await q(`SELECT * FROM ${T.requests} WHERE from_id = $1 OR to_id = $1`, [userId]);
      return rows.map(toRequest);
    },

    /** Insert or refresh. `f` is linkedinRecord() plus `profileUrl`; the first-seen time survives a refresh. */
    async saveLinkedinProfile(userId, f, atMs) {
      const rows = await q(
        `INSERT INTO ${T.linkedin} (user_id, linkedin_sub, name, given_name, family_name, email, email_verified,
           picture_url, locale, profile_url, raw_claims, first_seen_ms, last_refreshed_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $12)
         ON CONFLICT (user_id) DO UPDATE SET linkedin_sub = EXCLUDED.linkedin_sub, name = EXCLUDED.name,
           given_name = EXCLUDED.given_name, family_name = EXCLUDED.family_name, email = EXCLUDED.email,
           email_verified = EXCLUDED.email_verified, picture_url = EXCLUDED.picture_url, locale = EXCLUDED.locale,
           profile_url = EXCLUDED.profile_url, raw_claims = EXCLUDED.raw_claims, last_refreshed_ms = EXCLUDED.last_refreshed_ms
         RETURNING *`,
        [userId, f.sub, f.name ?? null, f.givenName ?? null, f.familyName ?? null, f.email ?? null,
          typeof f.emailVerified === 'boolean' ? f.emailVerified : null, f.picture ?? null, f.locale ?? null,
          f.profileUrl ?? null, JSON.stringify(f.claims ?? {}), atMs],
      );
      return toLinkedinProfile(rows[0]);
    },
    async getLinkedinProfile(userId) {
      const rows = await q(`SELECT * FROM ${T.linkedin} WHERE user_id = $1`, [userId]);
      return rows[0] ? toLinkedinProfile(rows[0]) : null;
    },
    /** The linkedin.com/in/ address the user typed: LinkedIn itself does not tell us. */
    async setLinkedinProfileUrl(userId, profileUrl) {
      await q(`UPDATE ${T.linkedin} SET profile_url = $1 WHERE user_id = $2`, [profileUrl, userId]);
    },
    async deleteLinkedinProfile(userId) {
      await q(`DELETE FROM ${T.linkedin} WHERE user_id = $1`, [userId]);
    },
    /** Every record, oldest first. */
    async listLinkedinProfiles() {
      return (await q(`SELECT * FROM ${T.linkedin} ORDER BY first_seen_ms`)).map(toLinkedinProfile);
    },

    async setPhoto(userId, dataUrl) {
      if (dataUrl) {
        await q(
          `INSERT INTO ${T.photos} (user_id, photo, updated_ms) VALUES ($1, $2, $3)
           ON CONFLICT (user_id) DO UPDATE SET photo = EXCLUDED.photo, updated_ms = EXCLUDED.updated_ms`,
          [userId, dataUrl, Date.now()],
        );
      } else {
        await q(`DELETE FROM ${T.photos} WHERE user_id = $1`, [userId]);
      }
    },
    /** What the avatar route needs for one person, or null if there is no such user. */
    async getAvatar(userId) {
      const rows = await q(
        `SELECT u.name, p.photo, l.picture_url FROM ${T.users} u
         LEFT JOIN ${T.photos} p ON p.user_id = u.id
         LEFT JOIN ${T.linkedin} l ON l.user_id = u.id
         WHERE u.id = $1`,
        [userId],
      );
      return rows[0] ? { name: rows[0].name, photo: rows[0].photo ?? null, picture: rows[0].picture_url ?? null } : null;
    },

    /** For the check script: remove a throwaway schema. */
    async dropSchema() {
      if (schema === 'public') throw new Error('refusing to drop the public schema');
      await query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    },
  };
}
