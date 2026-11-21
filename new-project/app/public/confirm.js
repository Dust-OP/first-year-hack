// Success confirmation, in the style of a "payment approved" check: a blue disc grows in, a white
// tick draws itself, a ring ripples out, then the whole thing fades away. Played when you send an
// invitation and when you accept one. It never blocks the page (pointer-events: none) and a
// second call while one is playing restarts it. Styles: confirm.css.

const SVG = 'http://www.w3.org/2000/svg';
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

const OUT = 'cubic-bezier(.22, 1, .36, 1)';
const SPRING = 'cubic-bezier(.34, 1.56, .64, 1)';
const IN = 'cubic-bezier(.55, 0, .75, .2)';

const HOLD = 1150; // ms the tick stays fully on screen before fading
const FADE = 340;

let layer = null;
let parts = null;
let running = [];
let watchdog = 0;

function svg(tag, attrs) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

function build() {
  layer = document.createElement('div');
  layer.className = 'cc-confirm';
  layer.hidden = true;
  layer.setAttribute('role', 'status');
  layer.setAttribute('aria-live', 'polite');

  const scrim = document.createElement('div');
  scrim.className = 'cc-confirm-scrim';

  const badge = document.createElement('div');
  badge.className = 'cc-confirm-badge';

  const art = svg('svg', { viewBox: '0 0 120 120', 'aria-hidden': 'true' });
  const ripple = svg('circle', { class: 'cc-confirm-ripple', cx: 60, cy: 60, r: 46 });
  const disc = svg('circle', { class: 'cc-confirm-disc', cx: 60, cy: 60, r: 46 });
  const tick = svg('path', { class: 'cc-confirm-tick', d: 'M38 61.5 L53.5 76 L83 45', pathLength: 1 });
  art.append(ripple, disc, tick);

  const label = document.createElement('p');
  label.className = 'cc-confirm-label';

  badge.append(art, label);
  layer.append(scrim, badge);
  document.body.append(layer);
  parts = { scrim, badge, ripple, disc, tick, label };
}

/** Show the blue tick with a short caption, e.g. "Invitation sent". Never throws. */
export function playConfirm(text = 'Done') {
  try { play(text); } catch (ex) { console.warn('confirm animation skipped:', ex); if (layer) layer.hidden = true; }
}

function play(text) {
  if (!layer) build();
  for (const a of running) a.cancel();
  const { scrim, badge, ripple, disc, tick, label } = parts;
  label.textContent = text;
  layer.hidden = false;
  navigator.vibrate?.([18, 60, 28]);

  const end = HOLD + FADE;
  const at = (ms) => ms / end; // keyframe offset from a time in ms
  const timing = { duration: end, fill: 'forwards' };

  if (reduceMotion.matches) {
    // No growth, drawing or ripple: the finished tick fades in and out.
    tick.style.strokeDashoffset = '0';
    running = [
      scrim.animate([{ opacity: 0 }, { opacity: 1, offset: at(150) }, { opacity: 1, offset: at(HOLD) }, { opacity: 0 }], timing),
      badge.animate([{ opacity: 0 }, { opacity: 1, offset: at(150) }, { opacity: 1, offset: at(HOLD) }, { opacity: 0 }], timing),
    ];
  } else {
    tick.style.strokeDashoffset = '';
    running = [
      scrim.animate([
        { opacity: 0 },
        { opacity: 1, offset: at(180), easing: 'linear' },
        { opacity: 1, offset: at(HOLD), easing: IN },
        { opacity: 0 },
      ], timing),
      // The disc pops in with a little overshoot.
      disc.animate([
        { transform: 'scale(0)', easing: SPRING },
        { transform: 'scale(1)', offset: at(420) },
        { transform: 'scale(1)' },
      ], timing),
      // The tick draws itself once the disc has landed.
      tick.animate([
        { strokeDashoffset: 1, offset: 0 },
        { strokeDashoffset: 1, offset: at(260), easing: OUT },
        { strokeDashoffset: 0, offset: at(640) },
        { strokeDashoffset: 0 },
      ], timing),
      // A ring ripples outwards as the tick completes.
      ripple.animate([
        { transform: 'scale(1)', opacity: 0, offset: 0 },
        { transform: 'scale(1)', opacity: .55, offset: at(330), easing: OUT },
        { transform: 'scale(1.55)', opacity: 0, offset: at(1000) },
        { transform: 'scale(1.55)', opacity: 0 },
      ], timing),
      label.animate([
        { opacity: 0, transform: 'translateY(6px)', offset: 0 },
        { opacity: 0, transform: 'translateY(6px)', offset: at(420), easing: OUT },
        { opacity: 1, transform: 'none', offset: at(700) },
        { opacity: 1, transform: 'none' },
      ], timing),
      // Everything leaves together: a slight shrink and fade.
      badge.animate([
        { opacity: 1, transform: 'none', offset: 0 },
        { opacity: 1, transform: 'none', offset: at(HOLD), easing: IN },
        { opacity: 0, transform: 'scale(.92)' },
      ], timing),
    ];
  }

  const mine = running;
  const finish = () => {
    if (running !== mine) return; // a newer play took over
    clearTimeout(watchdog);
    layer.hidden = true;
    for (const a of mine) a.cancel();
    running = [];
  };
  clearTimeout(watchdog);
  watchdog = setTimeout(finish, end + 600); // in case a finished promise never settles
  Promise.all(mine.map((a) => a.finished)).then(finish, () => {});
}
