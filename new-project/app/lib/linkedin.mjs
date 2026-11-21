// Sign in with LinkedIn (OpenID Connect), server side.
// LinkedIn's token endpoint requires the client secret and LinkedIn offers PKCE
// to native apps only, so unlike the Logto flow (public/auth.js, done in the
// browser) the code exchange happens here and the secret never leaves the server.
// Endpoints, scopes and fields were checked against LinkedIn's documentation on
// 21 Nov 2026: ../../findings/linkedin-integration/RESULT.md.
// NOT YET RUN against the real LinkedIn: only against dev/mock-linkedin.mjs.

const REAL = {
  authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  userinfoUrl: 'https://api.linkedin.com/v2/userinfo',
};
const MAX_PICTURE_BYTES = 2_000_000;

export function linkedinConfigFromEnv(env = process.env) {
  const clientId = env.LINKEDIN_CLIENT_ID, clientSecret = env.LINKEDIN_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    if (clientId || clientSecret) console.warn('LinkedIn sign-in is off: set both LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET.');
    return null;
  }
  // LINKEDIN_MOCK_URL swaps LinkedIn for the local stand-in (same paths). Local testing only.
  const mock = (env.LINKEDIN_MOCK_URL || '').replace(/\/+$/, '') || null;
  const urls = mock
    ? { authorizeUrl: `${mock}/oauth/v2/authorization`, tokenUrl: `${mock}/oauth/v2/accessToken`, userinfoUrl: `${mock}/v2/userinfo` }
    : REAL;
  return { clientId, clientSecret, mock, ...urls };
}

const text = (v, max) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '') || null;

/**
 * What we keep from LinkedIn's userinfo answer. Typed fields for querying, plus the raw claims.
 * `email` and `email_verified` are optional in LinkedIn's schema. `locale` is documented as text
 * ("en-US") but has been reported as an object ({ language, country }), so both are read.
 */
export function linkedinRecord(claims, { allowHttpFrom = null } = {}) {
  const loc = claims.locale;
  const locale = typeof loc === 'string' ? text(loc, 20) : loc?.language ? text([loc.language, loc.country].filter(Boolean).join('-'), 20) : null;
  let picture = null;
  try {
    const u = new URL(claims.picture);
    // Our server fetches this address to show the picture to other people: https only.
    if (u.protocol === 'https:' || (allowHttpFrom && u.href.startsWith(allowHttpFrom + '/'))) picture = u.href.slice(0, 2000);
  } catch { /* no usable picture */ }
  return {
    sub: String(claims.sub),
    name: text(claims.name, 120),
    givenName: text(claims.given_name, 60),
    familyName: text(claims.family_name, 60),
    email: text(claims.email, 200),
    emailVerified: typeof claims.email_verified === 'boolean' ? claims.email_verified : null,
    picture,
    locale,
    claims,
  };
}

export function createLinkedin(cfg, { fetch = globalThis.fetch } = {}) {
  const read = async (res) => { try { return await res.json(); } catch { return {}; } };

  return {
    mock: cfg.mock,

    /** Where to send the browser. `state` comes back on the callback and must match what we set. */
    authorizeUrl({ redirectUri, state }) {
      const q = new URLSearchParams({ response_type: 'code', client_id: cfg.clientId, redirect_uri: redirectUri, state, scope: 'openid profile email' });
      return `${cfg.authorizeUrl}?${q.toString().replace(/\+/g, '%20')}`; // LinkedIn's examples write the spaces as %20
    },

    /** Swap the one-time code for the member's record. Throws with a short reason fit to show. */
    async memberFor({ code, redirectUri }) {
      const tokenRes = await fetch(cfg.tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code, client_id: cfg.clientId, client_secret: cfg.clientSecret, redirect_uri: redirectUri }),
        signal: AbortSignal.timeout(10_000),
      });
      const token = await read(tokenRes);
      if (!tokenRes.ok || !token.access_token) throw new Error(`LinkedIn did not accept the sign-in (${text(token.error, 60) ?? tokenRes.status})`);

      // The access token is used once, here, and is not stored.
      const infoRes = await fetch(cfg.userinfoUrl, {
        headers: { Authorization: `Bearer ${token.access_token}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });
      const claims = await read(infoRes);
      if (!infoRes.ok || !claims.sub) throw new Error(`LinkedIn did not return a profile (${infoRes.status})`);
      return linkedinRecord(claims, { allowHttpFrom: cfg.mock });
    },

    /**
     * Fetch a member's picture so we can pass it on from our own origin. Nothing is kept.
     * Returns { type, bytes }, or null when LinkedIn no longer serves it (the caller shows initials).
     */
    async picture(url) {
      try {
        const res = await fetch(url, { headers: { Accept: 'image/*' }, signal: AbortSignal.timeout(4_000) });
        const type = (res.headers.get('content-type') ?? '').split(';')[0].trim();
        if (!res.ok || !type.startsWith('image/')) return null;
        const bytes = Buffer.from(await res.arrayBuffer());
        return bytes.length > 0 && bytes.length <= MAX_PICTURE_BYTES ? { type, bytes } : null;
      } catch {
        return null;
      }
    },
  };
}
