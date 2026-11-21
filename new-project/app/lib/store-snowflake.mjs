// Snowflake store. Bearing and distance are computed by Snowflake itself
// (ST_AZIMUTH / ST_DISTANCE / ST_DWITHIN on GEOGRAPHY), which is the part
// of the app meant to show for the "Best Use of Snowflake" prize.
// Tables come from snowflake/setup.sql.
// Run against the team's account on 21 Nov 2026; re-check with `npm run snowflake:check`.

const num = (v) => (v === null || v === undefined ? null : Number(v));
const bool = (v) => v === true || v === 'true' || v === '1';

const toUser = (r) => ({
  id: r.ID,
  sub: r.LOGTO_SUB ?? null, // sign-in identity: the Logto user id, or "linkedin|<sub>"
  email: r.EMAIL ?? null,
  name: r.NAME,
  headline: r.HEADLINE,
  linkedin: r.LINKEDIN_URL,
  offers: JSON.parse(r.OFFERS || '[]'),
  seeks: JSON.parse(r.SEEKS || '[]'),
  demo: bool(r.IS_DEMO),
});
const toRequest = (r) => ({
  id: r.ID,
  fromId: r.FROM_ID,
  toId: r.TO_ID,
  status: r.STATUS,
  createdMs: num(r.CREATED_MS),
  respondedMs: num(r.RESPONDED_MS),
});

const jsonOr = (v, fallback) => {
  if (v === null || v === undefined) return fallback;
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch { return fallback; }
};
const toLinkedinProfile = (r) => ({
  userId: r.USER_ID,
  profileUrl: r.PROFILE_URL ?? null,
  sub: r.LINKEDIN_SUB,
  name: r.NAME ?? null,
  givenName: r.GIVEN_NAME ?? null,
  familyName: r.FAMILY_NAME ?? null,
  email: r.EMAIL ?? null,
  emailVerified: r.EMAIL_VERIFIED === null || r.EMAIL_VERIFIED === undefined ? null : bool(r.EMAIL_VERIFIED),
  picture: r.PICTURE_URL ?? null,
  locale: r.LOCALE ?? null,
  claims: jsonOr(r.RAW_CLAIMS, {}), // VARIANT comes back from the SQL API as JSON text
  firstSeenMs: num(r.FIRST_SEEN_MS),
  lastRefreshedMs: num(r.LAST_REFRESHED_MS),
});

const USER_COLS = 'ID, LOGTO_SUB, EMAIL, NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS, IS_DEMO';

export const NEARBY_SQL = `
SELECT u.ID, u.NAME, u.HEADLINE, u.LINKEDIN_URL, u.OFFERS, u.SEEKS, u.IS_DEMO,
       l.ACCURACY_M,
       ST_DISTANCE(me.G, l.GEOG)                          AS DISTANCE_M,
       MOD(DEGREES(ST_AZIMUTH(me.G, l.GEOG)) + 360, 360)  AS BEARING_DEG
FROM LOCATIONS l
JOIN USERS u ON u.ID = l.USER_ID
CROSS JOIN (SELECT ST_MAKEPOINT(?, ?) AS G) me
WHERE l.USER_ID <> ?
  AND l.UPDATED_MS > ?
  AND ST_DWITHIN(me.G, l.GEOG, ?)
ORDER BY DISTANCE_M
LIMIT 50`;

