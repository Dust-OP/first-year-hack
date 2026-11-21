// One command to put the app on real phones:
//   npm run phones
// Phones only share location and compass readings with https pages, and university Wi-Fi usually
// stops one device from reaching another, so http://<laptop address>:3000 is not enough. This starts
// the server and a Cloudflare quick tunnel to it (no account needed), checks that the public https
// address answers, and prints it as a QR code. Ctrl-C stops the server and closes the tunnel.
// While it runs, anyone who has the address can reach this laptop's copy of the app.

import { spawn, spawnSync } from 'node:child_process';
import { promises as dns } from 'node:dns';
import { request } from 'node:https';
import { fileURLToPath } from 'node:url';
import { qrTerminal } from './qr.mjs';

try { process.loadEnvFile(new URL('../.env', import.meta.url)); } catch { /* no .env: defaults apply */ }
const port = Number(process.env.PORT) || 3000;
const appDir = fileURLToPath(new URL('..', import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

if (spawnSync('cloudflared', ['--version'], { stdio: 'ignore' }).error) {
  console.error('cloudflared is not installed. Install it once with:\n\n  brew install cloudflared\n\nthen run `npm run phones` again.');
  process.exit(1);
}

const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const c of children) c.kill('SIGTERM');
  setTimeout(() => process.exit(code), 300);
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

/**
 * Waits until the new address answers, and returns how long that took (ms), or null if it never did.
 * The name is asked for at Cloudflare's own name servers only, never through the ordinary lookup.
 * Seen on 21 Nov 2026: an ordinary lookup made 1 s after the address was printed got "no such name",
 * and this Mac then kept refusing the address for more than three minutes although the name existed
 * by then. Resolvers are allowed to remember a "no" (the zone asks for 60 s), so nothing here may
 * ask one too early.
 */
async function waitUntilItAnswers(url, ms) {
  const host = new URL(url).hostname, started = Date.now();
  try {
    const names = await dns.resolveNs('trycloudflare.com');
    const servers = (await Promise.all(names.map((n) => dns.resolve4(n).catch(() => [])))).flat();
    const atSource = new dns.Resolver({ timeout: 2000, tries: 1 });
    atSource.setServers(servers);
    while (Date.now() - started < ms && !stopping) {
      const [ip] = await atSource.resolve4(host).catch(() => []);
      const ok = ip && await new Promise((resolve) => {
        const req = request({ host: ip, servername: host, path: '/api/health', headers: { Host: host }, timeout: 5000 }, (res) => { res.resume(); resolve(res.statusCode === 200); });
        req.on('timeout', () => req.destroy());
        req.on('error', () => resolve(false));
        req.end();
      });
      if (ok) return Date.now() - started;
      await sleep(1000);
    }
  } catch { /* name servers not reachable from this network: the address cannot be checked from here */ }
  return null;
}

console.log('Opening an https tunnel…');
const tunnel = spawn('cloudflared', ['tunnel', '--no-autoupdate', '--url', `http://localhost:${port}`], { stdio: ['ignore', 'ignore', 'pipe'] });
children.push(tunnel);
let log = '';
tunnel.stderr.on('data', (chunk) => { log += chunk; });
tunnel.on('exit', (code) => {
  if (stopping) return;
  console.error(`${log.split('\n').slice(-6).join('\n')}\nThe tunnel closed (cloudflared exit ${code}).`);
  stop(1);
});
/** cloudflared logs the address it was given, then a line for its connection to Cloudflare. */
async function logged(pattern, ms) {
  for (const until = Date.now() + ms; Date.now() < until && !stopping; await sleep(200)) {
    const m = log.match(pattern);
    if (m) return m[0];
  }
  return null;
}

const url = await logged(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/, 45_000);
if (!url) {
  if (!stopping) console.error('No tunnel address after 45 s. Check the internet connection and try again.');
  stop(1);
} else {
  // The server is told its public address, so that sign-in redirects point at it.
  const server = spawn(process.execPath, ['server.mjs'], { cwd: appDir, stdio: 'inherit', env: { ...process.env, PORT: String(port), PUBLIC_URL: url } });
  children.push(server);
  server.on('exit', (code) => { if (!stopping) { console.error(`The server stopped (exit ${code}). Is port ${port} already in use?`); stop(1); } });

  const connected = await logged(/Registered tunnel connection/, 30_000);
  // The code is shown only once the address really answers: a phone that tries too early is told
  // "no such site" and can keep believing that for a while.
  const took = connected ? await waitUntilItAnswers(url, 60_000) : null;
  if (!stopping) {
    console.log(`\n${qrTerminal(url)}\n\n  ${url}\n`);
    console.log(took !== null ? `Checked from this laptop: the address answers (after ${(took / 1000).toFixed(0)} s). Scan the code with each phone’s camera, or type the address.`
      : connected ? 'The tunnel is connected, but the address could not be checked from this laptop. Wait half a minute before scanning: a phone that tries too early may refuse the address for a while.'
        : 'cloudflared has not connected to Cloudflare (some networks block it). The address will probably not work.');
    console.log('Open it in Safari (iPhone) or Chrome (Android) itself, not inside another app, and allow location and motion.');
    if (process.env.LINKEDIN_CLIENT_ID && !process.env.LINKEDIN_MOCK_URL) console.log(`LinkedIn sign-in from this address needs this redirect URL in the LinkedIn app (Auth tab):\n  ${url}/api/linkedin/callback`);
    if (process.env.LOGTO_APP_ID) console.log(`Email sign-in from this address needs these in the Logto app: redirect URI ${url}/callback, post sign-out redirect URI ${url}`);
    console.log('The address is new every time this command runs. Ctrl-C stops the server and closes the tunnel.');
  }
}
