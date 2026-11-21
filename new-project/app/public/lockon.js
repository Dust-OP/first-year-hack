// Lock-on: decides when the compass has found someone, so the dial can give way to their picture,
// and when it has lost them again. Built so the picture never flickers:
//
//  - Capture: the person nearest to straight ahead, within captureDeg, is "aimed". The aim must
//    then hold for dwellMs while the dial is turning slower than steadyRate (the physics has
//    settled) before it becomes a lock. A flick that sweeps past people locks on nobody.
//  - Release: a lock ends only after the aim has been more than releaseDeg away for releaseMs.
//    releaseDeg is wider than captureDeg, so there is no angle at which it can chatter.
//  - Two people close together: the second must be clearly closer (switchMarginDeg) to take the
//    aim, and then has to earn the lock with its own dwell.
//  - pin(id): the user tapped that person's dot. They are locked at once, wherever they are. The
//    lock then ends when the user turns releaseDeg away from where they were facing at the tap
//    (they are setting off to follow the needle), and if they do end up facing that person it
//    becomes an ordinary lock.
//  - dismiss(id): the user sent that person's picture away or closed their card. They cannot lock
//    again until the aim has left them (beyond releaseDeg) and come back.
//
// No DOM and no clock in this file: update() is told how much time passed. It runs in Node.
//
//   const lock = createLockOn({ captureDeg, releaseDeg, dwellMs, releaseMs, steadyRate, switchMarginDeg, edgeDeg })
//   lock.update(people, heading, rate, dtMs)
//        people: [{ id, bearing }]   heading: where the dial says the user faces   rate: its speed
//        -> { aimedId, lockedId, progress, offset, event }
//           progress  0..1, how much of the dwell is done (for the ring on the dial)
//           offset    -1..1, how far the aim has drifted towards the release angle (+ = to the right)
//           event     'lock' | 'release' | 'lost' | null, what happened in this step
//   lock.pin(id, heading)   lock.dismiss(id)   lock.lockedId

import { angleDiff } from './physics.js';

export function createLockOn({ captureDeg = 15, releaseDeg = 28, dwellMs = 400, releaseMs = 180, steadyRate = 45, switchMarginDeg = 3, edgeDeg = 2 } = {}) {
  let aimedId = null; // nearest person within the capture angle
  let dwell = 0; // how long the aim has been steady on them
  let spent = false; // this aim has already locked (or was overruled by a tap): it must leave and return
  let lockedId = null;
  let pinnedAt = null; // heading at the tap, when the lock came from pin(); null for a lock by aim
  let away = 0; // how long the aim has been beyond the release angle
  let blockedId = null; // dismissed by hand

  return {
    get lockedId() { return lockedId; },
    get aimedId() { return aimedId; },

    update(people, heading, rate, dtMs) {
      let event = null;

      // 1. Who is straight ahead? Nearest in angle wins.
      let nearest = null, nearestOff = Infinity, aimedOff = null;
      for (const p of people) {
        const off = Math.abs(angleDiff(heading, p.bearing));
        if (p.id === aimedId) aimedOff = off;
        if (off < nearestOff) { nearestOff = off; nearest = p.id; }
      }
      let next = nearestOff <= captureDeg ? nearest : null;
      // The person already aimed at keeps the aim at the edge and against a rival who is barely closer.
      if (aimedOff !== null && next !== aimedId && aimedOff <= captureDeg + edgeDeg && (next === null || nearestOff > aimedOff - switchMarginDeg)) {
        next = aimedId;
      }
      if (next !== aimedId) { aimedId = next; dwell = 0; spent = false; }
      else if (aimedId !== null) dwell = Math.abs(rate) <= steadyRate ? dwell + dtMs : 0;

      // 2. A dismissed person is allowed back once the aim has clearly left them.
      if (blockedId !== null) {
        const b = people.find((p) => p.id === blockedId);
        if (!b || Math.abs(angleDiff(heading, b.bearing)) > releaseDeg) blockedId = null;
      }

      // 3. A steady aim becomes a lock.
      if (aimedId !== null && !spent && aimedId !== blockedId && dwell >= dwellMs) {
        spent = true;
        if (aimedId === lockedId) pinnedAt = null; // followed the needle to the person they tapped
        else { lockedId = aimedId; pinnedAt = null; away = 0; event = 'lock'; }
      }

      // 4. A lock ends when the person is gone or the aim has turned away for long enough.
      let offset = 0;
      if (lockedId !== null) {
        const p = people.find((q) => q.id === lockedId);
        if (!p) { lockedId = null; pinnedAt = null; event = 'lost'; }
        else {
          const drift = angleDiff(pinnedAt ?? p.bearing, heading);
          offset = Math.max(-1, Math.min(1, drift / releaseDeg));
          if (Math.abs(drift) > releaseDeg) {
            away += dtMs;
            if (away >= releaseMs) { lockedId = null; pinnedAt = null; offset = 0; event = 'release'; }
          } else away = 0;
        }
      }

      const progress = aimedId !== null && !spent && aimedId !== blockedId ? Math.min(1, dwell / dwellMs) : 0;
      return { aimedId, lockedId, progress, offset, event };
    },

    /** The user tapped this person: lock them now, whichever way the user is facing. */
    pin(id, heading) {
      lockedId = id;
      pinnedAt = id === aimedId ? null : heading;
      away = 0;
      spent = true; // whoever is straight ahead does not take the lock back a moment later
      if (blockedId === id) blockedId = null;
    },

    /** The user sent this person away: back to the compass, and stay there until the aim moves on. */
    dismiss(id = lockedId ?? aimedId) {
      if (id === lockedId) { lockedId = null; pinnedAt = null; away = 0; }
      blockedId = id; // update() lifts this at once if the user is not facing them anyway
    },
  };
}
