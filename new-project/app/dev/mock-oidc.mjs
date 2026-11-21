// A stand-in for Logto, for tests and for trying the sign-in flow offline.
// It speaks just enough OpenID Connect (code + PKCE, ES384 ID tokens, JWKS)
// to exercise our real client and server code. Never use it in production:
// it "signs in" whatever email is typed, with no code sent.
//
//   node dev/mock-oidc.mjs             listens on http://localhost:3299
//   LOGTO_ENDPOINT=http://localhost:3299 LOGTO_APP_ID=mock-app npm start

import { createHash, generateKeyPairSync, randomBytes, sign } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';

const b64url = (v) => Buffer.from(v).toString('base64url');

export function createMockOidc({ issuer, appId = 'mock-app', now = () => Date.now() }) {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'P-384' });
  const kid = 'mock-key-1';
  const jwks = { keys: [{ ...publicKey.export({ format: 'jwk' }), kid, alg: 'ES384', use: 'sig' }] };
  const codes = new Map();

  function idToken(claims, { key = privateKey, header = {} } = {}) {
    const iat = Math.floor(now() / 1000);
    const head = b64url(JSON.stringify({ alg: 'ES384', typ: 'JWT', kid, ...header }));
    const body = b64url(JSON.stringify({ iss: issuer, aud: appId, iat, exp: iat + 3600, ...claims }));
    const sig = sign('sha384', Buffer.from(`${head}.${body}`), { key, dsaEncoding: 'ieee-p1363' });
    return `${head}.${body}.${b64url(sig)}`;
  }

  async function handle(req, res) {
    const url = new URL(req.url, issuer);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type' };
    const send = (status, body, headers = {}) => { res.writeHead(status, { ...cors, ...headers }); res.end(body); };
    const sendJson = (status, body) => send(status, JSON.stringify(body), { 'Content-Type': 'application/json' });
    if (req.method === 'OPTIONS') return send(204, '');

    if (url.pathname === '/oidc/jwks') return sendJson(200, jwks);

    if (url.pathname === '/oidc/auth') {
      const q = url.searchParams;
      if (q.get('client_id') !== appId || q.get('code_challenge_method') !== 'S256' || !q.get('code_challenge')) return send(400, 'bad request');
      if (!q.get('email')) {
        const hidden = [...q].map(([k, v]) => `<input type="hidden" name="${k}" value="${v.replace(/"/g, '&quot;')}">`).join('');
        return send(200, `<!doctype html><title>Mock sign-in</title><body style="font:18px system-ui;padding:24px">
          <h1>Mock sign-in</h1><p>Stand-in for Logto. No code is sent.</p>
          <form method="get" action="/oidc/auth">${hidden}<input name="email" type="email" placeholder="you@example.com" required>
          <button type="submit">Continue</button></form>`, { 'Content-Type': 'text/html; charset=utf-8' });
      }
      const code = randomBytes(12).toString('hex');
      codes.set(code, { challenge: q.get('code_challenge'), nonce: q.get('nonce'), redirect: q.get('redirect_uri'), email: q.get('email') });
      const back = new URL(q.get('redirect_uri'));
      back.searchParams.set('code', code);
      back.searchParams.set('state', q.get('state') ?? '');
      return send(302, '', { Location: back.href });
    }

    if (url.pathname === '/oidc/token' && req.method === 'POST') {
      let raw = '';
      for await (const c of req) raw += c;
      const f = new URLSearchParams(raw);
      const grant = codes.get(f.get('code'));
      codes.delete(f.get('code'));
      const pkceOk = grant && b64url(createHash('sha256').update(f.get('code_verifier') ?? '').digest()) === grant.challenge;
      if (!pkceOk || f.get('redirect_uri') !== grant.redirect || f.get('client_id') !== appId) return sendJson(400, { error: 'invalid_grant' });
      const sub = 'mock-' + createHash('sha256').update(grant.email).digest('hex').slice(0, 12);
      return sendJson(200, { token_type: 'Bearer', expires_in: 3600, id_token: idToken({ sub, email: grant.email, email_verified: true, nonce: grant.nonce }) });
    }

    if (url.pathname === '/oidc/session/end') return send(302, '', { Location: url.searchParams.get('post_logout_redirect_uri') ?? '/' });
    return send(404, 'not found');
  }

  return { appId, issuer, jwks, idToken, handle, listen: (port) => createServer(handle).listen(port) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.env.MOCK_OIDC_PORT) || 3299;
  createMockOidc({ issuer: `http://localhost:${port}/oidc` }).listen(port);
  console.log(`Mock sign-in server on http://localhost:${port} (app id: mock-app). For local testing only.`);
}
