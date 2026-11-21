// A stand-in for LinkedIn's "Sign In with LinkedIn using OpenID Connect", for tests and for
// trying the flow before the team has a LinkedIn developer app. It answers on the same paths
// with the same parameters, fields and error names as LinkedIn's documentation describes
// (see ../../findings/linkedin-integration/RESULT.md), which is all our code depends on.
// It is NOT LinkedIn: it "signs in" whatever name is typed, and no real account is involved.
// Never use it in production.
//
//   npm run mock-linkedin              listens on http://localhost:3298
//   LINKEDIN_MOCK_URL=http://localhost:3298 LINKEDIN_CLIENT_ID=mock-linkedin-app LINKEDIN_CLIENT_SECRET=mock-secret npm start

import { createHash, randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * @param base       where the stand-in is reachable, e.g. http://localhost:3298
 * @param localeAs   'text' answers "en-GB" as LinkedIn's schema says; 'object' answers { country, language }
 */
export function createMockLinkedin({ base, clientId = 'mock-linkedin-app', clientSecret = 'mock-secret', localeAs = 'text' }) {
  const codes = new Map(); // one-time code -> { redirectUri, member }
  const tokens = new Map(); // access token -> member

  const member = (name, email) => {
    const [given, ...rest] = name.trim().split(/\s+/);
    const sub = createHash('sha256').update(email || name).digest('base64url').slice(0, 10);
    return {
      sub, name: name.trim(), given_name: given, family_name: rest.join(' '),
      picture: `${base}/picture/${sub}.svg`,
      locale: localeAs === 'object' ? { country: 'GB', language: 'en' } : 'en-GB',
      ...(email ? { email, email_verified: true } : {}), // both are optional in LinkedIn's schema
    };
  };

  /** Web-standard handler, so tests can call it without opening a port. */
  async function handle(request) {
    const url = new URL(request.url);
    const q = url.searchParams;

    if (url.pathname === '/oauth/v2/authorization' && request.method === 'GET') {
      if (q.get('response_type') !== 'code' || q.get('client_id') !== clientId || !q.get('redirect_uri')) return new Response('Mock LinkedIn: bad client_id, response_type or redirect_uri.', { status: 401 });
      if (!(q.get('scope') ?? '').split(' ').includes('openid')) return new Response('Mock LinkedIn: scope must include openid.', { status: 401 });
      const back = new URL(q.get('redirect_uri'));
      if (q.has('state')) back.searchParams.set('state', q.get('state'));

      if (!q.get('decision')) {
        const hidden = [...q].map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`).join('');
        return new Response(`<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><title>Mock LinkedIn sign-in</title>
          <body style="font:18px system-ui;padding:24px;max-width:28em;margin:auto">
          <h1>Mock LinkedIn sign-in</h1>
          <p>This is a local stand-in, not LinkedIn. No real account is involved and nothing is sent anywhere.</p>
          <form method="get" action="/oauth/v2/authorization" style="display:grid;gap:12px">${hidden}
            <label>Full name <input name="name" value="Ada Lovelace" required style="font:inherit;width:100%"></label>
            <label>Email (leave empty to test a member with no email) <input name="email" type="email" value="ada@example.com" style="font:inherit;width:100%"></label>
            <button name="decision" value="allow" style="font:inherit;padding:10px">Allow</button>
            <button name="decision" value="cancel" formnovalidate style="font:inherit;padding:10px">Cancel</button>
          </form>`, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
      if (q.get('decision') !== 'allow') {
        back.searchParams.set('error', 'user_cancelled_authorize');
        back.searchParams.set('error_description', 'The user cancelled the authorization');
      } else {
        const code = randomBytes(16).toString('base64url');
        codes.set(code, { redirectUri: q.get('redirect_uri'), member: member(q.get('name') || 'Mock Member', q.get('email') ?? '') });
        back.searchParams.set('code', code);
      }
      return new Response(null, { status: 302, headers: { Location: back.href } });
    }

    if (url.pathname === '/oauth/v2/accessToken' && request.method === 'POST') {
      const f = new URLSearchParams(await request.text());
      for (const name of ['grant_type', 'code', 'client_id', 'client_secret', 'redirect_uri']) {
        if (!f.get(name)) return json(400, { error: 'invalid_request', error_description: `A required parameter "${name}" is missing` });
      }
      if (f.get('client_id') !== clientId || f.get('client_secret') !== clientSecret) return json(401, { error: 'invalid_client', error_description: 'Client authentication failed' });
      const grant = codes.get(f.get('code'));
      codes.delete(f.get('code')); // single use
      if (!grant) return json(401, { error: 'invalid_request', error_description: 'Unable to retrieve access token: authorization code not found' });
      if (grant.redirectUri !== f.get('redirect_uri')) return json(400, { error: 'invalid_redirect_uri', error_description: 'Unable to retrieve access token: appid/redirect uri/code verifier does not match authorization code. Or authorization code expired. Or external member binding exists' });
      const accessToken = randomBytes(32).toString('base64url');
      tokens.set(accessToken, grant.member);
      return json(200, { access_token: accessToken, expires_in: 5184000, scope: 'email,openid,profile', token_type: 'Bearer' });
    }

    if (url.pathname === '/v2/userinfo' && request.method === 'GET') {
      const bearer = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
      // This first answer is what api.linkedin.com itself gave to a request with no token on 21 Nov 2026.
      // The wording of the second one is from memory.
      if (!bearer) return json(401, { status: 401, serviceErrorCode: 65604, code: 'EMPTY_ACCESS_TOKEN', message: 'Empty oauth2 access token' });
      const m = tokens.get(bearer);
      return m ? json(200, m) : json(401, { status: 401, serviceErrorCode: 65600, code: 'INVALID_ACCESS_TOKEN', message: 'Invalid access token' });
    }

    // A drawn placeholder face, so the picture path can be seen working without anyone's real photo.
    const pic = /^\/picture\/([\w-]+)\.svg$/.exec(url.pathname);
    if (pic) {
      const hue = parseInt(createHash('sha256').update(pic[1]).digest('hex').slice(0, 4), 16) % 360;
      return new Response(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="200" height="200"><rect width="100" height="100" fill="hsl(${hue} 45% 82%)"/>`
        + `<circle cx="50" cy="40" r="18" fill="hsl(${hue} 35% 38%)"/><path d="M14 100c2-26 18-38 36-38s34 12 36 38z" fill="hsl(${hue} 35% 38%)"/>`
        + `<text x="50" y="96" text-anchor="middle" font-family="system-ui,sans-serif" font-size="9" fill="#fff">mock picture</text></svg>`,
        { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'max-age=300' } },
      );
    }
    return new Response('not found', { status: 404 });
  }

  /** `fetch` look-alike for our LinkedIn client in tests. */
  const fetch = (input, init) => handle(new Request(input, init));

  function listen(port) {
    return createServer(async (req, res) => {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
      const response = await handle(new Request(new URL(req.url, base), { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined }));
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    }).listen(port);
  }

  return { base, clientId, clientSecret, handle, fetch, listen };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.MOCK_LINKEDIN_PORT) || 3298;
  const base = `http://localhost:${port}`;
  const mock = createMockLinkedin({ base, localeAs: process.env.MOCK_LINKEDIN_LOCALE === 'object' ? 'object' : 'text' });
  mock.listen(port);
  console.log(`Mock LinkedIn on ${base}. A stand-in for local testing only: not LinkedIn, no real accounts.`);
  console.log(`Start the app with:\n  LINKEDIN_MOCK_URL=${base} LINKEDIN_CLIENT_ID=${mock.clientId} LINKEDIN_CLIENT_SECRET=${mock.clientSecret} npm start`);
}
