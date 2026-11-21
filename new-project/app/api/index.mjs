// Vercel entry point: every /api/* request is rewritten here (vercel.json)
// and handed to the same (Request) => Response handler server.mjs uses.
// Static files come from public/ and are served by Vercel directly.
//
// Not wired here on purpose: email-code sign-in keeps its codes in process
// memory, which Vercel instances do not share. LinkedIn sign-in's one-time
// handoff is in memory too (lib/api.mjs), so leave LINKEDIN_* unset on Vercel
// until that moves into the store.

import { createAppFromEnv } from '../lib/setup.mjs';

// Same cap as server.mjs (BODY_MAX_BYTES); Vercel's own limit is 4.5 MB.
const BODY_MAX_BYTES = 250_000;
const { api } = await createAppFromEnv();

async function handle(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const declared = Number(request.headers.get('content-length'));
    if (declared > BODY_MAX_BYTES) return tooLarge();
    const body = await request.arrayBuffer();
    if (body.byteLength > BODY_MAX_BYTES) return tooLarge();
    request = new Request(request.url, { method: request.method, headers: request.headers, body });
  }
  return api(request);
}
const tooLarge = () => new Response('{"error":"body too large"}', { status: 413, headers: { 'Content-Type': 'application/json' } });

export const GET = handle;
export const POST = handle;
