// Run on the team's isolated enrollment display. Needs only the endpoint and one-time code.
import { createInterface } from 'node:readline/promises';
import { chromium } from 'playwright-core';
const url = new URL('/enroll', process.env.CONNECTION_WORKER_URL);
if (url.protocol !== 'https:' && !(url.protocol === 'http:' && url.hostname === '127.0.0.1')) throw new Error('Use HTTPS or loopback.');
const terminal = createInterface({ input: process.stdin, output: process.stdout });
let browser;
try {
  const code = (await terminal.question('Enter your pairing code from Compass: ')).trim();
  browser = await chromium.launch({ chromiumSandbox: true, executablePath: process.env.CONNECTION_CHROME || undefined, headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.linkedin.com/login');
  await terminal.question('Sign in on the private display. Confirm this is your own LinkedIn account and press Enter to link it. ');
  const cookies = await context.cookies('https://www.linkedin.com/');
  if (!cookies.some(c => c.name === 'li_at')) throw new Error('Sign-in incomplete.');
  const res = await fetch(url, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code, cookies }),
  });
  if (!res.ok) throw new Error('Enrollment failed. Request a new pairing code and try again.');
  console.log('LinkedIn session linked.');
} finally { await browser?.close(); terminal.close(); }
