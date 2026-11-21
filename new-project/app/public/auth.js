// Sign-in with Logto from the browser: OpenID Connect authorization code + PKCE.
// No SDK. The browser is sent to Logto, which emails the one-time code and
// sends the browser back to /callback; we swap the code for an ID token and
// hand that to our own server (POST /api/session), which verifies it.

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const random = (n) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const KEY = 'cc.signin';
const SIGNIN_FAILED = 'Sign-in did not complete. Please try again.';

export function createLogto({ endpoint, appId }) {
  const redirectUri = `${location.origin}/callback`;

  return {
    /** True when Logto has just sent the browser back to us. */
    get returning() {
      return location.pathname === '/callback';
    },

    async signIn() {
      const verifier = random(48), state = random(16), nonce = random(16);
      const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      sessionStorage.setItem(KEY, JSON.stringify({ verifier, state, nonce }));
      location.assign(`${endpoint}/oidc/auth?` + new URLSearchParams({
        client_id: appId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid profile email',
        code_challenge: challenge, code_challenge_method: 'S256', state, nonce,
      }));
    },

    /** Call on /callback. Returns the ID token, or throws with a message fit to show. */
    async finishSignIn() {
      const q = new URLSearchParams(location.search);
      const saved = JSON.parse(sessionStorage.getItem(KEY) || 'null');
      sessionStorage.removeItem(KEY);
      history.replaceState(null, '', '/'); // the code is single-use: take it out of the address bar
      // Anyone can write a link to /callback with any `error_description`, so that text is never shown.
      if (q.get('error')) throw new Error(SIGNIN_FAILED);
      // `state` proves this return belongs to the sign-in this browser started.
      if (!saved || !q.get('code') || q.get('state') !== saved.state) throw new Error('Sign-in was interrupted. Please try again.');

      const res = await fetch(`${endpoint}/oidc/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'authorization_code', code: q.get('code'), redirect_uri: redirectUri, client_id: appId, code_verifier: saved.verifier }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.id_token) throw new Error(data.error_description || 'Sign-in did not complete. Please try again.');
      const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data.id_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))));
      // `nonce` proves the token was minted for this sign-in and not replayed from another.
      if (claims.nonce !== saved.nonce) throw new Error('Sign-in could not be confirmed. Please try again.');
      return data.id_token;
    },

    /** Where to send the browser to end the Logto session too, so the next person can sign in as themselves. */
    signOutUrl() {
      return `${endpoint}/oidc/session/end?` + new URLSearchParams({ client_id: appId, post_logout_redirect_uri: location.origin });
    },
  };
}

/**
 * Why a LinkedIn sign-in did not finish. The server (lib/api.mjs, /api/linkedin/callback) puts one
 * of these codes in /#linkedin_error=; the sentences are ours. Anyone can write a link with anything
 * after the "=", so whatever is not a code from this list gets the general sentence and is never shown.
 */
const LINKEDIN_ERRORS = new Map([
  ['cancelled', 'You cancelled the LinkedIn sign-in.'],
  ['failed', 'LinkedIn did not complete the sign-in. Please try again.'],
  ['interrupted', 'Sign-in was interrupted. Please try again.'],
  ['refused', 'LinkedIn did not accept the sign-in. Please try again.'],
  ['no_profile', 'LinkedIn did not return a profile. Please try again.'],
]);

/**
 * Sign in with LinkedIn. LinkedIn's code exchange needs a client secret, so our server does it
 * (lib/linkedin.mjs) and the page has only two small jobs: start the trip, and on the way back
 * pick up the one-time handoff code the server left in the URL fragment.
 */
export const linkedin = {
  signIn() {
    location.assign('/api/linkedin/start');
  },
  /**
   * `{ code }` or `{ error }` when the server has just sent the browser back from LinkedIn, else null.
   * `error` is always one of our own sentences, fit to show.
   */
  takeReturn() {
    const q = new URLSearchParams(location.hash.slice(1));
    if (!q.has('linkedin') && !q.has('linkedin_error')) return null;
    history.replaceState(null, '', location.pathname + location.search); // single use: take it out of the address bar
    return q.has('linkedin') ? { code: q.get('linkedin') } : { error: LINKEDIN_ERRORS.get(q.get('linkedin_error')) ?? SIGNIN_FAILED };
  },
};
