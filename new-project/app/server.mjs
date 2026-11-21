// Local server: static files from public/ plus the API. No dependencies.
//   node server.mjs            http://localhost:3000
// Phones need HTTPS for location and compass access: `npm run phones` (dev/phones.mjs).

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAppFromEnv } from './lib/setup.mjs';

try { process.loadEnvFile(new URL('./.env', import.meta.url)); } catch { /* no .env: defaults apply */ }

const PUBLIC = resolve(fileURLToPath(new URL('./public', import.meta.url)));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

const { api, store, logto, linkedinCfg } = await createAppFromEnv();

async function serveStatic(pathname, res) {
  // /callback is where Logto sends the browser back after sign-in; the page itself finishes the job.
  const rel = normalize(decodeURIComponent(pathname === '/' || pathname === '/callback' ? '/index.html' : pathname));
  const file = join(PUBLIC, rel);
  if (file !== PUBLIC && !file.startsWith(PUBLIC + sep)) return false;
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

// The most we read of one request body. The API itself takes at most 200,000 characters
// (PROFILE_BODY_MAX in lib/api.mjs: a profile with a 150,000-character photo), so this is just above it.
const BODY_MAX_BYTES = 250_000;

const server = createServer((req, res) => {
  // Anyone can send anything. One request we cannot make sense of (a bad %-escape, a TRACE, an odd
  // Host, a client that hangs up half way) gets "400" and must never take the server down.
  handle(req, res).catch((err) => {
    console.error(`[server] ${req.method} ${req.url}: ${err?.message ?? err}`);
    if (res.headersSent) res.end(); // an answer was already on its way: finish it and add nothing
    else res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Bad request');
  });
});

async function handle(req, res) {
  // Behind an HTTPS tunnel the request reaches us as plain http; the tunnel says what the browser used.
  const proto = String(req.headers['x-forwarded-proto'] ?? 'http').split(',')[0].trim() === 'https' ? 'https' : 'http';
  const base = new URL(`${proto}://${req.headers.host ?? 'localhost'}`);
  // The path must never choose the host: "//evil.example/api/..." would otherwise become this request's
  // origin, and the LinkedIn redirects are built from that origin.
  const url = new URL(req.url.replace(/^[/\\]+/, '/'), base);
  if (url.origin !== base.origin) throw new Error('request target names another host');
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    let size = 0;
    for await (const c of req) {
      size += c.length;
      // Stop reading here, not after the whole upload is in memory.
      if (size > BODY_MAX_BYTES) {
        res.writeHead(413, { 'Content-Type': 'application/json', Connection: 'close' });
        res.end('{"error":"body too large"}', () => req.destroy());
        return;
      }
      chunks.push(c);
    }
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const response = await api(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  if (req.method === 'GET' && (await serveStatic(url.pathname, res))) return;
  res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
}

const port = Number(process.env.PORT) || 3000;
const signIn = [
  linkedinCfg && (linkedinCfg.mock ? `LinkedIn STAND-IN at ${linkedinCfg.mock}` : 'LinkedIn'),
  logto && `Logto at ${logto.endpoint}`,
].filter(Boolean).join(' + ') || 'quick sign-up only';
server.listen(port, () => {
  console.log(`Career Compass on http://localhost:${port}  (store: ${store.kind}, sign-in: ${signIn})`);
  if (!process.env.PUBLIC_URL) console.log('Phones only share location over https: run `npm run phones` for an https address and a QR code.');
});
