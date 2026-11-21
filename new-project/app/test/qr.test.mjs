import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { qrMatrix, qrTerminal } from '../dev/qr.mjs';

test('QR code for the phone address: right size, and unchanged from the one a real reader decoded', () => {
  const url = 'https://four-random-words-here.trycloudflare.com';
  const m = qrMatrix(url);
  assert.equal(m.length, 29, 'version 3');
  assert.ok(m.every((row) => row.length === 29));
  // The three finder patterns: a dark 3x3 core inside a light ring inside a dark ring.
  for (const [x, y] of [[3, 3], [25, 3], [3, 25]]) assert.deepEqual([m[y][x], m[y][x + 2], m[y][x + 3]], [true, false, true]);
  // This exact symbol was decoded back to the address by macOS's QR reader on 21 Nov 2026.
  // If the writer changes, decode the new output with a real reader before updating the hash.
  const picture = m.map((row) => row.map(Number).join('')).join('\n');
  assert.equal(createHash('sha256').update(picture).digest('hex'), 'fcf7fd2f0a8a0ac1d61c862e5d1479a9d33b2fc00b37197ccb8e79784a452f7a');
  assert.equal(qrMatrix('https://a.co').length, 21);
  assert.throws(() => qrMatrix('x'.repeat(107)), /too long/);
  assert.equal(qrTerminal(url).split('\n').length, Math.ceil((29 + 8) / 2));
});
