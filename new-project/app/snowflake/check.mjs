// One-command check of the Snowflake path. Run after snowflake/setup.sql:
//   npm run snowflake:check
// It answers the open questions from findings/snowflake-real-projects/RESULT.md:
//   1. can the service user log in with the app role?
//   2. does ST_AZIMUTH give a clockwise-from-north bearing (in radians) that agrees with our haversine?
//   3. how long does the compass query take?

import { bearingDeg, distanceM } from '../lib/geo.mjs';
import { linkedinRecord } from '../lib/linkedin.mjs';
import { createSnowflakeClient, snowflakeConfigFromEnv } from '../lib/snowflake.mjs';
import { createSnowflakeStore } from '../lib/store-snowflake.mjs';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch { /* rely on the environment */ }

const cfg = snowflakeConfigFromEnv();
if (!cfg) {
  console.error('SNOWFLAKE_ACCOUNT is not set. Copy .env.example to .env and fill in the SNOWFLAKE_* values.');
  process.exit(2);
}
const { query } = createSnowflakeClient(cfg);
const BUSH_HOUSE = { lat: 51.5131, lon: -0.1174 };
const BIG_BEN = { lat: 51.5007, lon: -0.1246 };
let failed = false;
const report = (ok, label, detail) => { failed ||= !ok; console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}  ${detail}`); };

const who = await query('SELECT CURRENT_USER() AS U, CURRENT_ROLE() AS R, CURRENT_WAREHOUSE() AS W');
report(who[0].R === cfg.role.toUpperCase(), 'login', `user ${who[0].U}, role ${who[0].R}, warehouse ${who[0].W} (${who.ms} ms)`);

const geo = await query(
  `SELECT ST_DISTANCE(a, b) AS D, MOD(DEGREES(ST_AZIMUTH(a, b)) + 360, 360) AS B
   FROM (SELECT ST_MAKEPOINT(?, ?) AS a, ST_MAKEPOINT(?, ?) AS b)`,
  [BUSH_HOUSE.lon, BUSH_HOUSE.lat, BIG_BEN.lon, BIG_BEN.lat],
);
const sfB = Number(geo[0].B), sfD = Number(geo[0].D);
const jsB = bearingDeg(BUSH_HOUSE, BIG_BEN), jsD = distanceM(BUSH_HOUSE, BIG_BEN);
report(Math.abs(sfB - jsB) < 1, 'bearing Bush House -> Big Ben', `Snowflake ${sfB.toFixed(2)} deg, haversine ${jsB.toFixed(2)} deg (expect about 200, south-west)`);
report(Math.abs(sfD - jsD) / jsD < 0.01, 'distance', `Snowflake ${sfD.toFixed(0)} m, haversine ${jsD.toFixed(0)} m`);

for (const table of ['USERS', 'LOCATIONS', 'REQUESTS']) {
  const rows = await query(`SELECT COUNT(*) AS N FROM ${table}`);
  report(true, `table ${table}`, `${rows[0].N} row(s), ${rows.ms} ms`);
}
// Tables added on 21 Nov 2026 for LinkedIn sign-in and pictures. Writes one throwaway row to each,
// reads it back through the app's own store code and deletes it again.
try {
  const store = createSnowflakeStore({ query });
  const id = `check-${Date.now()}`;
  const claims = { sub: 'check', name: 'Check Run', locale: { country: 'GB', language: 'en' }, email_verified: true };
  const url = 'https://www.linkedin.com/in/check';
  const first = await store.saveLinkedinProfile(id, linkedinRecord(claims), 1);
  await store.setLinkedinProfileUrl(id, url);
  const typed = (await store.getLinkedinProfile(id))?.profileUrl;
  const again = await store.saveLinkedinProfile(id, { ...linkedinRecord({ ...claims, name: 'Check Run 2' }), profileUrl: url }, 2);
  const listed = (await store.listLinkedinProfiles()).some((p) => p.userId === id);
  await store.deleteLinkedinProfile(id);
  const ok = first?.profileUrl === null && typed === url && again?.name === 'Check Run 2' && again.firstSeenMs === 1 && again.lastRefreshedMs === 2
    && again.emailVerified === true && again.email === null && again.locale === 'en-GB' && again.claims?.locale?.country === 'GB'
    && again.profileUrl === url && listed && (await store.getLinkedinProfile(id)) === null;
  report(ok, 'table LINKEDIN_PROFILES', ok ? 'insert, refresh, read and delete round trip' : `unexpected row: ${JSON.stringify(again)}`);

  await store.setPhoto(id, 'data:image/jpeg;base64,/9j/check');
  const photo = await query('SELECT PHOTO FROM USER_PHOTOS WHERE USER_ID = ?', [id]);
  await store.setPhoto(id, null);
  const left = await query('SELECT COUNT(*) AS N FROM USER_PHOTOS WHERE USER_ID = ?', [id]);
  report(photo[0]?.PHOTO === 'data:image/jpeg;base64,/9j/check' && Number(left[0].N) === 0, 'table USER_PHOTOS', 'write, read and delete round trip');
  await store.getAvatar(id);
  report(true, 'avatar query', 'USERS joined to both new tables');
} catch (err) {
  report(false, 'LinkedIn and photo tables', `${err.message}\n      Run the block added on 21 Nov 2026 in snowflake/setup.sql (section 2) as SYSADMIN, then try again.\n      Until then the compass still works; LinkedIn sign-in and picked photos do not.`);
}

console.log(failed ? '\nSomething is off: do not demo on Snowflake until this passes.' : '\nSnowflake path looks good. Start the app with the same .env.');
process.exit(failed ? 1 : 0);
