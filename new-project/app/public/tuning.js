// Every number that decides how the compass feels, in one place. Change a value, reload the page.
// Angles are degrees, rates are degrees per second, times are milliseconds.
//
// One number is not here: the capture angle ("pointing at someone" = within 15 degrees) is
// AIM_DEG at the top of app.js.

export const TUNING = {
  // The rose (the card with N, the ticks and the people) following the heading: a mass on a
  // spring in damping fluid. hz = how fast it swings, zeta = how quickly the swing dies
  // (1 = no overshoot at all, 0.6 = one small overshoot of about 10%, lower = keeps wobbling).
  rose: { hz: 2.0, zeta: 0.6 },
  // The same card while a finger or the mouse holds it: stiffer, so it stays under the finger.
  grab: { hz: 4.5, zeta: 0.75 },
  // The red needle swinging to the person it leads to. Lighter than the card, so livelier.
  // drag = how much the fluid carries the needle along when the dial turns (0 = not at all):
  // it trails the turn, then swings back. maxDragDeg caps that trail during a hard flick.
  needle: { hz: 2.3, zeta: 0.5, drag: 0.35, maxDragDeg: 40 },
  // prefers-reduced-motion: no overshoot, settles in about a fifth of a second, and sensor
  // readings that differ by less than the dead band are ignored so nothing trembles.
  reduced: { hz: 6, zeta: 1, deadbandDeg: 1.5 },
  // A frame longer than this (a background tab, a slow phone) is treated as this long.
  maxFrameMs: 64,

  // Turning by hand (laptops, refused permission, a drifting indoor compass).
  spin: {
    frictionMs: 750, // fluid: a flicked dial loses about 63% of its speed in this time
    pivotFriction: 40, // pivot: and this much speed every second on top, so it stops cleanly (0 = a long crawl)
    stopRate: 6, // below this speed the dial is at rest
    maxRate: 1440, // fastest flick: four turns a second
    minFlick: 40, // letting go slower than this is a release, not a flick
    sampleMs: 100, // the flick speed is the average over this long before letting go
    wheelDegPerPx: 0.2, // wheel or two-finger scroll
    keyStepDeg: 5, // one tap of an arrow key
    keyPush: 45, // holding an arrow key: speed added per key repeat...
    keyMaxRate: 220, // ...up to this speed
    keyBrake: 0.65, // letting go of the key takes this share of the speed away at once
  },

  // Lock-on: when the dial gives way to the person's picture, and when it comes back.
  lock: {
    releaseDeg: 28, // turn this far away from the person and the compass comes back
    dwellMs: 400, // the aim must hold steady this long before the picture appears
    releaseMs: 250, // ...and stay beyond the release angle this long before it goes (longer than the dial's own overshoot lasts)
    steadyRate: 45, // "steady" = the dial is turning slower than this
    switchMarginDeg: 3, // a second person must be this much closer to take the aim over
    edgeDeg: 2, // the aimed person keeps the aim this far past the capture angle
  },

  // The phone's compass sensor.
  sensor: {
    waitMs: 2500, // no reading after this long: turn by hand instead
    // Which way is the user pointing? Lying flat it is the top edge of the phone; held upright
    // it is the back of the phone. Between these two tilts the two answers are blended.
    // The back of the phone turns with the wrist, so the blend starts above the 20 to 60 degrees
    // at which a phone is normally held: up to flatUntilDeg a sideways roll does not move the heading.
    flatUntilDeg: 65,
    uprightFromDeg: 80,
    poorAccuracyDeg: 30, // iPhone reports its own uncertainty: above this, ask to calibrate
    goodAccuracyDeg: 22, // ...and below this the hint goes away again
    qualityHoldMs: 800, // a change of quality must last this long before the hint changes
    staleMs: 2000, // an iPhone that stops reporting for this long is shown as paused
  },
};
