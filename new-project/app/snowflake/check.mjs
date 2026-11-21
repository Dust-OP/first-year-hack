// One-command check of the Snowflake path. Run after snowflake/setup.sql:
//   npm run snowflake:check
// It answers the open questions from findings/snowflake-real-projects/RESULT.md:
//   1. can the service user log in with the app role?
//   2. does ST_AZIMUTH give a clockwise-from-north bearing (in radians) that agrees with our haversine?
//   3. how long does the compass query take?

import { bearingDeg, distanceM } from '../lib/geo.mjs';
import { createSnowflakeClient, snowflakeConfigFromEnv } from '../lib/snowflake.mjs';

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
console.log(failed ? '\nSomething is off: do not demo on Snowflake until this passes.' : '\nSnowflake path looks good. Start the app with the same .env.');
process.exit(failed ? 1 : 0);
