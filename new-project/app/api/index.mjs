// Vercel entry point: every /api/* request is rewritten here (vercel.json)
// and handed to the same (Request) => Response handler server.mjs uses.
// Static files come from public/ and are served by Vercel directly.
//
// Email-code sign-in (RESEND_API_KEY) is on only with a database: its codes and
// send limits then live in Postgres, shared by every instance (lib/setup.mjs).
// LinkedIn sign-in's one-time handoff is still in process memory (lib/api.mjs),
// so leave LINKEDIN_* unset on Vercel until that moves into the store.

import { createAppFromEnv } from '../lib/setup.mjs';

// Same cap as server.mjs (BODY_MAX_BYTES); Vercel's own limit is 4.5 MB.
const BODY_MAX_BYTES = 250_000;
const { api } = await createAppFromEnv(process.env, { shared: true });

/** The visitor's IP address, for the email-code send limits. Vercel sets these headers itself. */
const clientOf = (request) =>
  request.headers.get('x-real-ip') || String(request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'unknown';

async function handle(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const declared = Number(request.headers.get('content-length'));
    if (declared > BODY_MAX_BYTES) return tooLarge();
    const body = await request.arrayBuffer();
    if (body.byteLength > BODY_MAX_BYTES) return tooLarge();
    request = new Request(request.url, { method: request.method, headers: request.headers, body });
  }
  return api(request, { client: clientOf(request) });
}
const tooLarge = () => new Response('{"error":"body too large"}', { status: 413, headers: { 'Content-Type': 'application/json' } });

export const GET = handle;
export const POST = handle;
