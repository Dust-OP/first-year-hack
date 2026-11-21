// Minimal Snowflake SQL API v2 client: fetch + node:crypto, no driver.
// Auth is a key-pair JWT (service user) or a programmatic access token.
// Run against the team's account on 21 Nov 2026 with key-pair auth (the access-token path is untested);
// re-check with `npm run snowflake:check`.
// API reference: https://docs.snowflake.com/en/developer-guide/sql-api/index

import { createHash, createPrivateKey, createPublicKey, createSign } from 'node:crypto';
import { readFileSync } from 'node:fs';

const b64url = (buf) => Buffer.from(buf).toString('base64url');

export function snowflakeConfigFromEnv(env = process.env) {
  if (!env.SNOWFLAKE_ACCOUNT) return null;
  const cfg = {
    account: env.SNOWFLAKE_ACCOUNT,
    user: env.SNOWFLAKE_USER,
    role: env.SNOWFLAKE_ROLE || 'COMPASS_APP_ROLE',
    warehouse: env.SNOWFLAKE_WAREHOUSE || 'COMPASS_WH',
    database: env.SNOWFLAKE_DATABASE || 'COMPASS_DB',
    schema: env.SNOWFLAKE_SCHEMA || 'APP',
    pat: env.SNOWFLAKE_PAT || null,
    privateKeyPath: env.SNOWFLAKE_PRIVATE_KEY_PATH || null,
  };
  if (!cfg.pat && !cfg.privateKeyPath) {
    throw new Error('SNOWFLAKE_ACCOUNT is set but neither SNOWFLAKE_PRIVATE_KEY_PATH nor SNOWFLAKE_PAT is.');
  }
  return cfg;
}

export function createSnowflakeClient(cfg) {
  const base = `https://${cfg.account}.snowflakecomputing.com/api/v2/statements`;
  let jwt = null; // { token, exp }

  function keyPairJwt() {
    const now = Math.floor(Date.now() / 1000);
    if (jwt && jwt.exp - now > 120) return jwt.token;
    const key = createPrivateKey(readFileSync(cfg.privateKeyPath));
    const spki = createPublicKey(key).export({ type: 'spki', format: 'der' });
    const fp = 'SHA256:' + createHash('sha256').update(spki).digest('base64');
    // In the JWT the account identifier is upper case with "." written as "-".
    const qualified = `${cfg.account.toUpperCase().replaceAll('.', '-')}.${cfg.user.toUpperCase()}`;
    const exp = now + 3300;
    const head = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const body = b64url(JSON.stringify({ iss: `${qualified}.${fp}`, sub: qualified, iat: now, exp }));
    const sig = createSign('RSA-SHA256').update(`${head}.${body}`).sign(key);
    jwt = { token: `${head}.${body}.${b64url(sig)}`, exp };
    return jwt.token;
  }

  function headers() {
    const pat = Boolean(cfg.pat);
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'career-compass/0.1',
      Authorization: `Bearer ${pat ? cfg.pat : keyPairJwt()}`,
      'X-Snowflake-Authorization-Token-Type': pat ? 'PROGRAMMATIC_ACCESS_TOKEN' : 'KEYPAIR_JWT',
    };
  }

  const bindType = (v) =>
    typeof v === 'number' ? (Number.isInteger(v) ? 'FIXED' : 'REAL') : typeof v === 'boolean' ? 'BOOLEAN' : 'TEXT';

  /** Run one statement. `params` fill the `?` placeholders in order. Returns rows as objects. */
  async function query(statement, params = []) {
    const bindings = Object.fromEntries(
      params.map((v, i) => [String(i + 1), { type: bindType(v), value: v === null ? null : String(v) }]),
    );
    const started = Date.now();
    let res = await fetch(base, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({
        statement,
        timeout: 30,
        role: cfg.role,
        warehouse: cfg.warehouse,
        database: cfg.database,
        schema: cfg.schema,
        bindings,
      }),
    });
    let json = await res.json().catch(() => ({}));
    // 202 = still running; poll the statement handle until it finishes.
    while (res.status === 202 && json.statementHandle) {
      await new Promise((r) => setTimeout(r, 250));
      res = await fetch(`${base}/${json.statementHandle}`, { headers: headers() });
      json = await res.json().catch(() => ({}));
    }
    if (!res.ok) {
      throw new Error(`Snowflake ${res.status}: ${json.message ?? 'request failed'} (sqlState ${json.sqlState ?? '?'})`);
    }
    const cols = json.resultSetMetaData?.rowType?.map((c) => c.name) ?? [];
    const rows = (json.data ?? []).map((r) => Object.fromEntries(r.map((v, i) => [cols[i], v])));
    rows.ms = Date.now() - started;
    return rows;
  }

  return { query };
}
