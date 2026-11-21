// Logto sign-in, server side: check the ID token a browser got from Logto.
// The browser does the OIDC code + PKCE exchange itself (public/auth.js) and
// hands us the ID token once; we verify it and issue our own session token.
// No SDK: node:crypto verifies the signature against Logto's published keys.

import { createPublicKey, verify } from 'node:crypto';

export function logtoConfigFromEnv(env = process.env) {
  if (!env.LOGTO_APP_ID) return null;
  const endpoint = (env.LOGTO_ENDPOINT || 'https://auth.dustpowered.studio').replace(/\/+$/, '');
  return { endpoint, appId: env.LOGTO_APP_ID, issuer: `${endpoint}/oidc`, jwksUri: `${endpoint}/oidc/jwks` };
}

// Asymmetric algorithms only. Logto signs with ES384 by default.
const ALGS = { ES256: ['EC', 'sha256'], ES384: ['EC', 'sha384'], ES512: ['EC', 'sha512'], RS256: ['RSA', 'sha256'] };
const part = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));

export function createIdTokenVerifier(cfg, { fetch = globalThis.fetch, now = () => Date.now() } = {}) {
  let keys = new Map();
  let fetchedAt = -Infinity;

  async function keyFor(kid) {
    // Unknown key id: Logto may have rotated its keys. Re-read them, at most once a minute.
    if (!keys.has(kid) && now() - fetchedAt > 60_000) {
      const res = await fetch(cfg.jwksUri);
      if (!res.ok) throw new Error('could not read the sign-in keys');
      keys = new Map((await res.json()).keys.map((k) => [k.kid, k]));
      fetchedAt = now();
    }
    return keys.get(kid);
  }

  /** Returns the token's claims, or throws with a short reason. */
  return async function verifyIdToken(token) {
    const parts = String(token ?? '').split('.');
    if (parts.length !== 3) throw new Error('malformed token');
    let header, claims;
    try { header = part(parts[0]); claims = part(parts[1]); } catch { throw new Error('malformed token'); }

    const alg = ALGS[header.alg];
    if (!alg) throw new Error('unsupported signing algorithm');
    const jwk = await keyFor(header.kid);
    if (!jwk || jwk.kty !== alg[0] || (jwk.alg && jwk.alg !== header.alg)) throw new Error('unknown signing key');
    const key = createPublicKey({ key: jwk, format: 'jwk' });
    const signed = Buffer.from(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], 'base64url');
    // JWTs carry EC signatures as raw r||s, not DER.
    const ok = verify(alg[1], signed, alg[0] === 'EC' ? { key, dsaEncoding: 'ieee-p1363' } : key, signature);
    if (!ok) throw new Error('bad signature');

    const t = now() / 1000;
    if (claims.iss !== cfg.issuer) throw new Error('wrong issuer');
    if (![].concat(claims.aud).includes(cfg.appId)) throw new Error('issued for a different app');
    if (!(claims.exp > t - 30)) throw new Error('expired');
    // A sign-in hands the token over within seconds; an old one is a replay.
    if (!(claims.iat > t - 600)) throw new Error('too old, please sign in again');
    if (!claims.sub) throw new Error('no user id');
    return claims;
  };
}
