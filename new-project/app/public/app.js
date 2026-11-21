// Career Compass, demo v1: wires sign-up, location, heading, the dial and the inbox together.

import { createLogto, linkedin } from './auth.js';
import { createCompass } from './compass.js';
import { playConfirm } from './confirm.js';
import { createHeading } from './heading.js';
import { createLockOn } from './lockon.js';
import { angleDiff, createSpring } from './physics.js';
import { createReveal } from './reveal.js';
import { TUNING } from './tuning.js';

const SYNC_MS = 3000; // how often we report position and refresh who is around
const SYNC_TIMEOUT_MS = 10_000; // an answer that has not come by then is given up, so the next tick can ask again
const AIM_DEG = 15; // "pointing at someone" = within this many degrees of straight ahead
const BUSH_HOUSE = { lat: 51.5131, lon: -0.1174, accuracy: 5 }; // demo position: only ever used when someone chooses it
const ROUGH_M = 100; // a position less accurate than this cannot point at a person
const PHOTO_PX = 256; // picked photos are cropped square and shrunk to this before upload
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
  logto: null, // email sign-in, when the server has it configured
  running: false,
  visible: true,
  position: null, // { lat, lon, accuracy, demo? }. Stays null until the phone gives one or the demo position is chosen.
  locationProblem: null, // why there is no position: 'insecure' | 'unsupported' | 'denied' | 'unavailable'
  nearby: [],
  inbox: { incoming: [], outgoing: [], connections: [] },
  shown: 0, // heading that is on screen: the sensor or hand heading, after the spring
  pickedId: null, // person tapped on the dial
  aimedId: null, // person the phone is pointing at
  cardId: null, // whose card is open
  engine: null,
};

