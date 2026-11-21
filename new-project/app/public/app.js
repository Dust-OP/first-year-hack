// Career Compass, demo v1: wires sign-up, location, heading, the dial and the inbox together.

import { createCompass } from './compass.js';
import { angleDiff, createHeading } from './heading.js';

const SYNC_MS = 3000; // how often we report position and refresh who is around
const AIM_DEG = 15; // "pointing at someone" = within this many degrees of straight ahead
const BUSH_HOUSE = { lat: 51.5131, lon: -0.1174, accuracy: 5 }; // demo fallback position
const TAGS = ['frontend', 'backend', 'design', 'machine learning', 'data', 'product', 'co-founder', 'mentor'];

const $ = (id) => document.getElementById(id);

/** Build DOM without innerHTML, so nothing a user typed is ever parsed as markup. */
function h(tag, props = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v === true ? '' : v);
  }
  n.append(...children.flat().filter((c) => c != null && c !== false));
  return n;
}

const state = {
  token: localStorage.getItem('cc.token'),
  me: null,
  demo: false,
  running: false,
  visible: true,
  position: null, // { lat, lon, accuracy, demo? }
  nearby: [],
  inbox: { incoming: [], outgoing: [], connections: [] },
  shown: 0, // smoothed heading that is on screen
  pickedId: null, // person tapped on the dial
  aimedId: null, // person the phone is pointing at
  cardId: null, // whose card is open
  dismissedId: null, // card closed by hand: stay closed until the aim moves on
  engine: null,
};

