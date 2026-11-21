// Builds the API from environment variables. Shared by server.mjs (local)
// and api/index.mjs (Vercel), so both pick the store and sign-in the same way.
//
// Store choice: DATABASE_URL -> Postgres (Neon on Vercel), else SNOWFLAKE_ACCOUNT
// -> Snowflake, else the in-memory store.

import { createApi } from './api.mjs';
import { createLinkedin, linkedinConfigFromEnv } from './linkedin.mjs';
import { createIdTokenVerifier, logtoConfigFromEnv } from './logto.mjs';
import { createMemoryStore } from './store-memory.mjs';
import { createPostgresStore } from './store-postgres.mjs';
import { createSnowflakeClient, snowflakeConfigFromEnv } from './snowflake.mjs';
import { createSnowflakeStore } from './store-snowflake.mjs';

/** The Neon driver is loaded only when a database is configured, so `npm start` needs no install. */
export async function postgresQueryFromEnv(env = process.env) {
  if (!env.DATABASE_URL) return null;
  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(env.DATABASE_URL);
  return (text, params) => sql.query(text, params);
}

export async function createStoreFromEnv(env = process.env) {
  const pg = await postgresQueryFromEnv(env);
  if (pg) return createPostgresStore(pg);
  const sf = snowflakeConfigFromEnv(env);
  return sf ? createSnowflakeStore(createSnowflakeClient(sf)) : createMemoryStore();
}

export async function createAppFromEnv(env = process.env) {
  const store = await createStoreFromEnv(env);
  const logto = logtoConfigFromEnv(env);
  const linkedinCfg = linkedinConfigFromEnv(env);
  const api = createApi({
    store, demo: env.DEMO !== '0', logto, verifyIdToken: logto && createIdTokenVerifier(logto),
    linkedin: linkedinCfg && createLinkedin(linkedinCfg), publicUrl: env.PUBLIC_URL || null,
  });
  return { api, store, logto, linkedinCfg };
}
