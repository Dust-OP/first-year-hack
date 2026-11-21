// Presentation only. Watches the page that app.js draws and adds short-lived classes, so every
// action has a visible in-between stage: busy shimmer while a request runs, a settle when text
// changes, rows that slide and fade instead of popping. It changes no app behaviour: no state,
// no requests, no handlers that app.js depends on. Delete this file and the app still works.
// The matching styles are in style.css.

const $ = (id) => document.getElementById(id);
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const EASE = 'cubic-bezier(.22, 1, .36, 1)';

/** Restart a one-shot animation class. */
function replay(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; // force a style flush so the animation starts again
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

/** Call back when an element's text really changes (app.js re-sets the same text often). */
function onText(el, fn) {
  if (!el) return;
  let last = el.textContent;
  new MutationObserver(() => {
    if (el.textContent === last) return;
    last = el.textContent;
    fn(last);
  }).observe(el, { childList: true, characterData: true, subtree: true });
}

// ---------- text that changes in place ----------

onText($('status'), () => replay($('status'), 'is-changed'));
onText($('badge'), () => replay($('badge'), 'is-bumped'));
onText($('signup-error'), () => replay($('signup-error'), 'is-shaken'));
onText($('welcome-error'), () => replay($('welcome-error'), 'is-shaken'));
onText($('manual'), () => replay($('manual'), 'is-changed'));
onText($('hide'), (t) => {
  replay($('hide'), 'is-changed');
  document.querySelector('.dial-wrap')?.classList.toggle('is-invisible', /^Become/.test(t));
});

// ---------- busy: from the tap until the answer arrives ----------

const busyTimers = new WeakMap();
function busy(btn, ms = 8000) {
  btn.classList.add('is-busy');
  btn.setAttribute('aria-busy', 'true');
  clearTimeout(busyTimers.get(btn));
  busyTimers.set(btn, setTimeout(() => idle(btn), ms));
}
function idle(btn) {
  btn.classList.remove('is-busy');
  btn.removeAttribute('aria-busy');
}

// A button that app.js disables in its own click handler is waiting on the server
// (Send invitation, Accept, Decline, Sign in). Its row or card is rebuilt when the answer comes,
// which removes the button and so ends the shimmer; the timer covers a failed request.
const enabledAtTap = new WeakSet();
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (b && !b.disabled) enabledAtTap.add(b);
}, true);
document.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (enabledAtTap.has(b) && b.disabled) busy(b);
  enabledAtTap.delete(b);
});

// Add demo people: busy until the next status update reports them.
$('seed')?.addEventListener('click', () => busy($('seed'), 4000));
onText($('status'), () => { if ($('seed')) idle($('seed')); });

// Create / save profile: busy until the view changes or an error shows.
$('signup')?.addEventListener('submit', () => busy($('signup-submit'), 10000));
new MutationObserver(() => {
  if ($('view-signup').hidden || !$('signup-error').hidden) idle($('signup-submit'));
}).observe(document.body, { attributes: true, attributeFilter: ['hidden'], subtree: true });

// Start compass: the dial wakes up.
$('start')?.addEventListener('click', () => replay(document.querySelector('.dial-wrap'), 'is-live'));

// Sign out: fade the page before it reloads or goes to Logto.
$('signout')?.addEventListener('click', () => document.body.classList.add('is-leaving'));

// ---------- profile card ----------

{
  const card = $('card');
  const parse = (key) => { try { return JSON.parse(key); } catch { return null; } };
  new MutationObserver((records) => {
    let wasHidden = card.hidden, oldKey = null, keyChanged = false;
    for (const r of records) {
      if (r.attributeName === 'hidden') wasHidden = r.oldValue !== null;
      if (r.attributeName === 'data-key' && !keyChanged) { oldKey = parse(r.oldValue); keyChanged = true; }
    }
    // Opening and closing are handled in CSS (@starting-style and the [hidden] transition).
    if (card.hidden || wasHidden || !keyChanged) return;
    const next = parse(card.dataset.key);
    if (!oldKey || !next) return;
    const [oldId, oldRelation, oldDistance] = oldKey;
    const [id, relation, distance] = next;
    if (oldId !== id) return replay(card, 'is-swapping'); // another person: cross-fade the content
    if (oldRelation !== relation) {
      replay(card.querySelector('.actions'), 'is-arriving');
      if (relation === 'connected') replay(card, 'is-celebrating');
      return;
    }
    if (oldDistance !== distance) replay(card.querySelector('.where'), 'is-changed');
  }).observe(card, { attributes: true, attributeFilter: ['hidden', 'data-key'], attributeOldValue: true });
}

// ---------- people lists: rows slide to their new place, new rows arrive, old rows fade ----------

for (const id of ['incoming', 'connections', 'outgoing']) {
  const list = $(id);
  if (!list) continue;
  const keyOf = (row) => row.querySelector('h3')?.textContent ?? row.textContent;
  let before = new Map(); // key -> { node, top, left, width }

  const snapshot = () => {
    before = new Map();
    for (const row of list.children) {
      if (row.classList.contains('ghost-row')) continue;
      before.set(keyOf(row), { node: row, top: row.offsetTop, left: row.offsetLeft, width: row.offsetWidth });
    }
  };
  const shown = () => list.offsetParent !== null; // false while the People tab is hidden

  new MutationObserver(() => {
    if (!shown() || reduceMotion.matches) return snapshot();
    const seen = new Set();
    for (const row of list.children) {
      if (row.classList.contains('ghost-row')) continue;
      const key = keyOf(row);
      seen.add(key);
      const old = before.get(key);
      if (!old) {
        row.classList.add('is-new');
        if (id === 'connections' && row.matches('.row')) replay(row, 'is-celebrating');
        continue;
      }
      const dy = old.top - row.offsetTop;
      if (dy) row.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 480, easing: EASE });
    }
    for (const [key, old] of before) {
      if (seen.has(key)) continue;
      const ghost = old.node.cloneNode(true);
      ghost.classList.add('ghost-row');
      ghost.classList.remove('is-new', 'is-celebrating');
      Object.assign(ghost.style, { top: `${old.top}px`, left: `${old.left}px`, width: `${old.width}px` });
      ghost.setAttribute('aria-hidden', 'true');
      ghost.inert = true;
      list.append(ghost);
      ghost.animate(
        [{ opacity: 1, transform: 'none', filter: 'none' }, { opacity: 0, transform: 'scale(.94)', filter: 'blur(8px)' }],
        { duration: 280, easing: 'cubic-bezier(.55, 0, .75, .2)', fill: 'forwards' },
      ).finished.then(() => ghost.remove(), () => ghost.remove());
    }
    snapshot();
  }).observe(list, { childList: true });

  // Positions are only real while the tab is on screen: take a fresh snapshot when it opens.
  new MutationObserver(() => { if (shown()) requestAnimationFrame(snapshot); })
    .observe($('view-people'), { attributes: true, attributeFilter: ['hidden'] });
}
