// Which way is the user facing? Degrees clockwise from north, 0..360.
//
// Two ways to know:
//
// 1. The phone's compass sensor.
//    - Ask DeviceOrientationEvent.requestPermission() from a tap wherever it exists. iOS shows a
//      prompt; Chrome has the function too (seen in Chromium 156) and normally answers 'granted'
//      without asking.
//    - Safari on iPhone and iPad: read `webkitCompassHeading`, which iOS has already corrected for
//      tilt. `webkitCompassAccuracy` is iOS's own estimate of the error in degrees; negative means
//      "no valid heading".
//    - Everything else: `deviceorientationabsolute` (or `deviceorientation` when it says
//      absolute: true). Its alpha/beta/gamma describe the phone's whole attitude, and
//      headingFromEuler() below turns them into the direction the user is pointing. The old
//      shortcut `360 - alpha` is only right while the phone lies flat.
//    - The screen rotation is added in both cases, so landscape works.
//    A reading that is missing or not a number is skipped and the last good one is kept.
//
// 2. By hand, when no sensor answers (laptops), motion access is refused, or the user asks for it
//    because an indoor compass is drifting. The heading is then a wheel with friction: drag it and
//    it follows the finger, let go while moving and it keeps spinning until friction stops it.
//    Wheel, two-finger rotation and the arrow keys all turn the same wheel (wired in app.js).
//    If a real sensor answers later, it takes over on its own, unless the user chose "by hand".
//
// Either way the result is `value`, and the dial follows it through the spring in physics.js.
//
//   const h = createHeading({ onSource(source), onQuality(quality) })
//   h.value      degrees, or null before anything is known
//   h.source     'none' | 'sensor' | 'manual' | 'denied'   (denied = by hand, permission not given)
//   h.byChoice   true when 'manual' is the user's own choice, not the lack of a sensor
//   h.quality    'unknown' | 'good' | 'poor' | 'invalid' | 'paused'   (only iOS reports accuracy)
//   h.reading    the last raw sensor sample, for the demo-tools readout
//   h.start()    call from a tap: iOS shows its permission prompt here
//   h.manual(on) the "Turn by hand" switch
//   h.turn(deg)  by hand: turn at once
//   h.grab(now) / h.drag(deg, now) / h.release(now)   by hand: hold, move, let go (may flick)
//   h.push(rate, max)   by hand: add speed
//   h.grabbed, h.spin   is it held, how fast is it spinning
//   h.tick(dtMs, now)   call every frame: friction, and the check for a sensor that went quiet

import { wrap360 } from './physics.js';
import { TUNING } from './tuning.js';

const RAD = Math.PI / 180;
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)') ?? { matches: false };

/**
 * The compass heading of the way the user is pointing the phone, from one absolute
 * DeviceOrientation reading. Returns degrees clockwise from north, or null when the answer is
 * undefined for that attitude.
 *
 * The three angles are a rotation R = Rz(alpha) Rx(beta) Ry(gamma) from the phone's axes
 * (x right, y to the top edge, z out of the screen) to the world's (east, north, up); this is the
 * matrix in the W3C DeviceOrientation spec. Working from the matrix instead of from alpha alone
 * also survives the jumps the angles make (alpha flips by 180 when gamma passes 90).
 *
 *  - Lying flat or tilted like a remote control: the user points with the top edge, so the
 *    heading is that edge's direction on the ground. For a flat phone this is 360 - alpha.
 *  - Held upright like a camera: the top edge points at the sky and says nothing, so the heading
 *    is where the back of the phone faces. This is the `compassHeading` example in the spec.
 *  - In between (flatUntilDeg..uprightFromDeg of lift, 65 to 80 degrees in tuning.js) the two are
 *    blended. With no sideways roll they agree exactly, so the hand-over is seamless. With a roll
 *    they differ, because the back of the phone turns with the wrist: below flatUntilDeg a roll
 *    does not move the heading at all, above it the heading starts to follow the wrist.
 *  - screenAngle (screen.orientation.angle) picks which edge is "top" as the user sees the page.
 *
 * Limit: leaning an upright phone back past vertical by about 21 degrees (with 65 and 80) flips
 * the answer by 180, because the top edge then points behind the user. No formula avoids a flip
 * somewhere; this puts it where nobody holds a phone.
 */
