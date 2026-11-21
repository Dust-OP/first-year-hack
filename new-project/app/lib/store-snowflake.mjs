// Snowflake store. Bearing and distance are computed by Snowflake itself
// (ST_AZIMUTH / ST_DISTANCE / ST_DWITHIN on GEOGRAPHY), which is the part
// of the app meant to show for the "Best Use of Snowflake" prize.
// Tables come from snowflake/setup.sql.
// NOT YET RUN against a live account: verify with `npm run snowflake:check`.

const num = (v) => (v === null || v === undefined ? null : Number(v));
const bool = (v) => v === true || v === 'true' || v === '1';

const toUser = (r) => ({
  id: r.ID,
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

const USER_COLS = 'ID, NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS, IS_DEMO';

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

  return {
    kind: 'snowflake',
    last,

    async createUser(u) {
      await q(
        `INSERT INTO USERS (ID, TOKEN_HASH, NAME, HEADLINE, LINKEDIN_URL, OFFERS, SEEKS, IS_DEMO, CREATED_MS)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.id, u.tokenHash, u.name, u.headline, u.linkedin, JSON.stringify(u.offers), JSON.stringify(u.seeks), Boolean(u.demo), Date.now()],
      );
      return u;
    },
    async getUserByTokenHash(hash) {
      const rows = await q(`SELECT ${USER_COLS} FROM USERS WHERE TOKEN_HASH = ? LIMIT 1`, [hash]);
      return rows[0] ? toUser(rows[0]) : null;
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
  };
}
