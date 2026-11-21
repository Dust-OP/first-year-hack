// Email sign-in with a one-time code, sent by our own server (no Logto).
// Behaves like Logto's email passwordless flow: a 6-digit code, valid for
// 10 minutes, a short wait before another code can be sent.
//
// Each code is a record keyed by a hash of a random browser key, which the
// browser holds in an HttpOnly cookie (lib/api.mjs sets it). The record keeps
// the address, an HMAC of the code keyed by that browser key, the expiry and
// the wrong guesses. So a code can only be redeemed by the browser that asked
// for it, at most MAX_TRIES wrong guesses are allowed, and a code works once.
// Whoever reads the stored records cannot test codes: the browser key is not stored.
//
// Where the state lives (`state`): createMemoryCodeState() below keeps it in
// this process, which is right for the one long-running server.mjs and wrong
// where several instances serve the app. On Vercel it is
// createPostgresCodeState() (lib/email-code-postgres.mjs), shared by every
// instance; lib/setup.mjs makes that choice.

import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

const CODE_TTL_MS = 10 * 60_000;
const MAX_TRIES = 5; // wrong codes allowed per code
const RESEND_WAIT_MS = 60_000; // between two codes to the same address
const MAX_PER_ADDRESS_HOUR = 5;
const MAX_PER_CLIENT_HOUR = 10; // one client (IP address) asking for codes to many addresses
const MAX_PER_DAY = 90; // all addresses together: Resend's free plan allows 100 emails a day
export const HOUR = 3_600_000, DAY = 24 * HOUR;

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
 * The state in this process's memory. Every method is async so the Postgres version
 * (lib/email-code-postgres.mjs) can stand in for it unchanged.
 */
export function createMemoryCodeState() {
  const codes = new Map(); // keyId -> { email, mac, expiresMs, tries }
  let sends = []; // { email, client, t }, last day
  return {
    async prune(t) {
      for (const [k, c] of codes) if (c.expiresMs < t) codes.delete(k);
      sends = sends.filter((x) => t - x.t < DAY);
    },
    async sends({ email, client, t }) {
      const hour = sends.filter((x) => t - x.t < HOUR);
      const mine = hour.filter((x) => x.email === email);
      return {
        lastForAddress: mine.length ? mine.at(-1).t : null,
        addressHour: mine.length,
        clientHour: hour.filter((x) => x.client === client).length,
        day: sends.length,
      };
    },
    async recordSend({ email, client, t }) { sends.push({ email, client, t }); },
    async putCode(id, rec) { codes.set(id, { ...rec }); },
    async getCode(id) { const c = codes.get(id); return c ? { ...c } : null; },
    /** Counts one more wrong guess; returns the new count. */
    async addTry(id) { const c = codes.get(id); if (!c) return Infinity; c.tries += 1; return c.tries; },
    /** Removes the code if its HMAC still matches and returns its address; null if it is already gone. */
    async takeCode(id, mac) { const c = codes.get(id); if (!c || c.mac !== mac) return null; codes.delete(id); return c.email; },
    async dropCode(id) { codes.delete(id); },
  };
}

/**
 * @param send   async ({ to, subject, text, html }) => void   (lib/mailer.mjs, or a fake in tests)
 * @param state  where codes and send times live (createMemoryCodeState, or the Postgres one)
 */
export function createEmailCode({ send, appName = 'Career Compass', now = () => Date.now(), makeCode, log = console.error, state = createMemoryCodeState() }) {
  const mac = (browserKey, code) => createHmac('sha256', String(browserKey)).update(String(code)).digest('hex');
  const keyId = (browserKey) => createHash('sha256').update(String(browserKey)).digest('hex');
  const newCode = makeCode ?? (() => String(randomInt(0, 1_000_000)).padStart(6, '0'));
  const same = (a, b) => a.length === b.length && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));

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
      const t = now();
      await state.prune(t);
      const seen = await state.sends({ email, client, t });
      if (seen.lastForAddress !== null && t - seen.lastForAddress < RESEND_WAIT_MS) throw new CodeError('Please wait a minute before asking for another code.', 429);
      if (seen.addressHour >= MAX_PER_ADDRESS_HOUR || seen.clientHour >= MAX_PER_CLIENT_HOUR) throw new CodeError('Too many codes asked for. Please try again later.', 429);
      if (seen.day >= MAX_PER_DAY) throw new CodeError('Sign-in by email is busy today. Please try again later.', 429);

      // Counted before sending, so a slow or failing mail service cannot be used to skip the limits.
      await state.recordSend({ email, client, t });

      const code = newCode();
      try {
        await send({ to: email, ...codeEmail(code, appName) });
      } catch (err) {
        log('[email-code] send failed:', err.message);
        throw new CodeError('The code could not be sent. Please try again in a minute.', 502);
      }
      await state.putCode(keyId(browserKey), { email, mac: mac(browserKey, code), expiresMs: t + CODE_TTL_MS, tries: 0 });
      return { email, expiresMs: t + CODE_TTL_MS };
    },

    /** Returns the verified address, or throws a CodeError. */
    async verify({ browserKey, code: rawCode }) {
      const id = browserKey ? keyId(browserKey) : null;
      const rec = id && (await state.getCode(id));
      if (!rec) throw new CodeError('Please ask for a code first, in this browser.');
      if (now() > rec.expiresMs) {
        await state.dropCode(id);
        throw new CodeError('This code has expired. Please ask for a new one.');
      }
      const code = String(rawCode ?? '').replace(/\s+/g, '');
      const got = mac(browserKey, /^\d{6}$/.test(code) ? code : 'x');
      if (!same(rec.mac, got)) {
        if ((await state.addTry(id)) >= MAX_TRIES) {
          await state.dropCode(id);
          throw new CodeError('Too many wrong codes. Please ask for a new one.', 429);
        }
        throw new CodeError('That code is not right. Please check the email and try again.');
      }
      const email = await state.takeCode(id, rec.mac); // single use, even when two requests race
      if (!email) throw new CodeError('Please ask for a code first, in this browser.');
      return email;
    },
  };
}
