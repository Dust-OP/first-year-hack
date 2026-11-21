// The dial. One SVG, two rotating groups:
//   rose   turns with the phone, so N on the rose stays on real north
//   needle points at the chosen person
// Interface for whoever restyles this (the front-end design session):
//   const c = createCompass(svg, { onPick(id) })
//   c.setPeople(list, radiusM)   list items: { id, name, bearing, distanceM, spreadDeg, score, relation }
//   c.render(heading, { targetId, aimedId, lock, dtMs, turnRate })   call every animation frame
//       heading    where the user faces, already smoothed by the caller (app.js runs it through
//                  the spring in physics.js), degrees clockwise from north
//       targetId   who the needle leads to; aimedId: who is straight ahead
//       lock       0..1, optional: how close the aim is to locking on (draws the ring at the rim)
//       dtMs       optional: time since the last call; measured here when it is left out
//       turnRate   optional: how fast `heading` is changing, degrees a second (see the needle)
// Keep that interface and app.js needs no changes.
//
// Look: a liquid-glass disc (the glass itself is .dial-wrap::before in style.css; the SVG draws
// the markings on top). Motion: people fade and grow in when they appear, glide when they move,
// and shrink away when they leave.
//
// The needle is a magnetised needle in fluid (physics.js, numbers in tuning.js): it swings to a
// new target, overshoots a little and settles. When the dial turns, the fluid carries the needle
// a few degrees along with the turn, so it trails and then swings back, as in a real compass.
// With prefers-reduced-motion it moves to its target quickly with no overshoot and no trail.
//
// When the compass has found someone, .dial-wrap gets the class is-revealed and this whole SVG
// fades out under that person's picture (reveal.js, style.css). It keeps rendering underneath, so
// it is in the right place when it fades back.

import { createSpring } from './physics.js';
import { TUNING } from './tuning.js';