/** `timeoutMs`: give up after this long (the request is aborted and this throws a TimeoutError). */
async function api(method, path, body, timeoutMs) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
    signal: timeoutMs ? AbortSignal.timeout?.(timeoutMs) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Request failed (${res.status})`), { status: res.status });
  return data;
}

// ---------- views ----------

function show(view) {
  for (const v of ['welcome', 'signup', 'compass', 'people']) $(`view-${v}`).hidden = v !== view;
  $('tab-compass').classList.toggle('is-on', view === 'compass');
  $('tab-people').classList.toggle('is-on', view === 'people');
  document.querySelector('.bar nav').hidden = view === 'signup' || view === 'welcome';
}
$('tab-compass').addEventListener('click', () => show('compass'));
$('tab-people').addEventListener('click', () => show('people'));

// ---------- sign up ----------

for (const box of document.querySelectorAll('.chips')) {
  for (const tag of TAGS) {
    box.append(h('label', {}, h('input', { type: 'checkbox', name: box.dataset.field, value: tag }), h('span', {}, tag)));
  }
}

/** The picked image, cropped to a centred square and shrunk, as a JPEG data URL (about 10-30 kB). */
async function shrinkPhoto(file) {
  const img = await createImageBitmap(file);
  const side = Math.min(img.width, img.height);
  const canvas = h('canvas', { width: PHOTO_PX, height: PHOTO_PX });
  canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, PHOTO_PX, PHOTO_PX);
  return canvas.toDataURL('image/jpeg', 0.82);
}

let pickedPhoto; // undefined = leave the picture as it is
$('photo').addEventListener('change', async (e) => {
  const err = $('signup-error');
  err.hidden = true;
  const [file] = e.target.files;
  if (!file) return; // cancelled: the photo the preview shows is still the one that will be saved
  try {
    pickedPhoto = await shrinkPhoto(file);
    $('photo-preview').src = pickedPhoto;
    $('photo-preview').hidden = false;
  } catch {
    // An earlier good pick stays: the preview still shows it, so it is what gets saved.
    e.target.value = '';
    err.textContent = 'That image could not be read. Please pick another one.';
    err.hidden = false;
  }
});

// LinkedIn never tells apps your profile address, so you copy its share link yourself.
// "Open my LinkedIn" (index.html) goes to linkedin.com/in/me, your own profile when you are signed in there.
if (navigator.clipboard?.readText) {
  $('linkedin-paste').hidden = false;
  $('linkedin-paste').addEventListener('click', async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim();
      if (text) $('linkedin-input').value = text;
    } catch {
      $('linkedin-input').focus(); // permission refused: the keyboard's own paste still works
    }
  });
}

$('signup').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const err = $('signup-error');
  err.hidden = true;
  try {
    const fields = {
      name: f.get('name'), headline: f.get('headline'), linkedin: f.get('linkedin'),
      offers: f.getAll('offers'), seeks: f.getAll('seeks'), photo: pickedPhoto,
    };
    if (state.me) {
      // Signed in with LinkedIn or email already: this form completes the profile.
      state.me = (await api('POST', '/api/profile', fields)).me;
    } else {
      const out = await api('POST', '/api/signup', fields);
      state.token = out.token;
      state.me = out.me;
      localStorage.setItem('cc.token', out.token);
    }
    show('compass');
  } catch (ex) {
    err.textContent = ex.message;
    err.hidden = false;
  }
});

// ---------- compass ----------

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const compass = createCompass($('dial'), {
  onPick(id) {
    state.pickedId = id;
    lock.pin(id, state.shown); // a tap is a find: the dial shows their picture at once
    openCard(id);
  },
});

// The rose is a mass on a spring in damping fluid (physics.js): it follows the heading with
// inertia, overshoots a little and settles. All the numbers are in tuning.js.
const rose = createSpring(TUNING.rose);
// When the compass has found someone (lockon.js) the dial gives way to their picture (reveal.js).
const lock = createLockOn({ ...TUNING.lock, captureDeg: AIM_DEG });
const reveal = createReveal($('reveal'), { onDismiss: (id) => lock.dismiss(id) });

const heading = createHeading({
  onSource: () => {
    const byHand = heading.source === 'manual' || heading.source === 'denied';
    $('manual').textContent = byHand ? 'Use the sensor' : 'Turn by hand';
    document.querySelector('.dial-wrap').classList.toggle('is-by-hand', byHand); // grab cursor
    renderStatus();
    renderHint();
  },
  onQuality: () => renderHint(),
});

/** Compass trouble the user can do something about. Only iOS reports how sure its compass is. */
function renderHint() {
  const q = heading.quality, reading = heading.reading;
  let text = '';
  if (q === 'invalid' && heading.source !== 'denied') text = 'The compass has no reading yet. Move the phone in a figure of eight, away from metal.';
  else if (heading.source !== 'sensor') text = '';
  else if (q === 'poor') text = `The compass is unsure${reading?.accuracy > 0 ? ` (about ±${Math.round(reading.accuracy)}°)` : ''}. Move the phone in a figure of eight, away from metal. If it stays off, use “Turn by hand” under Demo tools.`;
  else if (q === 'paused') text = 'The compass sensor has stopped reporting. The dial shows its last reading. If it stays stuck, use “Turn by hand” under Demo tools.';
  $('hint-text').textContent = text;
  $('hint').hidden = !text;
}

function renderStatus() {
  const el = $('status');
  if (!state.running) return;
  const parts = [];
  const pos = state.position;
  if (!state.visible) parts.push('You are invisible. Nobody can point at you.');
  else if (!pos) parts.push(state.locationProblem ? 'No position, so you are not on anyone’s compass.' : 'Finding your position…');
  else if (pos.demo) parts.push('Demo position: Bush House.');
  else if (pos.accuracy > ROUGH_M) parts.push(`Your position is only good to about ${Math.round(pos.accuracy)} m, too rough to point at people. Step outside; on iPhone, turn on Precise Location for this site.`);
  else parts.push(`Position accurate to about ${Math.round(pos.accuracy)} m.`);

  if (heading.source === 'manual' && heading.byChoice) parts.push('Turning by hand: drag or flick the dial.');
  else if (heading.source === 'manual') parts.push('No compass sensor answered on this device, so you turn by hand: drag or flick the dial, scroll over it, or use the arrow keys.');
  else if (heading.source === 'denied') parts.push('Motion access was not allowed, so you turn by hand: drag or flick the dial.');
  else if (heading.source === 'none') parts.push('Waiting for the compass sensor…');

  if (state.position && state.visible) {
    const n = state.nearby.length;
    parts.push(n ? `${n} ${n === 1 ? 'person' : 'people'} within 500 m. Turn until the red needle points up.` : 'Nobody else is within 500 m yet.');
  }
  el.textContent = parts.join(' ');
}

// ---------- location ----------
// A real person is never put at a made-up position. With no position they are simply off every
// compass, and the page says why and what to do. The fixed demo position exists only as a button.

const LOCATE_HELP = {
  insecure: 'This page was opened over plain http, and phones only share their location with https pages. Open the https address instead: on the laptop that runs the app, “npm run phones” prints it with a QR code.',
  unsupported: 'This browser cannot share a location, so the compass has nowhere to point from. Try Safari or Chrome.',
  denied: 'Location access is off for this page, so nobody can find you and you cannot find them. Allow location for this site in your browser’s settings (iPhone: Settings, Privacy & Security, Location Services, Safari Websites), then tap “Try again”. If nothing happens, reload the page.',
  unavailable: 'Your device has not found its position yet. That is common indoors: go near a window or step outside, then tap “Try again”.',
};
const ON_DEMO = 'You are on a demo position (Bush House, London), not where you really are. Everyone who chooses it stands on the same spot, so it is only good for trying the app with demo people.';

function renderLocate() {
  const onDemo = Boolean(state.position?.demo);
  const problem = state.position ? null : state.locationProblem;
  $('locate').hidden = !state.running || (!problem && !onDemo);
  $('locate-text').textContent = onDemo ? ON_DEMO : LOCATE_HELP[problem] ?? '';
  $('locate-retry').textContent = onDemo ? 'Use my real position' : 'Try again';
  $('locate-retry').hidden = problem === 'insecure' || problem === 'unsupported';
  $('locate-demo').hidden = onDemo || !state.demo;
}

let watchId = null;
function stopWatching() {
  if (watchId !== null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

/** We no longer know where this person is: take them off other people's compasses now, not 45 s later. */
function losePosition(problem) {
  const wasShared = Boolean(state.position);
  state.position = null;
  state.locationProblem = problem;
  if (wasShared) api('POST', '/api/hide').catch(() => {});
  renderStatus();
  renderLocate();
}

function startLocation() {
  stopWatching();
  if (state.position?.demo) losePosition(null); // leaving the demo position for the real one
  if (!window.isSecureContext) return losePosition('insecure');
  if (!('geolocation' in navigator)) return losePosition('unsupported');
  state.locationProblem = null;
  watchId = navigator.geolocation.watchPosition(
    (p) => {
      const first = !state.position;
      state.position = { lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy };
      state.locationProblem = null;
      renderStatus();
      renderLocate();
      if (first) sync(); // report the first fix at once, so others see this person without waiting a tick
    },
    (e) => {
      if (e.code === e.PERMISSION_DENIED) { stopWatching(); return losePosition('denied'); }
      // A slow or missed update: keep a position we already have, the watch is still running.
      if (!state.position) losePosition('unavailable');
    },
    { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 },
  );
  renderStatus();
  renderLocate();
}
$('locate-retry').addEventListener('click', startLocation);
$('locate-demo').addEventListener('click', () => {
  stopWatching();
  state.position = { ...BUSH_HOUSE, demo: true };
  state.locationProblem = null;
  renderStatus();
  renderLocate();
  sync();
});

let syncing = false, syncAgain = false;
async function sync() {
  if (!state.running || !state.token) return;
  // One request at a time: over a slow link, overlapping answers could land out of order and show stale people.
  if (syncing) { syncAgain = true; return; }
  syncing = true;
  try {
    const p = state.visible ? state.position : null;
    // With a time limit: one answer that never arrives would otherwise hold the guard above for good.
    const out = await api('POST', '/api/sync', p ? { lat: p.lat, lon: p.lon, accuracy: p.accuracy } : {}, SYNC_TIMEOUT_MS);
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
    $('status').textContent = `Cannot reach the server: ${ex.name === 'TimeoutError' ? `no answer after ${SYNC_TIMEOUT_MS / 1000} seconds. Trying again…` : ex.message}`;
  } finally {
    syncing = false;
    if (syncAgain) { syncAgain = false; sync(); }
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
// Coming back to the page (phone unlocked, tab switched back): show up again at once, not on the next tick.
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') sync(); });

// Turning by hand (laptops, refused permission, or a drifting indoor compass). Every input here
// moves the one heading in heading.js, which is a wheel with friction, and the dial follows that
// heading through the same spring as it follows a sensor. While the sensor is in charge these do
// nothing.
{
  const wrap = document.querySelector('.dial-wrap');
  const S = TUNING.spin;
  let pointer = null; // the finger or mouse button holding the dial: { id, angle, x, y, engaged }
  let dragged = false; // the last press moved: the click that follows is not a tap
  let rotation = null; // Safari two-finger rotation in progress: the last angle it reported
  /** Where the pointer is around the centre of the dial: its angle, and how far out (0..1). */
  const around = (e) => {
    const r = wrap.getBoundingClientRect();
    const x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    return { angle: (Math.atan2(y, x) * 180) / Math.PI, out: Math.hypot(x, y) / (r.width / 2) };
  };

  // Drag: the dial stays under the finger. Let go while moving and it keeps spinning.
  wrap.addEventListener('pointerdown', (e) => {
    dragged = false;
    if (!state.running || pointer || rotation !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
    // held: the dial is in hand (grabbing also stops a dial that is still spinning). While the
    // sensor is in charge the press is only watched, so that a swipe is still not taken for a tap.
    pointer = { id: e.pointerId, angle: around(e).angle, x: e.clientX, y: e.clientY, engaged: false, held: heading.grab(e.timeStamp) };
  });
  window.addEventListener('pointermove', (e) => {
    if (!pointer || e.pointerId !== pointer.id) return;
    const { angle, out } = around(e);
    if (!pointer.engaged) {
      // A tap wobbles by a few pixels, and a finger slides more than a mouse: under 10 px it is
      // still a tap, and must not turn the dial or count as a drag.
      if (Math.hypot(e.clientX - pointer.x, e.clientY - pointer.y) < 10) return;
      pointer.engaged = dragged = true;
      if (pointer.held) wrap.classList.add('is-grabbed');
    }
    // Right at the pivot a hair's width is half a turn, so the dial only follows further out.
    if (pointer.held && out > 0.12) heading.drag(-angleDiff(pointer.angle, angle), e.timeStamp); // rose clockwise = you turn anticlockwise
    pointer.angle = angle;
  });
  const letGo = (e) => {
    if (!pointer || e.pointerId !== pointer.id) return;
    if (pointer.held) heading.release(e.timeStamp);
    pointer = null;
    wrap.classList.remove('is-grabbed');
    setTimeout(() => { dragged = false; }, 0); // after the click this release may produce
  };
  window.addEventListener('pointerup', letGo);
  window.addEventListener('pointercancel', letGo);
  // A drag that ends on a person's dot, or on the picture, is not a tap on it.
  wrap.addEventListener('click', (e) => { if (dragged) { dragged = false; e.stopPropagation(); e.preventDefault(); } }, true);

  // Wheel, or two fingers sliding on a trackpad, with the pointer over the dial.
  wrap.addEventListener('wheel', (e) => {
    if (!state.running || e.ctrlKey || heading.source === 'sensor') return; // ctrl + wheel is pinch-zoom
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    const px = Math.max(-300, Math.min(300, e.deltaMode === 1 ? d * 16 : e.deltaMode === 2 ? d * 120 : d));
    e.preventDefault(); // turn the dial, not the page
    heading.turn(px * S.wheelDegPerPx);
  }, { passive: false });

  // Two fingers turning on a trackpad or on the screen. Only Safari sends these events; its
  // `rotation` is the angle since the gesture began, clockwise positive.
  wrap.addEventListener('gesturestart', (e) => {
    if (!state.running || heading.source === 'sensor') return;
    e.preventDefault();
    pointer = null; // the first finger may have begun a drag: the gesture replaces it
    if (heading.grab(e.timeStamp)) rotation = Number(e.rotation) || 0;
  });
  wrap.addEventListener('gesturechange', (e) => {
    if (rotation === null) return;
    e.preventDefault();
    const now = Number(e.rotation) || 0;
    heading.drag(-(now - rotation), e.timeStamp);
    rotation = now;
  });
  wrap.addEventListener('gestureend', (e) => {
    if (rotation === null) return;
    rotation = null;
    heading.release(e.timeStamp);
  });

  // Arrow keys: a tap turns one step. Holding the key spins the dial up; letting go takes most of
  // that speed away at once, so it coasts a little and stops close to where the key was released.
  let keySpin = false; // the spin now on the dial was put there by a held key
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!state.running || $('view-compass').hidden || e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    const dir = e.key === 'ArrowRight' ? 1 : -1;
    if (e.repeat && !reduceMotion.matches) { heading.push(dir * S.keyPush, S.keyMaxRate); keySpin = true; }
    else heading.turn(dir * S.keyStepDeg);
    e.preventDefault();
  });
  window.addEventListener('keyup', (e) => {
    if (!keySpin || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    keySpin = false;
    heading.push(-heading.spin * S.keyBrake);
  });
}

let lastFrame = 0;
let steadied = null; // reduced motion only: the sensor heading with its tremble taken out

function frame(now) {
  // Real time since the last frame, so the motion is the same at any frame rate. A long gap
  // (a background tab) counts as one slow frame instead of one enormous step.
  const dt = lastFrame ? Math.min(now - lastFrame, TUNING.maxFrameMs) : 0;
  lastFrame = now;
  heading.tick(dt, now); // by hand: momentum and friction

  let input = heading.value;
  if (input !== null) {
    const reduce = reduceMotion.matches;
    if (reduce && heading.source === 'sensor') {
      // No tremble: a reading that moved less than the dead band changes nothing.
      if (steadied === null || Math.abs(angleDiff(steadied, input)) > TUNING.reduced.deadbandDeg) steadied = input;
      input = steadied;
    } else steadied = null;
    rose.tune(reduce ? TUNING.reduced : heading.grabbed ? TUNING.grab : TUNING.rose);
    state.shown = rose.step(input, dt);
  }

  // Who is straight ahead, and has the compass found them? Only while the compass is on screen.
  const watching = state.running && !$('view-compass').hidden;
  const aim = lock.update(watching ? state.nearby : [], state.shown, rose.velocity, dt);
  state.aimedId = aim.aimedId;
  if (aim.event === 'lock') {
    openCard(aim.lockedId);
    navigator.vibrate?.(30);
  }
  // The needle leads to the person you tapped, otherwise to your best match.
  const stillHere = state.nearby.some((p) => p.id === state.pickedId);
  const targetId = stillHere ? state.pickedId : state.nearby[0]?.id ?? null;
  const person = (id) => (id ? state.nearby.find((p) => p.id === id) : null) ?? null;
  // Fetch the pictures that may be wanted next, so the reveal does not wait on the network.
  reveal.preload(person(targetId));
  reveal.preload(person(aim.aimedId));
  // Found someone: the dial fades into their picture. Lost them: it fades back.
  reveal.set(person(aim.lockedId), aim.offset);
  // The lock ring fills during the dwell and stays closed while the dial fades into the picture.
  const ring = aim.lockedId !== null && aim.lockedId === aim.aimedId ? 1 : aim.progress;
  compass.render(state.shown, { targetId, aimedId: aim.aimedId, lock: ring, dtMs: dt, turnRate: rose.velocity });
  renderSensor(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Demo tools: what the heading is made from, live. This is the readout for checks on a real phone.
let sensorDrawn = 0;
function renderSensor(now) {
  const out = $('sensor');
  if (now - sensorDrawn < 250 || !out.closest('details').open) return;
  sensorDrawn = now;
  const deg = (n) => (Number.isFinite(n) ? `${n.toFixed(1)}°` : 'none');
  const how = {
    sensor: 'the compass sensor',
    manual: heading.byChoice ? 'by hand (your choice)' : 'by hand (no compass sensor answered)',
    denied: 'by hand (motion access was not allowed)',
    none: 'waiting for a sensor',
  }[heading.source];
  const lines = [`Heading input: ${how}`, `heading ${deg(heading.value)}   on the dial ${deg(state.shown)}   turning ${rose.velocity.toFixed(0)}°/s`];
  const r = heading.reading;
  if (!r) lines.push('No sensor event has arrived.');
  else {
    lines.push(`Last sensor event: ${r.event}, about ${r.hz.toFixed(0)} a second, ${(r.ageMs / 1000).toFixed(1)} s ago`);
    lines.push(`alpha ${deg(r.alpha)}  beta ${deg(r.beta)}  gamma ${deg(r.gamma)}  screen ${r.screen}°`);
    if (r.kind === 'webkit') lines.push(`webkitCompassHeading ${deg(r.compass)}  accuracy ${r.accuracy === null ? 'not reported' : `±${r.accuracy}°`} (${heading.quality})`);
    lines.push(`-> heading ${Number.isFinite(r.heading) ? `${r.heading.toFixed(2)}°` : 'none (reading skipped)'}`);
  }
  out.textContent = lines.join('\n');
}

// ---------- profile card ----------

function openCard(id) {
  state.cardId = id;
  renderCard();
}

function closeCard(id) {
  state.cardId = null;
  state.pickedId = null;
  $('card').hidden = true;
  lock.dismiss(id); // the dial goes back to the compass, and stays there until the aim moves on
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
  const act = (fn, done) => async (e) => {
    // Keep the button: e.currentTarget is gone after the await. On failure give it back, or the card
    // (rebuilt only when something visible changes) would leave it disabled for good.
    const button = e.currentTarget;
    button.disabled = true;
    try { await fn(); done?.(); } catch (ex) { alert(ex.message); button.disabled = false; }
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
      h('button', { class: 'primary', type: 'button', onclick: act(() => api('POST', '/api/requests/respond', { id: requestId, action: 'accept' }), () => playConfirm('Connected')) }, 'Accept'),
      h('button', { class: 'ghost', type: 'button', onclick: act(() => api('POST', '/api/requests/respond', { id: requestId, action: 'decline' })) }, 'Decline'),
    ];
  }
  if (relation === 'outgoing') return [h('button', { class: 'primary', type: 'button', disabled: true }, 'Invitation sent, waiting')];
  if (relation === 'declined-by-them') return [h('p', { class: 'note' }, 'They declined your invitation.')];
  return [h('button', { class: 'primary', type: 'button', onclick: act(() => api('POST', '/api/requests', { toId: person.id }), () => playConfirm('Invitation sent')) }, 'Send invitation')];
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
    h('div', { class: 'card-head' }, h('div', { class: 'row-head' }, p.picture ? h('img', { class: 'avatar', src: p.picture, alt: '' }) : null, h('h2', {}, p.name)), h('span', { class: 'where' }, where)),
    p.headline ? h('p', {}, p.headline) : null,
    why(p),
    tags(p),
    p.relation === 'connected' ? null : h('p', {}, linkedinLink(p)),
    h('div', { class: 'actions' }, actions(p, p.relation, p.requestId),
      h('button', { class: 'ghost', type: 'button', onclick: () => closeCard(p.id) }, 'Close')),
  ].filter(Boolean));
  card.hidden = false;
}

// ---------- people tab ----------

function row(item, relation) {
  const p = item.person;
  return h('article', { class: 'row' },
    h('div', { class: 'row-head' }, p.picture ? h('img', { class: 'avatar', src: p.picture, alt: '' }) : null, h('h3', {}, p.name)),
    p.headline ? h('p', {}, p.headline) : null,
    why(p),
    tags(p),
    relation === 'connected' ? null : h('p', {}, linkedinLink(p)),
    h('div', { class: 'actions' }, actions(p, relation, item.id)),
  );
}

/** For someone who signed in with LinkedIn: what we keep from LinkedIn, and the button that deletes it. */
async function renderLinkedinData() {
  if (state.me?.signedInWith !== 'linkedin') return;
  const { profile } = await api('GET', '/api/linkedin/me');
  const when = (ms) => new Date(ms).toLocaleString();
  $('linkedin-data').hidden = false;
  $('linkedin-record').replaceChildren(profile
    ? h('article', { class: 'row' },
      h('p', {}, `From LinkedIn we keep LinkedIn’s id for you, your name (${profile.name ?? 'none given'}), ${profile.email ? `your email address (${profile.email})` : 'no email address'}, the link to your LinkedIn photo, your language setting and LinkedIn’s answer as we received it. First recorded ${when(profile.firstSeenMs)}, last read ${when(profile.lastRefreshedMs)}. Other people see your name and photo only.`),
      h('div', { class: 'actions' }, h('button', {
        class: 'ghost', type: 'button',
        onclick: async () => {
          if (!confirm('Delete what we keep from LinkedIn about you? Your profile in this app stays, and people will see your initials unless you picked a photo.')) return;
          await api('POST', '/api/linkedin/forget').catch((ex) => alert(ex.message));
          renderLinkedinData();
        },
      }, 'Delete my LinkedIn data')))
    : h('p', { class: 'empty' }, 'Your LinkedIn email, photo link and language are deleted. We keep only the LinkedIn id that lets you sign in again. They are recorded again if you sign in with LinkedIn again.'));
}
$('tab-people').addEventListener('click', () => renderLinkedinData().catch(() => {}));

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
  // Demo people are placed around you, so there has to be a position: your real one, or the demo one you chose.
  const p = state.position;
  if (!p) return alert(!state.running ? 'Start the compass first.' : state.locationProblem ? 'Your position is not known. See the message under the compass, or choose the demo position there.' : 'Still finding your position. Answer the browser’s location question if it is asking; otherwise a message with a demo-position button appears under the compass within 15 seconds.');
  try { await api('POST', '/api/demo/seed', { lat: p.lat, lon: p.lon }); sync(); } catch (ex) { alert(ex.message); }
});
$('manual').addEventListener('click', () => {
  // The label follows the heading source (see createHeading above), which can also change by itself.
  heading.manual(heading.source !== 'manual' && heading.source !== 'denied');
});
$('hide').addEventListener('click', async () => {
  state.visible = !state.visible;
  if (!state.visible) {
    try { await api('POST', '/api/hide'); } catch (ex) { state.visible = true; alert(`Could not hide you: ${ex.message}`); }
  }
  $('hide').textContent = state.visible ? 'Go invisible' : 'Become visible';
  sync();
});

function signOut() {
  if (state.token) fetch('/api/hide', { method: 'POST', keepalive: true, headers: { Authorization: `Bearer ${state.token}` } }).catch(() => {});
  const viaEmail = Boolean(state.logto && state.me?.signedInWith === 'email');
  localStorage.removeItem('cc.token');
  // Signed in with email: end the Logto session too, or the next tap on "Sign in" would silently reuse it.
  // (LinkedIn offers no such address: on a shared device, sign out at linkedin.com as well.)
  if (viaEmail) location.assign(state.logto.signOutUrl());
  else location.reload();
}
$('signout').addEventListener('click', signOut);

// Leaving the page takes you off other people's compasses straight away.
window.addEventListener('pagehide', () => {
  if (state.token && state.running) fetch('/api/hide', { method: 'POST', keepalive: true, headers: { Authorization: `Bearer ${state.token}` } });
});

// ---------- boot ----------

/** After signing in with LinkedIn or email for the first time there is no profile yet: ask for it. */
function enter() {
  if (!state.me.needsProfile) return show('compass');
  const viaLinkedin = state.me.signedInWith === 'linkedin';
  $('signup-lede').textContent = viaLinkedin
    ? 'You are signed in with LinkedIn, so we have your name and photo. One more step: LinkedIn does not tell apps your profile link, so please paste its share link here.'
    : 'You are signed in. Tell people who you are, so the compass has something to show them.';
  // A LinkedIn sign-in already gave us the name and photo: ask only for the share link
  // (and the name too, in the rare case LinkedIn sent none).
  $('signup').classList.toggle('linkedin-only', viaLinkedin);
  $('name-field').classList.toggle('keep', viaLinkedin && !state.me.name);
  $('signup-submit').textContent = 'Save my profile';
  $('signup').elements.name.value = state.me.name ?? '';
  // The picture people will see: the LinkedIn photo, or initials until a photo is picked.
  $('photo-preview').src = state.me.picture;
  $('photo-preview').hidden = false;
  if (viaLinkedin) $('photo-hint').textContent = '(this is your LinkedIn photo; pick another to replace it)';
  show('signup');
}

$('signin').addEventListener('click', async () => {
  $('signin').disabled = true;
  try { await state.logto.signIn(); } catch (ex) {
    $('welcome-error').textContent = `Sign-in could not start: ${ex.message}`;
    $('welcome-error').hidden = false;
    $('signin').disabled = false;
  }
});
$('signin-linkedin').addEventListener('click', () => {
  $('signin-linkedin').disabled = true;
  linkedin.signIn();
  setTimeout(() => { $('signin-linkedin').disabled = false; }, 8000); // the page was never left
});
// Back from the sign-in page brings this page back exactly as it was left: buttons still disabled.
window.addEventListener('pageshow', (e) => {
  if (!e.persisted || !state.signinOn) return;
  $('signin').disabled = !state.signinOn.email;
  $('signin-linkedin').disabled = !state.signinOn.linkedin;
});
$('quick').addEventListener('click', () => show('signup'));

(async function boot() {
  let health = {};
  try { health = await api('GET', '/api/health'); } catch { /* offline: sign-up will report it */ }
  state.demo = Boolean(health.demo);
  state.logto = health.auth ? createLogto(health.auth) : null;
  $('seed').hidden = !state.demo;
  $('quick').hidden = !health.quickSignup;
  // Both ways to sign in are always offered. One this server has not set up stays visible but greyed out,
  // so the choice never silently disappears (it did when .env had neither LOGTO_APP_ID nor LINKEDIN_*).
  state.signinOn = { email: Boolean(state.logto), linkedin: Boolean(health.linkedin) };
  const notSetUp = 'Not set up on this server yet.';
  $('signin').disabled = !state.signinOn.email;
  $('signin-linkedin').disabled = !state.signinOn.linkedin;
  if (!state.signinOn.email) $('signin-fine').textContent = notSetUp;
  if (!state.signinOn.linkedin) $('signin-linkedin-fine').textContent = notSetUp;
  if (state.signinOn.linkedin || !state.signinOn.email) $('signin').className = 'ghost'; // one main button
  if (!state.signinOn.email && !state.signinOn.linkedin && !health.quickSignup) {
    $('welcome-error').textContent = 'No way to sign in is set up on this server yet.';
    $('welcome-error').hidden = false;
  }
  if (health.linkedin?.standIn) $('signin-linkedin').textContent = 'Sign in with LinkedIn (local stand-in)';
  renderEngine();

  const signedIn = (out) => {
    state.token = out.token;
    state.me = out.me;
    localStorage.setItem('cc.token', out.token);
    enter();
  };
  const refused = (ex) => {
    $('welcome-error').textContent = ex.message;
    $('welcome-error').hidden = false;
    show('welcome');
  };
  // Coming back from LinkedIn: our server did the exchange and left a one-time handoff code for this page.
  const fromLinkedin = linkedin.takeReturn();
  if (fromLinkedin) {
    try {
      if (fromLinkedin.error) throw new Error(fromLinkedin.error);
      return signedIn(await api('POST', '/api/linkedin/session', { code: fromLinkedin.code }));
    } catch (ex) {
      return refused(ex);
    }
  }
  // Coming back from Logto: swap the one-time code for a session with our server.
  if (state.logto?.returning) {
    try {
      return signedIn(await api('POST', '/api/session', { idToken: await state.logto.finishSignIn() }));
    } catch (ex) {
      return refused(ex);
    }
  }
  if (state.token) {
    try {
      state.me = (await api('GET', '/api/me')).me;
      return enter();
    } catch {
      localStorage.removeItem('cc.token');
      state.token = null;
    }
  }
  show('welcome');
})();