async function api(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Request failed (${res.status})`), { status: res.status });
  return data;
}

// ---------- views ----------

function show(view) {
  for (const v of ['signup', 'compass', 'people']) $(`view-${v}`).hidden = v !== view;
  $('tab-compass').classList.toggle('is-on', view === 'compass');
  $('tab-people').classList.toggle('is-on', view === 'people');
  document.querySelector('.bar nav').hidden = view === 'signup';
}
$('tab-compass').addEventListener('click', () => show('compass'));
$('tab-people').addEventListener('click', () => show('people'));

// ---------- sign up ----------

for (const box of document.querySelectorAll('.chips')) {
  for (const tag of TAGS) {
    box.append(h('label', {}, h('input', { type: 'checkbox', name: box.dataset.field, value: tag }), h('span', {}, tag)));
  }
}

$('signup').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const err = $('signup-error');
  err.hidden = true;
  try {
    const out = await api('POST', '/api/signup', {
      name: f.get('name'), headline: f.get('headline'), linkedin: f.get('linkedin'),
      offers: f.getAll('offers'), seeks: f.getAll('seeks'),
    });
    state.token = out.token;
    state.me = out.me;
    localStorage.setItem('cc.token', out.token);
    show('compass');
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});

// ---------- compass ----------

const compass = createCompass($('dial'), {
  onPick(id) {
    state.pickedId = id;
    state.dismissedId = null;
    openCard(id);
  },
});

const heading = createHeading({ onSource: () => renderStatus() });

function renderStatus() {
  const el = $('status');
  if (!state.running) return;
  const parts = [];
  if (!state.visible) parts.push('You are invisible. Nobody can point at you.');
  else if (!state.position) parts.push('Finding your position…');
  else if (state.position.demo) parts.push('Demo position: Bush House.');
  else parts.push(`Position accurate to about ${Math.round(state.position.accuracy)} m.`);

  if (heading.source === 'manual') parts.push('No compass sensor: drag the dial to turn.');
  else if (heading.source === 'denied') parts.push('Motion access was refused: drag the dial to turn.');
  else if (heading.source === 'none') parts.push('Waiting for the compass sensor…');

  if (state.position && state.visible) {
    const n = state.nearby.length;
    parts.push(n ? `${n} ${n === 1 ? 'person' : 'people'} within 500 m. Turn until the red needle points up.` : 'Nobody else is within 500 m yet.');
  }
  el.textContent = parts.join(' ');
}

function startLocation() {
  const fallback = (why) => {
    if (!state.position) state.position = { ...BUSH_HOUSE, demo: true };
    console.warn('Location unavailable, using the demo position:', why);
    renderStatus();
  };
  if (!('geolocation' in navigator) || !window.isSecureContext) return fallback('needs HTTPS');
  navigator.geolocation.watchPosition(
    (p) => { state.position = { lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy }; renderStatus(); },
    (e) => fallback(e.message),
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
  );
}

async function sync() {
  if (!state.running || !state.token) return;
  try {
    const p = state.visible ? state.position : null;
    const out = await api('POST', '/api/sync', p ? { lat: p.lat, lon: p.lon, accuracy: p.accuracy } : {});
    state.nearby = out.nearby;
    state.inbox = { incoming: out.incoming, outgoing: out.outgoing, connections: out.connections };
    state.engine = out.engine;
    compass.setPeople(out.nearby, out.radiusM);
    renderStatus();
    renderCard();
    renderPeople();
    renderEngine();
  } catch (ex) {
    if (ex.status === 401) return signOut();
    $('status').textContent = `Cannot reach the server: ${ex.message}`;
  }
}

$('start').addEventListener('click', async () => {
  $('start').hidden = true;
  state.running = true;
  await heading.start(); // first, while we still hold the tap (iOS permission prompt)
  startLocation();
  renderStatus();
  sync();
  setInterval(sync, SYNC_MS);
});

// Drag to turn (manual mode: laptops, refused permission, or a drifting indoor compass).
{
  const wrap = document.querySelector('.dial-wrap');
  let last = null;
  const angleAt = (e) => {
    const r = wrap.getBoundingClientRect();
    return (Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) * 180) / Math.PI;
  };
  wrap.addEventListener('pointerdown', (e) => { last = angleAt(e); });
  window.addEventListener('pointermove', (e) => {
    if (last === null) return;
    const now = angleAt(e);
    heading.turn(-angleDiff(last, now)); // dragging the rose clockwise = turning yourself anticlockwise
    last = now;
  });
  window.addEventListener('pointerup', () => { last = null; });
  window.addEventListener('pointercancel', () => { last = null; });
  window.addEventListener('keydown', (e) => {
    if (e.target.closest('input, button, summary, [role="button"]')) return;
    if (e.key === 'ArrowLeft') heading.turn(-5);
    if (e.key === 'ArrowRight') heading.turn(5);
  });
}

function frame() {
  const target = heading.value;
  if (target !== null) state.shown = (state.shown + angleDiff(state.shown, target) * 0.2 + 360) % 360;

  // Who is straight ahead? Nearest in angle wins.
  let aimed = null, best = AIM_DEG;
  for (const p of state.nearby) {
    const off = Math.abs(angleDiff(state.shown, p.bearing));
    if (off <= best) { best = off; aimed = p.id; }
  }
  if (aimed !== state.aimedId) {
    state.aimedId = aimed;
    if (aimed && aimed !== state.dismissedId) {
      state.dismissedId = null;
      openCard(aimed);
      navigator.vibrate?.(30);
    }
  }
  // The needle leads to the person you tapped, otherwise to your best match.
  const stillHere = state.nearby.some((p) => p.id === state.pickedId);
  const targetId = stillHere ? state.pickedId : state.nearby[0]?.id ?? null;
  compass.render(state.shown, { targetId, aimedId: state.aimedId });
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// ---------- profile card ----------

function openCard(id) {
  state.cardId = id;
  renderCard();
}

function tags(person) {
  const hit = new Set([...person.helpsMe, ...person.iHelp]);
  return h('div', { class: 'tags' }, [...new Set([...person.offers, ...person.seeks])].map((t) => h('span', { class: hit.has(t) ? 'tag hit' : 'tag' }, t)));
}

function why(person) {
  const bits = [];
  if (person.helpsMe.length) bits.push(`Offers what you are looking for: ${person.helpsMe.join(', ')}.`);
  if (person.iHelp.length) bits.push(`Looking for what you offer: ${person.iHelp.join(', ')}.`);
  return bits.length ? h('p', { class: 'why' }, bits.join(' ')) : null;
}

const linkedinLink = (person, text = 'View LinkedIn profile') =>
  h('a', { class: 'link', href: person.linkedin, target: '_blank', rel: 'noopener noreferrer' }, text);

/** Buttons for one person, by where the two of you stand. */
function actions(person, relation, requestId) {
  const act = (fn) => async (e) => {
    e.currentTarget.disabled = true;
    try { await fn(); } catch (ex) { alert(ex.message); }
    sync();
  };
  if (relation === 'connected') {
    return [
      h('a', { class: 'btn', href: person.linkedin, target: '_blank', rel: 'noopener noreferrer' }, 'Connect on LinkedIn'),
      h('p', { class: 'note' }, 'You both said yes. This opens their LinkedIn profile, where you tap Connect.'),
    ];
  }
  if (relation === 'incoming') {
    return [
      h('button', { class: 'primary', type: 'button', onclick: act(() => api('POST', '/api/requests/respond', { id: requestId, action: 'accept' })) }, 'Accept'),
      h('button', { class: 'ghost', type: 'button', onclick: act(() => api('POST', '/api/requests/respond', { id: requestId, action: 'decline' })) }, 'Decline'),
    ];
  }
  if (relation === 'outgoing') return [h('button', { class: 'primary', type: 'button', disabled: true }, 'Invitation sent, waiting')];
  if (relation === 'declined-by-them') return [h('p', { class: 'note' }, 'They declined your invitation.')];
  return [h('button', { class: 'primary', type: 'button', onclick: act(() => api('POST', '/api/requests', { toId: person.id })) }, 'Send invitation')];
}

function renderCard() {
  const card = $('card');
  const p = state.nearby.find((x) => x.id === state.cardId);
  if (!p) { card.hidden = true; return; }
  // Rebuild only when something visible changed, so a tap is never lost to a redraw.
  const key = JSON.stringify([p.id, p.relation, p.distanceM, p.spreadDeg]);
  if (!card.hidden && card.dataset.key === key) return;
  card.dataset.key = key;
  const where = p.spreadDeg > 35 ? `about ${p.distanceM} m, direction uncertain` : `${p.distanceM} m away`;
  // replaceChildren would print a null as the word "null", so drop the empty slots first.
  card.replaceChildren(...[
    h('div', { class: 'card-head' }, h('h2', {}, p.name), h('span', { class: 'where' }, where)),
    p.headline ? h('p', {}, p.headline) : null,
    why(p),
    tags(p),
    p.relation === 'connected' ? null : h('p', {}, linkedinLink(p)),
    h('div', { class: 'actions' }, actions(p, p.relation, p.requestId),
      h('button', { class: 'ghost', type: 'button', onclick: () => { state.dismissedId = p.id; state.cardId = null; state.pickedId = null; card.hidden = true; } }, 'Close')),
  ].filter(Boolean));
  card.hidden = false;
}

// ---------- people tab ----------

function row(item, relation) {
  const p = item.person;
  return h('article', { class: 'row' },
    h('h3', {}, p.name),
    p.headline ? h('p', {}, p.headline) : null,
    why(p),
    tags(p),
    relation === 'connected' ? null : h('p', {}, linkedinLink(p)),
    h('div', { class: 'actions' }, actions(p, relation, item.id)),
  );
}

let peopleKey = '';
function renderPeople() {
  const { incoming, outgoing, connections } = state.inbox;
  const key = JSON.stringify([incoming, outgoing, connections].map((l) => l.map((i) => [i.id, i.status])));
  if (key === peopleKey) return;
  peopleKey = key;
  const fill = (id, items, relationOf, empty) =>
    $(id).replaceChildren(...(items.length ? items.map((i) => row(i, relationOf(i))) : [h('p', { class: 'empty' }, empty)]));
  fill('incoming', incoming, () => 'incoming', 'No invitations yet.');
  fill('connections', connections, () => 'connected', 'When an invitation is accepted, the LinkedIn link appears here for both of you.');
  fill('outgoing', outgoing, (i) => (i.status === 'declined' ? 'declined-by-them' : 'outgoing'), 'You have not invited anyone yet.');
  const badge = $('badge');
  badge.textContent = incoming.length;
  badge.hidden = incoming.length === 0;
}

// ---------- demo tools ----------

function renderEngine() {
  const e = state.engine;
  $('engine').textContent = e?.sql
    ? `Snowflake computed these bearings\n${e.rows} row(s) in ${e.ms} ms\n\n${e.sql}`
    : 'Store: in-memory (no Snowflake account configured).\nBearing and distance: haversine on the server.\nSet SNOWFLAKE_* in app/.env to move this to ST_AZIMUTH / ST_DISTANCE.';
}

$('seed').addEventListener('click', async () => {
  const p = state.position ?? BUSH_HOUSE;
  try { await api('POST', '/api/demo/seed', { lat: p.lat, lon: p.lon }); sync(); } catch (ex) { alert(ex.message); }
});
$('manual').addEventListener('click', () => {
  const on = heading.source !== 'manual';
  heading.manual(on);
  $('manual').textContent = on ? 'Use the sensor' : 'Turn by hand';
});
$('hide').addEventListener('click', async () => {
  state.visible = !state.visible;
  $('hide').textContent = state.visible ? 'Go invisible' : 'Become visible';
  if (!state.visible) await api('POST', '/api/hide').catch(() => {});
  sync();
});

function signOut() {
  if (state.token) fetch('/api/hide', { method: 'POST', keepalive: true, headers: { Authorization: `Bearer ${state.token}` } }).catch(() => {});
  localStorage.removeItem('cc.token');
  location.reload();
}
$('signout').addEventListener('click', signOut);

// Leaving the page takes you off other people's compasses straight away.
window.addEventListener('pagehide', () => {
  if (state.token && state.running) fetch('/api/hide', { method: 'POST', keepalive: true, headers: { Authorization: `Bearer ${state.token}` } });
});

// ---------- boot ----------

(async function boot() {
  try { state.demo = (await api('GET', '/api/health')).demo; } catch { /* offline: sign-up will report it */ }
  $('seed').hidden = !state.demo;
  renderEngine();
  if (state.token) {
    try {
      state.me = (await api('GET', '/api/me')).me;
      return show('compass');
    } catch {
      localStorage.removeItem('cc.token');
      state.token = null;
    }
  }
  show('signup');
})();
