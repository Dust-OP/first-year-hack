// Local server: static files from public/ plus the API. No dependencies.
//   node server.mjs            http://localhost:3000
// Phones need HTTPS for location and compass access; see README.md.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApi } from './lib/api.mjs';
import { createMemoryStore } from './lib/store-memory.mjs';
import { createSnowflakeClient, snowflakeConfigFromEnv } from './lib/snowflake.mjs';
import { createSnowflakeStore } from './lib/store-snowflake.mjs';

try { process.loadEnvFile(new URL('./.env', import.meta.url)); } catch { /* no .env: defaults apply */ }

const PUBLIC = resolve(fileURLToPath(new URL('./public', import.meta.url)));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json',
};

const sf = snowflakeConfigFromEnv();
const store = sf ? createSnowflakeStore(createSnowflakeClient(sf)) : createMemoryStore();
const api = createApi({ store, demo: process.env.DEMO !== '0' });

async function serveStatic(pathname, res) {
  const rel = normalize(decodeURIComponent(pathname === '/' ? '/index.html' : pathname));
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

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
    const response = await api(new Request(url, { method: req.method, headers: req.headers, body: hasBody ? Buffer.concat(chunks) : undefined }));
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
    return;
  }
  if (req.method === 'GET' && (await serveStatic(url.pathname, res))) return;
  res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
});

const port = Number(process.env.PORT) || 3000;
server.listen(port, () => console.log(`Career Compass on http://localhost:${port}  (store: ${store.kind})`));
