// Sends email through Resend's HTTP API. No SDK.
// RESEND_API_KEY: a "Sending access" key limited to the app's domain.
// MAIL_FROM: e.g. "Wayrise <hello@wayrise.app>"; the domain must be verified in Resend.

export function mailerConfigFromEnv(env = process.env) {
  if (!env.RESEND_API_KEY) return null;
  return { apiKey: env.RESEND_API_KEY, from: env.MAIL_FROM || 'Wayrise <hello@wayrise.app>' };
}

export function createResendMailer({ apiKey, from, fetchImpl = fetch }) {
  return async function send({ to, subject, text, html }) {
    const res = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || `mail service answered ${res.status}`);
    }
  };
}
