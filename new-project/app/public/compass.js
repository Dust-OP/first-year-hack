// The dial. One SVG, two rotating groups:
//   rose   turns with the phone, so N on the rose stays on real north
//   needle points at the chosen person
// Interface for whoever restyles this (the front-end design session):
//   const c = createCompass(svg, { onPick(id) })
//   c.setPeople(list, radiusM)   list items: { id, name, bearing, distanceM, spreadDeg, score, relation }
//   c.render(heading, { targetId, aimedId })   call every animation frame
// Keep that interface and app.js needs no changes.

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

export function createCompass(svg, { onPick }) {
  svg.setAttribute('viewBox', '-172 -172 344 344');
  svg.replaceChildren();

  const defs = el('defs', {}, svg);
  const brass = el('radialGradient', { id: 'cc-brass', cx: '35%', cy: '30%', r: '90%' }, defs);
  el('stop', { offset: '0', 'stop-color': '#f3dfa2' }, brass);
  el('stop', { offset: '0.55', 'stop-color': '#b8893a' }, brass);
  el('stop', { offset: '1', 'stop-color': '#6b4a17' }, brass);
  const face = el('radialGradient', { id: 'cc-face', cx: '50%', cy: '45%', r: '70%' }, defs);
  el('stop', { offset: '0', 'stop-color': '#fbf3dc' }, face);
  el('stop', { offset: '1', 'stop-color': '#e6d3a3' }, face);

  el('circle', { r: 168, fill: 'url(#cc-brass)' }, svg);
  el('circle', { r: 153, fill: 'url(#cc-face)', stroke: '#5a3d12', 'stroke-width': 1.5 }, svg);

  const rose = el('g', { class: 'cc-rose' }, svg);
  for (const r of [45, 80, 115]) el('circle', { r, class: 'cc-ring' }, rose);
  for (let a = 0; a < 360; a += 5) {
    const inner = a % 45 === 0 ? 134 : a % 15 === 0 ? 141 : 146;
    const [x1, y1] = polar(a, 152), [x2, y2] = polar(a, inner);
    el('line', { x1, y1, x2, y2, class: a % 45 === 0 ? 'cc-tick cc-tick-major' : 'cc-tick' }, rose);
  }
  const cardinals = [];
  for (const [label, a] of [['N', 0], ['E', 90], ['S', 180], ['W', 270]]) {
    const [x, y] = polar(a, 124);
    const t = el('text', { x, y, class: label === 'N' ? 'cc-cardinal cc-north' : 'cc-cardinal' }, rose);
    t.textContent = label;
    cardinals.push({ t, x, y });
  }
  const spread = el('path', { class: 'cc-spread' }, rose);

  const needle = el('g', { class: 'cc-needle' }, svg);
  el('polygon', { points: '0,-108 8,0 -8,0', class: 'cc-needle-head' }, needle);
  el('polygon', { points: '0,44 8,0 -8,0', class: 'cc-needle-tail' }, needle);
  el('circle', { r: 5, class: 'cc-pin' }, svg);
  // People sit above the needle so their initials stay readable; this layer turns with the rose.
  const peopleLayer = el('g', {}, svg);
  // Lubber line: the fixed mark for "the way you are facing".
  el('polygon', { points: '0,-150 9,-170 -9,-170', class: 'cc-lubber' }, svg);

  let people = [];
  let nodes = new Map(); // id -> { g, label, person }
  let radius = 500;
  const dotR = (d) => 28 + 80 * Math.sqrt(Math.min(d, radius) / radius);

  return {
    setPeople(list, radiusM) {
      people = list;
      radius = radiusM || radius;
      nodes = new Map();
      peopleLayer.replaceChildren();
      // Best match is first in the list: draw it last so it sits on top when dots overlap.
      for (const p of [...people].reverse()) {
        const [x, y] = polar(p.bearing, dotR(p.distanceM));
        const g = el('g', { class: 'cc-person', transform: `translate(${x} ${y})`, tabindex: 0, role: 'button' }, peopleLayer);
        g.dataset.relation = p.relation;
        if (p.score > 0) g.dataset.match = '1';
        el('title', {}, g).textContent = `${p.name}, ${p.distanceM} m`;
        const label = el('g', {}, g);
        el('circle', { r: 13, class: 'cc-dot' }, label);
        el('text', { class: 'cc-initials', y: 0.5 }, label).textContent = initials(p.name);
        const pick = (e) => { e.stopPropagation(); onPick?.(p.id); };
        g.addEventListener('click', pick);
        g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') pick(e); });
        nodes.set(p.id, { g, label, person: p });
      }
    },

    render(heading, { targetId, aimedId } = {}) {
      rose.setAttribute('transform', `rotate(${-heading})`);
      peopleLayer.setAttribute('transform', `rotate(${-heading})`);
      // Letters and initials stay upright while the rose turns under them.
      for (const { t, x, y } of cardinals) t.setAttribute('transform', `rotate(${heading} ${x} ${y})`);
      for (const [id, { g, label }] of nodes) {
        label.setAttribute('transform', `rotate(${heading})`);
        g.classList.toggle('is-aimed', id === aimedId);
        g.classList.toggle('is-target', id === targetId);
      }
      const target = nodes.get(targetId)?.person;
      needle.setAttribute('transform', `rotate(${target ? target.bearing - heading : -heading})`);
      needle.classList.toggle('is-north', !target);
      // A wedge as wide as the GPS doubt: wide wedge = "roughly over there".
      if (target && target.spreadDeg > 8) {
        const half = Math.min(target.spreadDeg, 70), r = 118;
        const [x1, y1] = polar(target.bearing - half, r), [x2, y2] = polar(target.bearing + half, r);
        spread.setAttribute('d', `M0 0 L${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2} Z`);
      } else spread.setAttribute('d', '');
    },
  };
}