export function headingFromEuler(alpha, beta, gamma, screenAngle = 0, tuning = TUNING.sensor) {
  if (!Number.isFinite(alpha)) return null;
  const a = alpha * RAD, b = (Number.isFinite(beta) ? beta : 0) * RAD, g = (Number.isFinite(gamma) ? gamma : 0) * RAD;
  const cA = Math.cos(a), sA = Math.sin(a), cB = Math.cos(b), sB = Math.sin(b), cG = Math.cos(g), sG = Math.sin(g);
  // The phone's axes in world coordinates [east, north, up]: the columns of R.
  const X = [cA * cG - sA * sB * sG, sA * cG + cA * sB * sG, -cB * sG];
  const Y = [-sA * cB, cA * cB, sB];
  const Z = [cA * sG + sA * sB * cG, sA * sG - cA * sB * cG, cB * cG];
  // The edge that is up on the screen. Angle 90 = the phone was turned anticlockwise, so its
  // right-hand edge (x) is now the top.
  const s = (Number.isFinite(screenAngle) ? screenAngle : 0) * RAD;
  const top = [Math.sin(s) * X[0] + Math.cos(s) * Y[0], Math.sin(s) * X[1] + Math.cos(s) * Y[1], Math.sin(s) * X[2] + Math.cos(s) * Y[2]];
  // How far the top edge is lifted off the ground: 0 flat, 1 pointing straight up or down.
  const lift = Math.min(1, Math.abs(top[2]));
  const upright = smoothstep(Math.sin(tuning.flatUntilDeg * RAD), Math.sin(tuning.uprightFromDeg * RAD), lift);
  // Top edge up: forward is out of the back (-z). Top edge down: forward is out of the screen.
  const back = top[2] >= 0 ? -1 : 1;
  const east = (1 - upright) * top[0] + upright * back * Z[0];
  const north = (1 - upright) * top[1] + upright * back * Z[1];
  if (Math.hypot(east, north) < 1e-6) return null;
  return wrap360(Math.atan2(east, north) / RAD);
}

/** screen.orientation.angle, or the older window.orientation (which uses -90 for 270). */
function screenAngle() {
  const a = globalThis.screen?.orientation?.angle;
  if (typeof a === 'number') return a;
  return typeof globalThis.orientation === 'number' ? wrap360(globalThis.orientation) : 0;
}

