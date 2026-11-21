// How many people the app has, read-only:
//   DATABASE_URL=... npm run users      (or put it in .env.local: `vercel env pull`)
// A person is an account made by a real sign-in (an emailed code, LinkedIn or Logto). Quick
// sign-ups have no sign-in behind them and demo bots are made by the app, so both are test
// accounts: they are shown on their own line and never counted as people.

import { postgresQueryFromEnv } from '../lib/setup.mjs';

for (const f of ['../.env.local', '../.env']) {
  try { process.loadEnvFile(new URL(f, import.meta.url)); } catch { /* optional */ }
}
const query = await postgresQueryFromEnv();
if (!query) { console.error('DATABASE_URL is not set.'); process.exit(1); }

const [row] = await query(`
  SELECT
    count(*) FILTER (WHERE NOT is_demo AND logto_sub IS NOT NULL)::int                          AS people,
    count(*) FILTER (WHERE NOT is_demo AND logto_sub LIKE 'email|%')::int                       AS by_email_code,
    count(*) FILTER (WHERE NOT is_demo AND logto_sub LIKE 'linkedin|%')::int                    AS by_linkedin,
    count(*) FILTER (WHERE NOT is_demo AND logto_sub IS NOT NULL
                       AND logto_sub NOT LIKE 'email|%' AND logto_sub NOT LIKE 'linkedin|%')::int AS by_logto,
    count(*) FILTER (WHERE NOT is_demo AND logto_sub IS NOT NULL AND linkedin_url IS NULL)::int AS without_profile,
    count(*) FILTER (WHERE NOT is_demo AND logto_sub IS NULL)::int                              AS quick_signups,
    count(*) FILTER (WHERE is_demo)::int                                                        AS demo_bots
  FROM public.users`).catch((err) => {
  if (/relation .* does not exist/.test(err.message)) return [null];
  throw err;
});
if (!row) { console.log('No users table yet: nobody has used this database.'); process.exit(0); }

console.log(`People (real sign-ins): ${row.people}`);
console.log(`  by emailed code ${row.by_email_code}, LinkedIn ${row.by_linkedin}, Logto ${row.by_logto}; ${row.without_profile} not finished their profile yet`);
console.log(`Not counted (test accounts): ${row.quick_signups} quick sign-ups, ${row.demo_bots} demo bots`);
