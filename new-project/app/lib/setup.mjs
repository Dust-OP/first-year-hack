// Builds the API from environment variables. Shared by server.mjs (local)
// and api/index.mjs (Vercel), so both pick the store and sign-in the same way.
//
// Store choice: DATABASE_URL -> Postgres (Neon on Vercel), else SNOWFLAKE_ACCOUNT
// -> Snowflake, else the in-memory store.

import { connectionClient } from './connection-client.mjs';
import { createApi } from './api.mjs';
import { createEmailCode } from './email-code.mjs';
import { createPostgresCodeState } from './email-code-postgres.mjs';
import { createLinkedin, linkedinConfigFromEnv } from './linkedin.mjs';
import { createIdTokenVerifier, logtoConfigFromEnv } from './logto.mjs';
import { createResendMailer, mailerConfigFromEnv } from './mailer.mjs';
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

/** @param pg  an already made Postgres query function, so the caller can share it */
export async function createStoreFromEnv(env = process.env, pg) {
  if (pg === undefined) pg = await postgresQueryFromEnv(env);
  if (pg) return createPostgresStore(pg);
  const sf = snowflakeConfigFromEnv(env);
  return sf ? createSnowflakeStore(createSnowflakeClient(sf)) : createMemoryStore();
}

/**
 * Email-code sign-in, on when RESEND_API_KEY is set. Its codes and send limits go in Postgres when there
 * is a database (shared by every instance), else in this process's memory, which is right only for one
 * long-running server. `shared: true` (Vercel) never uses memory: without a database it stays off.
 */
export function emailCodeFromEnv(env = process.env, { pg = null, shared = false } = {}) {
  const mailer = mailerConfigFromEnv(env);
  if (!mailer || (shared && !pg)) return null;
  return createEmailCode({
    send: createResendMailer(mailer), appName: env.APP_NAME || 'Career Compass',
    ...(pg ? { state: createPostgresCodeState(pg) } : {}),
  });
}

/** @param shared  true where several instances serve the app (Vercel) */
export async function createAppFromEnv(env = process.env, { shared = false } = {}) {
  const pg = await postgresQueryFromEnv(env);
  const store = await createStoreFromEnv(env, pg);
  const logto = logtoConfigFromEnv(env);
  const linkedinCfg = linkedinConfigFromEnv(env);
  const emailCode = emailCodeFromEnv(env, { pg, shared });
  const api = createApi({
    store, demo: env.DEMO !== '0', logto, verifyIdToken: logto && createIdTokenVerifier(logto),
    linkedin: linkedinCfg && createLinkedin(linkedinCfg), connections: connectionClient(env), publicUrl: env.PUBLIC_URL || null, emailCode,
  });
  return { api, store, logto, linkedinCfg, emailCode };
}