export function createHeading({ onSource, onQuality } = {}) {
  const S = TUNING.spin, Q = TUNING.sensor;
  let raw = null; // the heading, or null
  let source = 'none';
  let started = false;
  let listening = false;
  let granted = null; // iOS permission: null = not asked or not needed
  let byChoice = false; // the user picked "Turn by hand": a sensor must not take over

  // Sensor
  let sawAbsolute = false;
  let sensed = null; // last heading the sensor gave, kept even while turning by hand
  let reading = null; // last raw sample
  let quality = 'unknown', pending = null, pendingSince = 0;

  // By hand
  let spin = 0;
  let grabbed = false;
  let trail = []; // recent { t, a }: how far the drag has gone, for the flick speed
  let travelled = 0;

  const setSource = (s) => { if (s !== source) { source = s; onSource?.(s); } };
  const byHand = () => source === 'manual' || source === 'denied';

  /** No sensor: the user turns by hand, until a sensor does answer. */
  function fallBack() {
    raw ??= 0;
    byChoice = false;
    setSource('manual');
  }
  /** May the user turn by hand right now? Trying to, while still waiting for a sensor, switches. */
  function takeOver() {
    if (byHand()) return true;
    if (source === 'none' && started) { fallBack(); return true; }
    return false;
  }

  /** A change of quality must last a moment before anyone is told, so the hint never flickers. */
  function propose(q, now) {
    if (q === quality) { pending = null; return; }
    if (pending !== q) { pending = q; pendingSince = now; }
    if (now - pendingSince >= Q.qualityHoldMs) { quality = q; pending = null; onQuality?.(q); }
  }

  function onOrientation(e) {
    const now = performance.now();
    const screen = screenAngle();
    let h = null, kind, accuracy = null;
    if (typeof e.webkitCompassHeading === 'number') {
      kind = 'webkit';
      accuracy = Number.isFinite(e.webkitCompassAccuracy) ? e.webkitCompassAccuracy : null;
      const valid = Number.isFinite(e.webkitCompassHeading) && !(accuracy !== null && accuracy < 0);
      if (valid) h = wrap360(e.webkitCompassHeading + screen);
      if (!valid) propose('invalid', now);
      else if (accuracy === null) propose('unknown', now);
      else if (accuracy > Q.poorAccuracyDeg) propose('poor', now);
      else if (accuracy < Q.goodAccuracyDeg) propose('good', now);
      else propose(quality === 'poor' ? 'poor' : 'good', now); // between the two: keep what was said
    } else if (e.absolute === true && Number.isFinite(e.alpha)) {
      if (e.type === 'deviceorientationabsolute') sawAbsolute = true;
      else if (sawAbsolute) return; // the absolute event wins once it has spoken
      kind = 'absolute';
      h = headingFromEuler(e.alpha, e.beta, e.gamma, screen);
    } else {
      // Not a compass reading: relative orientation, or a sensor with nothing to say. Chrome on
      // a device with no sensor sends one event with every angle null: no need to wait further.
      if (e.alpha === null && e.beta === null && e.gamma === null && source === 'none' && started) fallBack();
      return;
    }
    const gap = reading ? now - reading.at : 0;
    const hz = gap > 0 && gap < 1000 ? (reading.hz ? reading.hz * 0.9 + (1000 / gap) * 0.1 : 1000 / gap) : reading?.hz ?? 0;
    reading = {
      kind, event: e.type, alpha: e.alpha, beta: e.beta, gamma: e.gamma, screen, accuracy, heading: h, at: now, hz,
      compass: kind === 'webkit' ? e.webkitCompassHeading : null,
    };
    if (h === null) return; // dropout: keep the last good heading
    sensed = h;
    if (byChoice) return;
    raw = h;
    spin = 0;
    grabbed = false;
    setSource('sensor');
  }

  function waitForSensor() {
    setTimeout(() => { if (source === 'none') fallBack(); }, Q.waitMs);
  }

  return {
    get value() { return raw; },
    get source() { return source; },
    get byChoice() { return byChoice; },
    get quality() { return quality; },
    get reading() { return reading && { ...reading, ageMs: performance.now() - reading.at }; },
    get grabbed() { return grabbed; },
    get spin() { return spin; },

    /** Must be called from a user gesture (iOS shows its permission prompt here). */
    async start() {
      started = true;
      const DOE = globalThis.DeviceOrientationEvent;
      let answer = null;
      if (typeof DOE?.requestPermission === 'function') {
        // true = compass (absolute) readings are wanted too. Safari takes no argument and ignores it.
        try { answer = await DOE.requestPermission(true); } catch { /* not from a tap: listen anyway */ }
      }
      granted = answer === null ? null : answer === 'granted';
      // Listen even when the answer was no: it costs nothing, and if readings come anyway they win.
      if (!listening) {
        listening = true;
        window.addEventListener('deviceorientationabsolute', onOrientation, true);
        window.addEventListener('deviceorientation', onOrientation, true);
      }
      if (source === 'sensor' || (source === 'manual' && byChoice)) return;
      if (granted === false) {
        raw ??= 0;
        byChoice = false;
        setSource('denied');
        return;
      }
      // Laptops and some in-app browsers never fire: turn by hand so the demo still works.
      setSource('none');
      waitForSensor();
    },

    /** The "Turn by hand" switch. on = by hand; off = back to the sensor, if there is one. */
    manual(on = true) {
      spin = 0;
      grabbed = false;
      if (on) {
        byChoice = true;
        raw ??= 0;
        setSource('manual');
        return;
      }
      byChoice = false;
      if (sensed !== null && listening) { raw = sensed; setSource('sensor'); return; }
      if (granted === false) { this.start(); return; } // not allowed before: ask again, from this tap
      setSource('none');
      if (started) waitForSensor();
    },

    /** By hand: turn by `delta` degrees at once. */
    turn(delta) {
      if (!Number.isFinite(delta) || !takeOver()) return;
      raw = wrap360((raw ?? 0) + delta);
    },

    /** By hand: take hold of the dial. Returns false when the sensor is in charge. */
    grab(now = performance.now()) {
      if (!takeOver()) return false;
      grabbed = true;
      spin = 0;
      travelled = 0;
      trail = [{ t: now, a: 0 }];
      return true;
    },
    /** By hand, while held: the heading moves by `delta` degrees. */
    drag(delta, now = performance.now()) {
      if (!grabbed || !Number.isFinite(delta)) return;
      raw = wrap360((raw ?? 0) + delta);
      travelled += delta;
      trail.push({ t: now, a: travelled });
      while (trail.length > 2 && now - trail[0].t > S.sampleMs * 2) trail.shift();
    },
    /** By hand: let go. If the dial was moving it keeps spinning, and friction stops it. */
    release(now = performance.now()) {
      if (!grabbed) return;
      grabbed = false;
      const recent = trail.filter((s) => now - s.t <= S.sampleMs);
      trail = [];
      let rate = 0;
      if (recent.length >= 2) {
        const first = recent[0], last = recent[recent.length - 1];
        // Still moving at the moment of letting go? A pause before the release is not a flick.
        if (last.t - first.t >= 12 && now - last.t <= 60) rate = ((last.a - first.a) / (last.t - first.t)) * 1000;
      }
      if (Math.abs(rate) < S.minFlick || reduceMotion.matches) rate = 0;
      spin = Math.max(-S.maxRate, Math.min(S.maxRate, rate));
    },
    /** By hand: add `rate` degrees a second to the spin, never beyond `max`. */
    push(rate, max = S.maxRate) {
      if (!Number.isFinite(rate) || grabbed || !takeOver()) return;
      const next = spin + rate;
      if (Math.abs(next) <= max || Math.abs(next) < Math.abs(spin)) spin = next; // within the limit, or slowing down
      else if (Math.abs(spin) < max) spin = Math.sign(next) * max; // up to the limit and no further
    },

    /** Call every frame. */
    tick(dtMs, now = performance.now()) {
      if (byHand() && !grabbed && spin !== 0 && dtMs > 0) {
        // Two kinds of friction, as on a real pivot in fluid: the fluid slows the dial in
        // proportion to its speed, the pivot by a fixed amount, which is what brings it to a clean
        // stop instead of a long crawl:   speed' = -speed / tau - c
        // Solved exactly for the time that passed, so the coast is the same at any frame rate.
        const tau = S.frictionMs / 1000, c = Math.max(0, S.pivotFriction), dir = Math.sign(spin), v0 = Math.abs(spin);
        const rest = c > 0 ? tau * Math.log(1 + v0 / (c * tau)) : Infinity; // seconds until it stops
        const t = Math.min(dtMs / 1000, rest);
        const k = Math.exp(-t / tau);
        raw = wrap360((raw ?? 0) + dir * (tau * (v0 + c * tau) * (1 - k) - c * tau * t));
        spin = dtMs / 1000 >= rest ? 0 : dir * ((v0 + c * tau) * k - c * tau);
        if (Math.abs(spin) < S.stopRate) spin = 0;
      }
      // iOS reports about 60 times a second, moving or not, so silence there is a real dropout.
      // (Chrome on Android only reports when the phone moves: silence means nothing there.)
      if (source === 'sensor' && reading?.kind === 'webkit' && now - reading.at > Q.staleMs && globalThis.document?.visibilityState === 'visible') {
        propose('paused', now);
      }
    },
  };
}
