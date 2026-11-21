// The reveal: when the compass has found someone, the dial's markings fade away and that person's
// profile picture takes their place inside the same glass disc. Tap the picture to get the
// compass back. The fade itself is CSS (.dial-wrap.is-revealed in style.css); this file fills the
// disc and looks after the picture.
//
// Like every other part of the page, the button is shown and hidden through its `hidden`
// attribute: it is un-hidden just before it fades in and hidden again once it has faded out, so
// an unseen picture can never take a tap meant for the dial.
//
// The picture comes from `person.picture`: a URL an <img> can load, or null.
//  - null, still loading, or failed to load: large initials on a tinted disc. A broken image is
//    never shown, because the <img> only enters the page after it has loaded and decoded.
//  - A slow picture fades in over the initials when it arrives.
//  - preload(person) fetches a picture before it is needed (app.js calls it for the person the
//    needle leads to), and the element that was preloaded is the one that is shown, so the reveal
//    never waits on the network a second time.
//
//   const r = createReveal(button, { onDismiss() })   button: the empty <button class="reveal"> inside .dial-wrap
//   r.preload(person)
//   r.set(person, offset)   show this person (offset -1..1: how far the aim has drifted); null hides
//   r.shownId

const SVG = 'http://www.w3.org/2000/svg';
const RETRY_MS = 30_000; // a picture that failed is tried again after this long
const FADE_OUT_MS = 340; // a little longer than the fade-out in style.css
const KEEP = 24; // pictures kept in memory
const TINTS = ['--blue', '--indigo', '--purple', '--pink', '--orange', '--teal', '--green', '--cyan'];

const initials = (name) => String(name ?? '').trim().split(/\s+/).map((w) => [...w][0] ?? '').slice(0, 2).join('').toUpperCase() || '?';
/** The same person always gets the same colour. */
function tintOf(id) {
  let n = 0;
  for (const ch of String(id)) n = (n * 31 + ch.codePointAt(0)) >>> 0;
  return TINTS[n % TINTS.length];
}
function span(cls, parent, text) {
  const n = document.createElement('span');
  n.className = cls;
  if (text != null) n.textContent = text;
  parent.append(n);
  return n;
}

export function createReveal(button, { onDismiss } = {}) {
  const wrap = button.parentElement;
  button.replaceChildren();
  const face = span('reveal-face', button);
  const letters = span('reveal-initials', face);
  const photo = span('reveal-photo-slot', button);
  span('reveal-shade', button);
  const caption = span('reveal-caption', button);
  const nameEl = span('reveal-name', caption);
  const whereEl = span('reveal-where', caption);
  // A small compass mark at the top: this is the way back.
  const back = span('reveal-back', button);
  const icon = document.createElementNS(SVG, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const ring = document.createElementNS(SVG, 'circle');
  for (const [k, v] of Object.entries({ cx: 12, cy: 12, r: 9.25, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5 })) ring.setAttribute(k, v);
  const needle = document.createElementNS(SVG, 'path');
  needle.setAttribute('d', 'M16 8 13.5 13.5 8 16 10.5 10.5Z');
  needle.setAttribute('fill', 'currentColor');
  icon.append(ring, needle);
  back.append(icon);

  button.addEventListener('click', () => { if (shownId !== null) onDismiss?.(shownId); });

  const pictures = new Map(); // url -> { img, state: 'loading' | 'ready' | 'failed', at }
  let shownId = null;
  let shownKey = '';
  let shownUrl = null;
  let lastAim = 0;
  let hideTimer = 0;

  function load(url) {
    let entry = pictures.get(url);
    if (entry && !(entry.state === 'failed' && performance.now() - entry.at > RETRY_MS)) return entry;
    const img = new Image();
    img.className = 'reveal-photo';
    img.alt = ''; // the name is in the caption
    img.decoding = 'async';
    img.draggable = false;
    img.referrerPolicy = 'no-referrer'; // do not tell the picture's host which page asked
    entry = { img, state: 'loading', at: performance.now() };
    const settle = (state) => {
      if (entry.state !== 'loading') return;
      entry.state = state;
      entry.at = performance.now();
    };
    img.addEventListener('load', () => {
      if (!img.naturalWidth) return settle('failed');
      // Decode before showing, so the fade never starts on a half-painted picture.
      (img.decode ? img.decode() : Promise.resolve()).then(() => settle('ready'), () => settle(img.naturalWidth ? 'ready' : 'failed'));
    });
    img.addEventListener('error', () => settle('failed'));
    img.src = url;
    pictures.delete(url);
    pictures.set(url, entry);
    while (pictures.size > KEEP) pictures.delete(pictures.keys().next().value);
    return entry;
  }

  const urlOf = (person) => (typeof person?.picture === 'string' && person.picture.trim() ? person.picture : null);

  function attach(entry, fade) {
    const { img } = entry;
    img.classList.toggle('is-in', !fade);
    photo.replaceChildren(img);
    if (fade) {
      void img.offsetWidth; // make the starting state count, so the fade runs
      img.classList.add('is-in');
    }
  }

  function fill(person) {
    letters.textContent = initials(person.name);
    face.style.setProperty('--tint', `var(${tintOf(person.id)})`);
    nameEl.textContent = person.name;
    const unsure = person.spreadDeg > 35;
    whereEl.textContent = Number.isFinite(person.distanceM) ? (unsure ? `about ${person.distanceM} m` : `${person.distanceM} m away`) : '';
    button.setAttribute('aria-label', `${person.name}${whereEl.textContent ? `, ${whereEl.textContent}` : ''}. Tap to go back to the compass.`);

    const url = urlOf(person);
    if (url === shownUrl) return; // same picture: leave it alone
    shownUrl = url;
    photo.replaceChildren(); // initials until set() finds the new picture ready
    if (url) load(url);
  }

  return {
    get shownId() { return shownId; },

    preload(person) {
      const url = urlOf(person);
      if (url) load(url);
    },

    set(person, offset = 0) {
      if (!person) {
        if (shownId === null) return;
        shownId = null;
        wrap.classList.remove('is-revealed'); // fades out, and takes no taps from this moment
        if (document.activeElement === button) button.blur();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(() => { if (shownId === null) button.hidden = true; }, FADE_OUT_MS);
        return;
      }
      const key = JSON.stringify([person.id, person.name, urlOf(person), person.distanceM, person.spreadDeg > 35]);
      if (key !== shownKey) {
        const swapped = shownId !== null && shownId !== person.id;
        shownKey = key;
        fill(person);
        if (swapped) {
          // Another person while the disc is showing: cross-fade the content.
          button.classList.remove('is-swapping');
          void button.offsetWidth;
          button.classList.add('is-swapping');
        }
      }
      // The picture goes in once it has loaded: at once if it was preloaded, fading in over the
      // initials if it arrives while this person is already on show, never if it fails.
      const entry = shownUrl ? pictures.get(shownUrl) : null;
      if (entry?.state === 'ready' && photo.firstChild !== entry.img) attach(entry, shownId === person.id);
      if (shownId === null) {
        clearTimeout(hideTimer);
        if (button.hidden) {
          button.hidden = false;
          void button.offsetWidth; // let the hidden-away state count as the start of the fade
        }
        wrap.classList.add('is-revealed');
      }
      shownId = person.id;
      // The picture slides a little against the turn, like something seen through a porthole,
      // so the user feels the aim drifting towards the release angle.
      if (Math.abs(offset - lastAim) > 0.004) {
        lastAim = offset;
        button.style.setProperty('--aim', offset.toFixed(3));
      }
    },
  };
}
