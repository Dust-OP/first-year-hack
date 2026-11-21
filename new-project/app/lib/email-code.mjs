// Email sign-in with a one-time code, sent by our own server (no Logto).
// Behaves like Logto's email passwordless flow: a 6-digit code, valid for
// 10 minutes, a short wait before another code can be sent.
//
// Where the state lives: in this module's memory, inside the one Node process
// that server.mjs runs. Each code is a record keyed by a random browser key,
// which the browser holds in an HttpOnly cookie (lib/api.mjs sets it). The record
// keeps the address, an HMAC of the code, the expiry and the wrong guesses.
// So a code can only be redeemed by the browser that asked for it, at most
// MAX_TRIES wrong guesses are allowed, and a code works once.
// This is NOT shared between processes: do not turn email-code sign-in on where
// several instances serve the app (serverless hosts). server.mjs is the only
// place that enables it.

import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

const CODE_TTL_MS = 10 * 60_000;
const MAX_TRIES = 5; // wrong codes allowed per code
const RESEND_WAIT_MS = 60_000; // between two codes to the same address
const MAX_PER_ADDRESS_HOUR = 5;
const MAX_PER_CLIENT_HOUR = 10; // one client (IP address) asking for codes to many addresses
const MAX_PER_DAY = 90; // all addresses together: Resend's free plan allows 100 emails a day
const HOUR = 3_600_000, DAY = 24 * HOUR;

/** Lower-cased address, or null when it does not look like one. */
export function normEmail(input) {
  const e = String(input ?? '').trim().toLowerCase();
  return e.length <= 254 && /^[^\s@"<>()[\],;:\\]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e) ? e : null;
}

/** The email itself. The address it goes to is never part of the text. */
export function codeEmail(code, appName) {
  const subject = `${code} is your ${appName} sign-in code`;
  const text = `Your ${appName} sign-in code is ${code}\n\nIt works for 10 minutes. If you did not try to sign in, you can ignore this email.`;
  const html = `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#1d1d1f">
<p style="font-size:15px;margin:0 0 16px">Your ${appName} sign-in code is</p>
<p style="font-size:34px;font-weight:600;letter-spacing:8px;margin:0 0 16px">${code}</p>
<p style="font-size:13px;color:#6e6e73;margin:0">It works for 10 minutes. If you did not try to sign in, you can ignore this email.</p>
</div>`;
  return { subject, text, html };
}

/** Errors carry a fixed sentence for the person and an HTTP status. Nothing from the request is echoed. */
export class CodeError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

/**
 * @param send  async ({ to, subject, text, html }) => void   (lib/mailer.mjs, or a fake in tests)
 */
export function createEmailCode({ send, appName = 'Career Compass', now = () => Date.now(), makeCode, log = console.error }) {
  const key = randomBytes(32); // hashes codes in memory; never leaves the process
  const mac = (browserKey, code) => createHmac('sha256', key).update(`${browserKey}|${code}`).digest();
  const keyId = (browserKey) => createHash('sha256').update(String(browserKey)).digest('hex');
  const newCode = makeCode ?? (() => String(randomInt(0, 1_000_000)).padStart(6, '0'));

  const codes = new Map(); // keyId(browser key) -> { email, mac, expiresMs, tries }
  const byAddress = new Map(); // email -> [send times, last hour]
  const byClient = new Map(); // client -> [send times, last hour]
  let daily = []; // send times, last day

  function prune() {
    const t = now();
    for (const [k, c] of codes) if (c.expiresMs < t) codes.delete(k);
    for (const m of [byAddress, byClient]) {
      for (const [k, list] of m) {
        const kept = list.filter((s) => t - s < HOUR);
        kept.length ? m.set(k, kept) : m.delete(k);
      }
    }
    daily = daily.filter((s) => t - s < DAY);
  }

  return {
    ttlMs: CODE_TTL_MS,
    resendWaitMs: RESEND_WAIT_MS,
    newBrowserKey: () => randomBytes(24).toString('base64url'),

    /**
     * Emails a fresh code for this browser. A browser that asks again replaces its earlier code.
     * Never looks up accounts: the answer is the same whether or not the address has one.
     */
    async start({ email: rawEmail, browserKey, client = 'unknown' }) {
      const email = normEmail(rawEmail);
      if (!email) throw new CodeError('Please enter a valid email address.');
      prune();
      const t = now();
      const mine = byAddress.get(email) ?? [];
      const theirs = byClient.get(client) ?? [];
      if (mine.length && t - mine.at(-1) < RESEND_WAIT_MS) throw new CodeError('Please wait a minute before asking for another code.', 429);
      if (mine.length >= MAX_PER_ADDRESS_HOUR || theirs.length >= MAX_PER_CLIENT_HOUR) throw new CodeError('Too many codes asked for. Please try again later.', 429);
      if (daily.length >= MAX_PER_DAY) throw new CodeError('Sign-in by email is busy today. Please try again later.', 429);

      // Counted before sending, so a slow or failing mail service cannot be used to skip the limits.
      byAddress.set(email, [...mine, t]);
      byClient.set(client, [...theirs, t]);
      daily.push(t);

      const code = newCode();
      try {
        await send({ to: email, ...codeEmail(code, appName) });
      } catch (err) {
        log('[email-code] send failed:', err.message);
        throw new CodeError('The code could not be sent. Please try again in a minute.', 502);
      }
      codes.set(keyId(browserKey), { email, mac: mac(browserKey, code), expiresMs: t + CODE_TTL_MS, tries: 0 });
      return { email, expiresMs: t + CODE_TTL_MS };
    },

    /** Returns the verified address, or throws a CodeError. */
    verify({ browserKey, code: rawCode }) {
      const id = browserKey ? keyId(browserKey) : null;
      const rec = id && codes.get(id);
      if (!rec) throw new CodeError('Please ask for a code first, in this browser.');
      if (now() > rec.expiresMs) {
        codes.delete(id);
        throw new CodeError('This code has expired. Please ask for a new one.');
      }
      const code = String(rawCode ?? '').replace(/\s+/g, '');
      const got = mac(browserKey, /^\d{6}$/.test(code) ? code : 'x');
      if (!timingSafeEqual(rec.mac, got)) {
        rec.tries += 1;
        if (rec.tries >= MAX_TRIES) {
          codes.delete(id);
          throw new CodeError('Too many wrong codes. Please ask for a new one.', 429);
        }
        throw new CodeError('That code is not right. Please check the email and try again.');
      }
      codes.delete(id); // single use
      return rec.email;
    },
  };
}
