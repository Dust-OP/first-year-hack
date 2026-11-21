// Which way is the phone facing? Degrees clockwise from north, 0..360.
//
// Follows the pattern recommended in findings/compass-frontend-design/RESULT.md:
//  - iOS 13+: ask DeviceOrientationEvent.requestPermission() from a tap, read webkitCompassHeading
//  - Android: prefer `deviceorientationabsolute`; use 360 - alpha only when the event is absolute
//  - add the screen rotation angle
//  - if no sensor answers, fall back to manual (drag the dial)

export function createHeading({ onSource }) {
  let raw = null; // latest reading, or null
  let source = 'none'; // none | sensor | manual | denied
  let sawAbsolute = false;

  const setSource = (s) => { if (s !== source) { source = s; onSource?.(s); } };
  const screenAngle = () => screen.orientation?.angle ?? (typeof window.orientation === 'number' ? window.orientation : 0);

  function onOrientation(e) {
    if (source === 'manual') return;
    let h = null;
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      h = e.webkitCompassHeading; // iOS: already a compass heading
    } else if (e.absolute === true && typeof e.alpha === 'number') {
      if (e.type === 'deviceorientationabsolute') sawAbsolute = true;
      else if (sawAbsolute) return; // the absolute event wins once it has spoken
      h = 360 - e.alpha;
    }
    if (h === null) return;
    raw = (h + screenAngle() + 360) % 360;
    setSource('sensor');
  }

  return {
    get value() { return raw; },
    get source() { return source; },

    /** Must be called from a user gesture (iOS shows its permission prompt here). */
    async start() {
      try {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
          if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') { this.manual(); setSource('denied'); return; }
        }
      } catch { /* not iOS, or not a gesture: fall through and listen anyway */ }
      window.addEventListener('deviceorientationabsolute', onOrientation, true);
      window.addEventListener('deviceorientation', onOrientation, true);
      // Laptops and some in-app browsers never fire: switch to manual so the demo still works.
      setTimeout(() => { if (source === 'none') this.manual(); }, 2500);
    },

    manual(on = true) {
      if (on) { raw ??= 0; setSource('manual'); }
      else { setSource('none'); }
    },
    /** Manual mode only: turn by `delta` degrees. */
    turn(delta) {
      if (source === 'manual' || source === 'denied') raw = (((raw ?? 0) + delta) % 360 + 360) % 360;
    },
  };
}

/** Signed shortest turn from a to b, -180..180. */
export const angleDiff = (a, b) => ((b - a + 540) % 360) - 180;
