// The physical model behind the dial: a magnetised needle on a pivot in damping fluid.
//
//   angle'' = -w^2 * (angle - target) - 2 * zeta * w * angle'        w = 2 * pi * hz
//
// A pull towards the target that grows with the error (the magnet), and a drag that grows with
// the speed (the fluid). With zeta below 1 the needle arrives, overshoots a little and settles.
// The same model low-passes a noisy reading: jitter in the target comes out as a faint tremble.
//
// Each step uses the exact solution of that equation for the time that really passed, so the
// motion is the same at 30, 60 or 120 frames a second, a long frame cannot make it explode, and
// it can never gain energy. Angles are degrees, speeds are degrees per second.
//
// No DOM in this file: it runs in Node too, which is how the step response was measured.

/** Any angle as 0..360. */
export const wrap360 = (a) => ((a % 360) + 360) % 360;

/** Signed shortest turn from a to b, -180..180. Safe for any finite input. */
export const angleDiff = (a, b) => ((((b - a) % 360) + 540) % 360) - 180;

const MAX_STEP_MS = 250; // a step is never longer than this, whatever the caller passes

/**
 * const s = createSpring({ hz, zeta })
 *   s.step(target, dtMs, bias)  advance; returns the new angle. `bias` shifts where it rests.
 *   s.angle, s.velocity         where it is and how fast it turns
 *   s.tune({ hz, zeta })        change the feel without disturbing the motion
 *   s.set(angle)                put it somewhere, at rest
 */
export function createSpring({ hz = 2, zeta = 0.6, angle = 0 } = {}) {
  let w = 2 * Math.PI * hz;
  let z = zeta;
  let x = wrap360(angle);
  let v = 0;

  return {
    get angle() { return x; },
    get velocity() { return v; },

    tune(p) {
      if (p.hz > 0) w = 2 * Math.PI * p.hz;
      if (p.zeta >= 0) z = p.zeta;
    },

    set(a) {
      if (Number.isFinite(a)) { x = wrap360(a); v = 0; }
    },

    step(target, dtMs, bias = 0) {
      if (!Number.isFinite(target) || !Number.isFinite(dtMs) || dtMs <= 0) return x;
      const t = Math.min(dtMs, MAX_STEP_MS) / 1000;
      const rest = target + (Number.isFinite(bias) ? bias : 0);
      const d = angleDiff(rest, x); // how far from rest, the short way round: 359 -> 1 is 2, not 358
      let d1, v1;
      if (z < 1) {
        // Underdamped: a decaying swing.
        const wd = w * Math.sqrt(1 - z * z);
        const decay = Math.exp(-z * w * t), c = Math.cos(wd * t), s = Math.sin(wd * t);
        d1 = decay * (d * c + ((v + z * w * d) / wd) * s);
        v1 = decay * (v * c - ((z * w * v + w * w * d) / wd) * s);
      } else if (z === 1) {
        // Critically damped: the fastest approach with no overshoot.
        const decay = Math.exp(-w * t), k = v + w * d;
        d1 = decay * (d + k * t);
        v1 = decay * (v - w * k * t);
      } else {
        // Overdamped: two decaying exponentials.
        const root = w * Math.sqrt(z * z - 1);
        const r1 = -z * w + root, r2 = -z * w - root;
        const c1 = (v - r2 * d) / (r1 - r2), c2 = d - c1;
        const e1 = Math.exp(r1 * t), e2 = Math.exp(r2 * t);
        d1 = c1 * e1 + c2 * e2;
        v1 = c1 * r1 * e1 + c2 * r2 * e2;
      }
      if (Number.isFinite(d1) && Number.isFinite(v1)) {
        x = wrap360(rest + d1);
        v = v1;
      } else {
        x = wrap360(target);
        v = 0;
      }
      return x;
    },
  };
}