const NS = 'http://www.w3.org/2000/svg';
function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.append(n);
  return n;
}
const polar = (deg, r) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [Math.cos(a) * r, Math.sin(a) * r];
};
const initials = (name) => name.split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function createCompass(svg, { onPick }) {
  svg.setAttribute('viewBox', '-172 -172 344 344');
  svg.replaceChildren();

  const defs = el('defs', {}, svg);
  // A faint highlight across the glass face: brighter at the top left, where the light comes from.
  const face = el('radialGradient', { id: 'cc-face', cx: '32%', cy: '22%', r: '85%' }, defs);
  el('stop', { offset: '0', 'stop-color': '#fff', 'stop-opacity': '.28' }, face);
  el('stop', { offset: '.6', 'stop-color': '#fff', 'stop-opacity': '.04' }, face);
  el('stop', { offset: '1', 'stop-color': '#fff', 'stop-opacity': '0' }, face);
  const needleFill = el('linearGradient', { id: 'cc-needle', x1: '0', y1: '0', x2: '1', y2: '0' }, defs);
  el('stop', { offset: '0', 'stop-color': '#ff6961' }, needleFill);
  el('stop', { offset: '.5', 'stop-color': '#ff3b30' }, needleFill);
  el('stop', { offset: '.5', 'stop-color': '#d70015' }, needleFill);
  el('stop', { offset: '1', 'stop-color': '#c4000f' }, needleFill);

  el('circle', { r: 167, class: 'cc-face' }, svg);
  el('circle', { r: 166.5, class: 'cc-rim' }, svg);

  const rose = el('g', { class: 'cc-rose' }, svg);
  for (const r of [45, 80, 115]) el('circle', { r, class: 'cc-ring' }, rose);
  for (let a = 0; a < 360; a += 3) {
    const major = a % 90 === 0, mid = a % 30 === 0;
    const inner = major ? 136 : mid ? 143 : 149;
    const [x1, y1] = polar(a, 155), [x2, y2] = polar(a, inner);
    el('line', { x1, y1, x2, y2, class: major ? 'cc-tick cc-tick-major' : mid ? 'cc-tick cc-tick-mid' : 'cc-tick' }, rose);
  }
  const cardinals = [];
  for (const [label, a] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) {
    const [x, y] = polar(a, 122);
    const t = el('text', { x, y, class: label === 'N' ? 'cc-cardinal cc-north' : 'cc-cardinal' }, rose);
    t.textContent = label;
    cardinals.push({ t, x, y });
  }
  const spread = el('path', { class: 'cc-spread is-off' }, rose);

  const needle = el('g', { class: 'cc-needle' }, svg);
  el('polygon', { points: '0,-110 7.5,0 -7.5,0', class: 'cc-needle-head' }, needle);
  el('polygon', { points: '0,44 7.5,0 -7.5,0', class: 'cc-needle-tail' }, needle);
  el('circle', { r: 6, class: 'cc-pin' }, svg);
  // People sit above the needle so their initials stay readable; this layer turns with the rose.
  const peopleLayer = el('g', {}, svg);
  const leavingLayer = el('g', {}, svg); // people fading out, kept apart so they never shift the live order
  // Lock ring: fills clockwise from the top while the aim holds steady on someone. When it
  // closes, the dial gives way to their picture.
  const lockRing = el('circle', { r: 160.5, class: 'cc-lock', pathLength: 1, transform: 'rotate(-90)' }, svg);
  // Lubber line: the fixed mark for "the way you are facing".
  el('path', { d: 'M0 -152 L7 -166 Q0 -169 -7 -166 Z', class: 'cc-lubber' }, svg);

  let nodes = new Map(); // id -> { g, label, title, person }
  let radius = 500;
  const needleSpring = createSpring(TUNING.needle); // the world bearing the needle shows
  let needleAwake = false;
  let lastRender = 0;
  let lockShown = 0;
  let spreadOn = false;
  const dotR = (d) => 28 + 80 * Math.sqrt(Math.min(d, radius) / radius);

  function place(node, p) {
    const [x, y] = polar(p.bearing, dotR(p.distanceM));
    node.g.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px)`;
    node.g.dataset.relation = p.relation;
    if (p.score > 0) node.g.dataset.match = '1';
    else delete node.g.dataset.match;
    node.title.textContent = `${p.name}, ${p.distanceM} m`;
    node.person = p;
  }

  function add(p) {
    const g = el('g', { class: 'cc-person', tabindex: 0, role: 'button' });
    const title = el('title', {}, g);
    const label = el('g', {}, g);
    const pop = el('g', { class: 'cc-pop' }, label);
    el('circle', { r: 13, class: 'cc-halo' }, pop);
    el('circle', { r: 13, class: 'cc-dot' }, pop);
    el('text', { class: 'cc-initials', y: 0.5 }, pop).textContent = initials(p.name);
    const node = { g, label, title, person: p };
    const pick = (e) => { e.stopPropagation(); onPick?.(node.person.id); };
    g.addEventListener('click', pick);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') pick(e); });
    place(node, p);
    return node;
  }

  function remove(node) {
    leavingLayer.append(node.g);
    node.g.classList.add('is-leaving');
    node.g.removeAttribute('tabindex');
    const done = () => node.g.remove();
    node.g.addEventListener('animationend', done, { once: true });
    setTimeout(done, 500); // in case the animation never runs
  }

  return {
    setPeople(list, radiusM) {
      radius = radiusM || radius;
      const next = new Map();
      for (const p of list) {
        const node = nodes.get(p.id);
        if (node) { place(node, p); next.set(p.id, node); } else next.set(p.id, add(p));
      }
      for (const [id, node] of nodes) if (!next.has(id)) remove(node);
      nodes = next;
      // Best match is first in the list: draw it last so it sits on top when dots overlap.
      // Insert or move only the nodes that are out of place: moving a node restarts its animations.
      let cursor = peopleLayer.firstChild;
      for (const { g } of [...nodes.values()].reverse()) {
        if (g === cursor) cursor = cursor.nextSibling;
        else peopleLayer.insertBefore(g, cursor);
      }
    },

    render(heading, { targetId, aimedId, lock = 0, dtMs, turnRate = 0 } = {}) {
      const now = performance.now();
      const dt = Number.isFinite(dtMs) ? dtMs : lastRender ? Math.min(now - lastRender, TUNING.maxFrameMs) : 0;
      lastRender = now;
      rose.setAttribute('transform', `rotate(${-heading})`);
      peopleLayer.setAttribute('transform', `rotate(${-heading})`);
      leavingLayer.setAttribute('transform', `rotate(${-heading})`);
      // Letters and initials stay upright while the rose turns under them.
      for (const { t, x, y } of cardinals) t.setAttribute('transform', `rotate(${heading} ${x} ${y})`);
      for (const [id, { g, label }] of nodes) {
        label.setAttribute('transform', `rotate(${heading})`);
        g.classList.toggle('is-aimed', id === aimedId);
        g.classList.toggle('is-target', id === targetId);
      }
      const target = nodes.get(targetId)?.person;
      // The needle lives in the world: its pull is towards the target's bearing, not towards a
      // place on the screen, so turning the phone does not by itself move it off the target.
      const want = target ? target.bearing : 0;
      if (!needleAwake) { needleSpring.set(want); needleAwake = true; }
      if (reduceMotion.matches) {
        needleSpring.tune(TUNING.reduced);
        needleSpring.step(want, dt);
      } else {
        const N = TUNING.needle;
        needleSpring.tune(N);
        // Fluid drag: while the dial turns at turnRate the needle rests this far behind its target.
        const trail = Math.max(-N.maxDragDeg, Math.min(N.maxDragDeg, (2 * N.zeta * N.drag * turnRate) / (2 * Math.PI * N.hz)));
        needleSpring.step(want, dt, trail);
      }
      needle.setAttribute('transform', `rotate(${(needleSpring.angle - heading).toFixed(2)})`);
      needle.classList.toggle('is-north', !target);
      if (lock !== lockShown) {
        lockShown = lock;
        lockRing.style.strokeDashoffset = String(1 - lock);
        lockRing.classList.toggle('is-on', lock > 0);
      }
      // A wedge as wide as the GPS doubt: wide wedge = "roughly over there". It fades in and out.
      const showSpread = Boolean(target && target.spreadDeg > 8);
      if (showSpread) {
        const half = Math.min(target.spreadDeg, 70), r = 118;
        const [x1, y1] = polar(target.bearing - half, r), [x2, y2] = polar(target.bearing + half, r);
        spread.setAttribute('d', `M0 0 L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z`);
      }
      if (showSpread !== spreadOn) { spreadOn = showSpread; spread.classList.toggle('is-off', !showSpread); }
    },
  };
}
