// Email-code sign-in state in Postgres, for the Vercel deployment, where several
// instances serve the app and none of them can keep codes in its own memory.
// Same interface as createMemoryCodeState() in lib/email-code.mjs. Tables are
// created on first use, like lib/store-postgres.mjs.
//
// What is kept:
//   email_codes       one row per browser that asked for a code: a hash of its browser key,
//                     the address, an HMAC of the code keyed by the browser key (not stored),
//                     the expiry and the wrong guesses. Deleted when used, after too many
//                     wrong guesses, or at the next sign-in activity after it expires.
//   email_code_sends  one row per code sent, for the send limits: SHA-256 hashes of the
//                     address and of the client's IP address, and the time. Kept one day.

import { createHash } from 'node:crypto';
import { DAY, HOUR } from './email-code.mjs';

const hash = (s) => createHash('sha256').update(String(s)).digest('hex');
const num = (v) => (v === null || v === undefined ? null : Number(v));

/** @param schema  table namespace; tests and checks use a throwaway one */
export function createPostgresCodeState(query, { schema = 'public' } = {}) {
  if (!/^[a-z_][a-z0-9_]*$/.test(schema)) throw new Error('bad schema name');
  const C = `${schema}.email_codes`, S = `${schema}.email_code_sends`;
  let ready = null;
  const ensure = () =>
    (ready ??= (async () => {
      if (schema !== 'public') await query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
      await query(`CREATE TABLE IF NOT EXISTS ${C} (
        id text PRIMARY KEY, email text NOT NULL, mac text NOT NULL,
        expires_ms bigint NOT NULL, tries integer NOT NULL DEFAULT 0)`);
      await query(`CREATE TABLE IF NOT EXISTS ${S} (
        email_hash text NOT NULL, client_hash text NOT NULL, at_ms bigint NOT NULL)`);
      await query(`CREATE INDEX IF NOT EXISTS email_code_sends_at_idx ON ${S} (at_ms)`);
    })().catch((err) => { ready = null; throw err; }));
  const q = async (text, params = []) => { await ensure(); return query(text, params); };

  return {
    async prune(t) {
      await q(`DELETE FROM ${C} WHERE expires_ms < $1`, [t]);
      await q(`DELETE FROM ${S} WHERE at_ms < $1`, [t - DAY]);
    },
    async sends({ email, client, t }) {
      const [r] = await q(
        `SELECT max(at_ms) FILTER (WHERE email_hash = $1) AS last_address,
                count(*) FILTER (WHERE email_hash = $1 AND at_ms >= $3) AS address_hour,
                count(*) FILTER (WHERE client_hash = $2 AND at_ms >= $3) AS client_hour,
                count(*) AS day
           FROM ${S} WHERE at_ms >= $4`,
        [hash(email), hash(client), t - HOUR, t - DAY],
      );
      return { lastForAddress: num(r.last_address), addressHour: Number(r.address_hour), clientHour: Number(r.client_hour), day: Number(r.day) };
    },
    async recordSend({ email, client, t }) {
      await q(`INSERT INTO ${S} (email_hash, client_hash, at_ms) VALUES ($1, $2, $3)`, [hash(email), hash(client), t]);
    },
    async putCode(id, { email, mac, expiresMs, tries }) {
      await q(
        `INSERT INTO ${C} (id, email, mac, expires_ms, tries) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET email = $2, mac = $3, expires_ms = $4, tries = $5`,
        [id, email, mac, expiresMs, tries],
      );
    },
    async getCode(id) {
      const [r] = await q(`SELECT email, mac, expires_ms, tries FROM ${C} WHERE id = $1`, [id]);
      return r ? { email: r.email, mac: r.mac, expiresMs: Number(r.expires_ms), tries: Number(r.tries) } : null;
    },
    async addTry(id) {
      const [r] = await q(`UPDATE ${C} SET tries = tries + 1 WHERE id = $1 RETURNING tries`, [id]);
      return r ? Number(r.tries) : Infinity;
    },
    async takeCode(id, mac) {
      const [r] = await q(`DELETE FROM ${C} WHERE id = $1 AND mac = $2 RETURNING email`, [id, mac]);
      return r ? r.email : null;
    },
    async dropCode(id) {
      await q(`DELETE FROM ${C} WHERE id = $1`, [id]);
    },
    /** For checks: removes a throwaway schema. */
    async dropSchema() {
      if (schema === 'public') throw new Error('refusing to drop public');
      await query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
    },
  };
}