export function createSnowflakeStore(client) {
  const q = client.query;
  /** Last statement the app ran, for the "under the hood" panel. */
  const last = { sql: null, ms: null, rows: null };

  // The tables added on 21 Nov 2026 (LINKEDIN_PROFILES, USER_PHOTOS) exist only after an admin has
  // run the new block of setup.sql; the app role cannot create them. Until then everything that
  // needs them is skipped: found out once, said once, and the compass itself is not affected.
  let extras = null; // null = not known yet, false = the tables are not there
  async function extra(run, fallback) {
    if (extras === false) return fallback;
    try {
      const out = await run();
      extras = true;
      return out;
    } catch (err) {
      if (!/does not exist or not authorized|sqlState 42S02/i.test(err.message)) throw err; // only "no such table" is expected here
      extras = false;
      console.warn('[snowflake] LINKEDIN_PROFILES / USER_PHOTOS are not in this account yet. LinkedIn records and picked photos are NOT being saved, and pictures are generated initials. To turn them on, run the block added on 21 Nov 2026 in snowflake/setup.sql (section 2) and restart.');
      return fallback;
    }
  }

  return {
    kind: 'snowflake',
    last,

    async createUser(u) {
      await q(
        `INSERT INTO USERS (ID, LOGTO_SUB, EMAIL, TOKEN_HASH, NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS, IS_DEMO, CREATED_MS)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.sub ?? null, u.email ?? null, u.tokenHash, u.name, u.headline, u.linkedin, JSON.stringify(u.offers), JSON.stringify(u.seeks), Boolean(u.demo), Date.now()],
      );
      return u;
    },
    async getUserByTokenHash(hash) {
      const rows = await q(`SELECT ${USER_COLS} FROM USERS WHERE TOKEN_HASH = ? LIMIT 1`, [hash]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    async getUserBySub(sub) {
      const rows = await q(`SELECT ${USER_COLS} FROM USERS WHERE LOGTO_SUB = ? LIMIT 1`, [sub]);
      return rows[0] ? toUser(rows[0]) : null;
    },
    async setUserToken(id, tokenHash) {
      await q(`UPDATE USERS SET TOKEN_HASH = ? WHERE ID = ?`, [tokenHash, id]);
    },
    async updateUser(id, p) {
      await q(`UPDATE USERS SET NAME = ?, HEADLINE = ?, LINKEDIN_URL = ?, OFFERS = ?, SEEKS = ? WHERE ID = ?`, [
        p.name, p.headline, p.linkedin, JSON.stringify(p.offers), JSON.stringify(p.seeks), id,
      ]);
      return (await this.getUsers([id]))[0] ?? null;
    },
    async getUsers(ids) {
      if (!ids.length) return [];
      const rows = await q(`SELECT ${USER_COLS} FROM USERS WHERE ID IN (${ids.map(() => '?').join(', ')})`, ids);
      return rows.map(toUser);
    },

    async setLocation(userId, { lat, lon, accuracy, updatedMs }) {
      await q(
        `MERGE INTO LOCATIONS t
         USING (SELECT ? AS USER_ID, ST_MAKEPOINT(?, ?) AS GEOG, ? AS ACCURACY_M, ? AS UPDATED_MS) s
         ON t.USER_ID = s.USER_ID
         WHEN MATCHED THEN UPDATE SET GEOG = s.GEOG, ACCURACY_M = s.ACCURACY_M, UPDATED_MS = s.UPDATED_MS
         WHEN NOT MATCHED THEN INSERT (USER_ID, GEOG, ACCURACY_M, UPDATED_MS)
              VALUES (s.USER_ID, s.GEOG, s.ACCURACY_M, s.UPDATED_MS)`,
        [userId, lon, lat, Number(accuracy) || 0, updatedMs],
      );
    },
    async clearLocation(userId) {
      await q(`DELETE FROM LOCATIONS WHERE USER_ID = ?`, [userId]);
    },
    async nearby(userId, at, radiusM, freshAfterMs) {
      const rows = await q(NEARBY_SQL, [at.lon, at.lat, userId, freshAfterMs, radiusM]);
      Object.assign(last, { sql: NEARBY_SQL.trim(), ms: rows.ms, rows: rows.length });
      return rows.map((r) => ({
        user: toUser(r),
        accuracy: num(r.ACCURACY_M),
        distanceM: num(r.DISTANCE_M),
        bearingDeg: num(r.BEARING_DEG) ?? 0, // ST_AZIMUTH is NULL for identical points
      }));
    },

    async createRequest(r) {
      await q(`INSERT INTO REQUESTS (ID, FROM_ID, TO_ID, STATUS, CREATED_MS) VALUES (?, ?, ?, ?, ?)`, [
        r.id, r.fromId, r.toId, r.status, r.createdMs,
      ]);
      return r;
    },
    async getRequest(id) {
      const rows = await q(`SELECT * FROM REQUESTS WHERE ID = ? LIMIT 1`, [id]);
      return rows[0] ? toRequest(rows[0]) : null;
    },
    async setRequestStatus(id, status, respondedMs) {
      await q(`UPDATE REQUESTS SET STATUS = ?, RESPONDED_MS = ? WHERE ID = ?`, [status, respondedMs, id]);
      return this.getRequest(id);
    },
    async requestsFor(userId) {
      const rows = await q(`SELECT * FROM REQUESTS WHERE FROM_ID = ? OR TO_ID = ?`, [userId, userId]);
      return rows.map(toRequest);
    },

    // LinkedIn records and picked photos live in two tables of their own, LINKEDIN_PROFILES and
    // USER_PHOTOS (added 21 Nov 2026), so the three original tables and every query above are unchanged.
    // An account that has not run that block of setup.sql keeps working: see `extra` above.
    // WRITTEN, NOT YET RUN on Snowflake: `npm run snowflake:check` exercises these statements.
    async saveLinkedinProfile(userId, f, atMs) {
      return extra(async () => {
        await q(
          `MERGE INTO LINKEDIN_PROFILES t
           USING (SELECT ? AS USER_ID, ? AS LINKEDIN_SUB, ? AS NAME, ? AS GIVEN_NAME, ? AS FAMILY_NAME, ? AS EMAIL,
                         TO_BOOLEAN(?) AS EMAIL_VERIFIED, ? AS PICTURE_URL, ? AS LOCALE, ? AS PROFILE_URL,
                         PARSE_JSON(?) AS RAW_CLAIMS, ? AS AT_MS) s
           ON t.USER_ID = s.USER_ID
           WHEN MATCHED THEN UPDATE SET LINKEDIN_SUB = s.LINKEDIN_SUB, NAME = s.NAME, GIVEN_NAME = s.GIVEN_NAME,
                FAMILY_NAME = s.FAMILY_NAME, EMAIL = s.EMAIL, EMAIL_VERIFIED = s.EMAIL_VERIFIED, PICTURE_URL = s.PICTURE_URL,
                LOCALE = s.LOCALE, PROFILE_URL = s.PROFILE_URL, RAW_CLAIMS = s.RAW_CLAIMS, LAST_REFRESHED_MS = s.AT_MS
           WHEN NOT MATCHED THEN INSERT (USER_ID, LINKEDIN_SUB, NAME, GIVEN_NAME, FAMILY_NAME, EMAIL, EMAIL_VERIFIED,
                PICTURE_URL, LOCALE, PROFILE_URL, RAW_CLAIMS, FIRST_SEEN_MS, LAST_REFRESHED_MS)
                VALUES (s.USER_ID, s.LINKEDIN_SUB, s.NAME, s.GIVEN_NAME, s.FAMILY_NAME, s.EMAIL, s.EMAIL_VERIFIED,
                s.PICTURE_URL, s.LOCALE, s.PROFILE_URL, s.RAW_CLAIMS, s.AT_MS, s.AT_MS)`,
          [userId, f.sub, f.name, f.givenName, f.familyName, f.email, f.emailVerified === null ? null : String(f.emailVerified),
            f.picture, f.locale, f.profileUrl ?? null, JSON.stringify(f.claims ?? {}), atMs],
        );
        return this.getLinkedinProfile(userId);
      }, null);
    },
    async getLinkedinProfile(userId) {
      return extra(async () => {
        const rows = await q(`SELECT * FROM LINKEDIN_PROFILES WHERE USER_ID = ? LIMIT 1`, [userId]);
        return rows[0] ? toLinkedinProfile(rows[0]) : null;
      }, null);
    },
    async setLinkedinProfileUrl(userId, profileUrl) {
      await extra(() => q(`UPDATE LINKEDIN_PROFILES SET PROFILE_URL = ? WHERE USER_ID = ?`, [profileUrl, userId]));
    },
    async deleteLinkedinProfile(userId) {
      await extra(() => q(`DELETE FROM LINKEDIN_PROFILES WHERE USER_ID = ?`, [userId]));
    },
    async listLinkedinProfiles() {
      return extra(async () => (await q(`SELECT * FROM LINKEDIN_PROFILES ORDER BY FIRST_SEEN_MS`)).map(toLinkedinProfile), []);
    },

    /**
     * Deletes one account and everything linked to it. Needs DELETE on REQUESTS and USERS, which
     * setup.sql grants from 21 Nov 2026 (section "Account deletion"). REQUESTS goes first, so on an
     * account where that grant has not been run the first statement is refused and nothing is removed.
     */
    async deleteUser(userId) {
      const refused = (err) => /insufficient privileges|sqlState 42501/i.test(err.message);
      try {
        await q(`DELETE FROM REQUESTS WHERE FROM_ID = ? OR TO_ID = ?`, [userId, userId]);
        await q(`DELETE FROM LOCATIONS WHERE USER_ID = ?`, [userId]);
        await this.deleteLinkedinProfile(userId);
        await this.setPhoto(userId, null);
        await q(`DELETE FROM USERS WHERE ID = ?`, [userId]);
      } catch (err) {
        if (refused(err)) throw Object.assign(new Error('The app role may not delete accounts on this Snowflake account yet.'), { code: 'DELETE_NOT_GRANTED', cause: err });
        throw err;
      }
      return true;
    },

    async setPhoto(userId, dataUrl) {
      await extra(() => (dataUrl
        ? q(
          `MERGE INTO USER_PHOTOS t
           USING (SELECT ? AS USER_ID, ? AS PHOTO, ? AS UPDATED_MS) s
           ON t.USER_ID = s.USER_ID
           WHEN MATCHED THEN UPDATE SET PHOTO = s.PHOTO, UPDATED_MS = s.UPDATED_MS
           WHEN NOT MATCHED THEN INSERT (USER_ID, PHOTO, UPDATED_MS) VALUES (s.USER_ID, s.PHOTO, s.UPDATED_MS)`,
          [userId, dataUrl, Date.now()],
        )
        : q(`DELETE FROM USER_PHOTOS WHERE USER_ID = ?`, [userId])));
    },
    async getAvatar(userId) {
      const rows = await extra(
        () => q(
          `SELECT u.NAME, p.PHOTO, l.PICTURE_URL
           FROM USERS u
           LEFT JOIN USER_PHOTOS p ON p.USER_ID = u.ID
           LEFT JOIN LINKEDIN_PROFILES l ON l.USER_ID = u.ID
           WHERE u.ID = ? LIMIT 1`,
          [userId],
        ),
        null,
      ) ?? await q(`SELECT NAME FROM USERS WHERE ID = ? LIMIT 1`, [userId]); // without the new tables: the name is enough for initials
      return rows[0] ? { name: rows[0].NAME, photo: rows[0].PHOTO ?? null, picture: rows[0].PICTURE_URL ?? null } : null;
    },
  };
}
