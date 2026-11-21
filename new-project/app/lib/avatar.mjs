// Pictures. Every person the API returns carries `picture`: a URL on our own
// origin (/api/avatar?id=...) that an <img> can load. Behind it is, in order:
// the photo the user picked, their LinkedIn picture, or a generated initials tile.
// Demo bots only ever get the initials tile: no photos of real people.

import { createHash } from 'node:crypto';

export const avatarUrl = (id, version) => `/api/avatar?id=${encodeURIComponent(id)}${version ? `&v=${version}` : ''}`;

const PHOTO = /^data:image\/jpeg;base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_PHOTO_CHARS = 150_000; // the page sends a 256 px JPEG, about 10-30 kB

/**
 * Reads the `photo` field of the profile form.
 * Returns { photo: undefined } (leave as is), { photo: null } (remove), { photo: dataUrl } or { error }.
 */
export function readPhoto(input) {
  if (input === undefined) return { photo: undefined };
  if (input === null || input === '') return { photo: null };
  const error = 'That photo could not be used. Please pick another one.';
  if (typeof input !== 'string' || input.length > MAX_PHOTO_CHARS) return { error };
  const m = PHOTO.exec(input);
  // Trust the bytes, not the label: a JPEG starts FF D8 FF.
  if (!m || !Buffer.from(m[1].slice(0, 8), 'base64').subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { error };
  return { photo: input };
}

export const photoBytes = (dataUrl) => Buffer.from(PHOTO.exec(dataUrl)?.[1] ?? '', 'base64');

/**
 * LinkedIn picture links carry their expiry as `e=<epoch seconds>` (seen in LinkedIn's
 * profile-picture reference; the OIDC page does not say). Past that, show initials instead.
 */
export function pictureExpired(url, nowMs) {
  try {
    const e = Number(new URL(url).searchParams.get('e'));
    return e > 0 && e * 1000 < nowMs;
  } catch {
    return true;
  }
}

const esc = (s) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** A square tile with the person's initials. The colour is fixed per id, so it does not flicker between ticks. */
export function initialsSvg(name, seed) {
  const words = String(name ?? '').split(/[\s-]+/).map((w) => w.match(/[\p{L}\p{N}]/u)?.[0]).filter(Boolean);
  const initials = (words.length > 1 ? words[0] + words.at(-1) : words[0] ?? '?').toUpperCase();
  const hue = parseInt(createHash('sha256').update(String(seed)).digest('hex').slice(0, 4), 16) % 360;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="256" height="256" role="img" aria-label="${esc(initials)}">`
    + `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue} 68% 58%)"/><stop offset="1" stop-color="hsl(${(hue + 40) % 360} 62% 40%)"/></linearGradient></defs>`
    + `<rect width="128" height="128" fill="url(#g)"/>`
    + `<text x="64" y="64" dy=".35em" text-anchor="middle" font-family="-apple-system,'Helvetica Neue',Arial,sans-serif" font-size="${initials.length > 1 ? 50 : 60}" font-weight="600" fill="#fff">${esc(initials)}</text></svg>`;
}
