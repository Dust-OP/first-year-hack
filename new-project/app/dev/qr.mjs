// A small QR code writer for the terminal, so `npm run phones` can show the address to scan.
// No dependencies. Byte mode, error correction level L, versions 1-5 (up to 106 bytes), which
// covers any tunnel address. Written from the QR specification (ISO/IEC 18004); the output was
// checked by decoding it with macOS's own QR reader (see app/README.md).

// [data codewords, error correction codewords] per version at level L. Up to version 5 it is one block.
const SIZES = [null, [19, 7], [34, 10], [55, 15], [80, 20], [108, 26]];

// GF(256) arithmetic for Reed-Solomon, primitive polynomial x^8 + x^4 + x^3 + x^2 + 1.
const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) {
  EXP[i] = EXP[i + 255] = x;
  LOG[x] = i;
  x = (x << 1) ^ (x & 0x80 ? 0x11d : 0);
}
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function errorCorrection(data, count) {
  let gen = [1];
  for (let i = 0; i < count; i++) {
    const next = new Array(gen.length + 1).fill(0);
    gen.forEach((g, j) => { next[j] ^= g; next[j + 1] ^= mul(g, EXP[i]); });
    gen = next;
  }
  const rem = new Array(count).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift();
    rem.push(0);
    for (let j = 0; j < count; j++) rem[j] ^= mul(gen[j + 1], factor);
  }
  return rem;
}

const MASKS = [
  (x, y) => (x + y) % 2 === 0,
  (x, y) => y % 2 === 0,
  (x, y) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

/** How hard a symbol is to read, by the specification's four rules. Lower is better. */
function penalty(m) {
  const n = m.length;
  let score = 0, dark = 0;
  const lines = [];
  for (let i = 0; i < n; i++) {
    lines.push(m[i].map(Number).join(''), m.map((row) => Number(row[i])).join(''));
    for (let j = 0; j < n; j++) {
      dark += m[i][j];
      if (i + 1 < n && j + 1 < n && m[i][j] === m[i][j + 1] && m[i][j] === m[i + 1][j] && m[i][j] === m[i + 1][j + 1]) score += 3;
    }
  }
  for (const line of lines) {
    for (const run of line.match(/0{5,}|1{5,}/g) ?? []) score += run.length - 2;
    score += 40 * ((line.match(/(?=10111010000)/g) ?? []).length + (line.match(/(?=00001011101)/g) ?? []).length);
  }
  return score + 10 * Math.floor(Math.abs((dark * 100) / (n * n) - 50) / 5);
}

/** Returns the symbol as rows of booleans (true = dark), without the quiet zone. */
export function qrMatrix(text) {
  const bytes = [...Buffer.from(text, 'utf8')];
  const version = SIZES.findIndex((s) => s && bytes.length <= s[0] - 2);
  if (version < 0) throw new Error('too long for this QR writer (106 bytes at most)');
  const [dataLen, ecLen] = SIZES[version];
  const n = 17 + 4 * version;

  // Data: mode 0100 (bytes), 8-bit length, the bytes, a terminator, then the standard padding.
  const bits = [0, 1, 0, 0];
  const push = (value, width) => { for (let i = width - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  push(bytes.length, 8);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, dataLen * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < dataLen; pad ^= 0xec ^ 0x11) data.push(pad);
  const codewords = [...data, ...errorCorrection(data, ecLen)];

  const m = Array.from({ length: n }, () => new Array(n).fill(false));
  const fixed = Array.from({ length: n }, () => new Array(n).fill(false)); // modules that carry no data
  const set = (x, y, dark) => { if (x >= 0 && y >= 0 && x < n && y < n) { m[y][x] = dark; fixed[y][x] = true; } };

  // Finder patterns with their light border, timing lines, the alignment pattern, the one always-dark module.
  for (const [cx, cy] of [[3, 3], [n - 4, 3], [3, n - 4]]) {
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 2 && Math.max(Math.abs(dx), Math.abs(dy)) !== 4);
  }
  for (let i = 8; i < n - 8; i++) { set(i, 6, i % 2 === 0); set(6, i, i % 2 === 0); }
  if (version > 1) for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) set(n - 7 + dx, n - 7 + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
  // Format information: level L and the mask number, protected by a BCH code. Reserved first, written per mask.
  const format = (mask) => {
    const info = (1 << 3) | mask; // 01 = level L
    let rem = info;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const f = ((info << 10) | rem) ^ 0x5412;
    const bit = (i) => ((f >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(n - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, n - 15 + i, bit(i));
    set(8, n - 8, true);
  };
  format(0);

  // Data goes in two-module columns from the bottom right, snaking up and down, skipping the timing column.
  let k = 0;
  for (let right = n - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let v = 0; v < n; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j, y = ((right + 1) & 2) === 0 ? n - 1 - v : v;
        if (fixed[y][x] || k >= codewords.length * 8) continue;
        m[y][x] = ((codewords[k >>> 3] >>> (7 - (k & 7))) & 1) === 1;
        k++;
      }
    }
  }

  // Try all eight masks and keep the most readable one.
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const flip = () => { for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!fixed[y][x] && MASKS[mask](x, y)) m[y][x] = !m[y][x]; };
    flip();
    format(mask);
    const score = penalty(m);
    if (!best || score < best.score) best = { score, rows: m.map((row) => [...row]) };
    flip();
  }
  return best.rows;
}

/** The symbol as text for a terminal: two rows of modules per line, always black on white whatever the theme. */
export function qrTerminal(text, { quiet = 4 } = {}) {
  const m = qrMatrix(text), n = m.length;
  const dark = (x, y) => x >= 0 && y >= 0 && x < n && y < n && m[y][x];
  const lines = [];
  for (let y = -quiet; y < n + quiet; y += 2) {
    let line = '';
    for (let x = -quiet; x < n + quiet; x++) line += dark(x, y) ? (dark(x, y + 1) ? '█' : '▀') : dark(x, y + 1) ? '▄' : ' ';
    lines.push(`\x1b[30;47;107m${line}\x1b[0m`);
  }
  return lines.join('\n');
}
