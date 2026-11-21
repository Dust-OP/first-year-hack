# Worker report: compass front-end UI references (GitHub, CodePen and others)

- Date: 2026-11-21. Read-only research worker. Sources: the authenticated `gh` CLI (repo/code search, `contents` API, metadata API) and WebSearch. Nothing was starred, forked, commented on or run. For live demos I only checked the HTTP status; I did not interact with them.
- Scope: the compass element's front end (dial, needle, rose, strip, HUD) and how it reads the heading. Hardware and product prior art are in `../../20261121-retro-compass-hackathon/workers/hackathon-opensource.md`. CampMap/Choc-Shake is not repeated here; a different Dragon Ball radar implementation (ggj0101) is covered instead.
- Stars, push dates and licenses are from `gh api repos/...` on 2026-11-21. "Commit" is the HEAD SHA I read. Line numbers refer to that commit.
- Status labels: **source read** means I opened the implementing files. **README only** means I read only metadata or a README. **lead only** means I found the item but could not open it.

## Summary table

| # | Candidate | Render | Heading input quality | License | Status |
|---|---|---|---|---|---|
| 1 | KilledByAPixel/Cosmodial | WebGL sky + Canvas2D HUD strip | Excellent (both events, iOS, screen angle, shortest-path lerp) | MIT | source read |
| 2 | qazsato/maplibre-gl-compass | Map bearing + CSS icon | Good (circular-mean smoothing, permission) | MIT | source read |
| 3 | alexwohlbruck/parchment | Vue CSS transform icon | Excellent (screen angle, critically damped angular spring) | Apache-2.0 | source read |
| 4 | AR-js-org/locar.js | three.js quaternion | Very good (slerp smoothing, iOS offset) | MIT | source read |
| 5 | dave1010/tools compass | Canvas2D | Good (unwrapped target + rAF easing) | MIT | source read |
| 6 | HanSolo/SteelSeries-Canvas | Canvas2D skeuomorphic | Value input; elastic shortest-path tween | BSD-style (file header) | source read |
| 7 | Mikhus/canvas-gauges | Canvas2D gauge | Value input; `useMinPath` wrap fix | MIT | source read |
| 8 | sebmatton/jQuery-Flight-Indicators | Layered SVG + CSS rotate | Value input | GPL-3.0 | source read |
| 9 | TheBanHammer/fh6-tel CompassBar.svelte | SVG strip (Svelte 5) | Value input; wrap-safe tick diff | MIT | source read |
| 10 | Unknown6656/F18-HUD | DOM/CSS heading tape | Has bugs; exponential smoothing class | AGPL-3.0 | source read |
| 11 | BadIdeaFactory/the-emoji-compass | SVG/CSS + GSAP Draggable | Drag input (no sensor) | Apache-2.0 | source read |
| 12 | ggj0101/games Dragon Ball radar | PixiJS (WebGL 2D) + CSS rotate | Good (both events, circular lerp in rAF) | none | source read |
| 13 | MokiMeow/3d-portfolio watch Compass.vue | SVG in Vue | Basic + idle-spin demo mode | Apache-2.0 | source read |
| 14 | Roger-random/compass | three.js 3D needle | Generic Sensor `Magnetometer` (Chrome flag) | MIT | source read |
| 15 | dado3212/target-compass | CSS rotate + SVG | iOS fine, Android relative (bug) | none | source read |
| 16 | masterflywolf/luopan | CSS-rotated raster luopan | iOS/Android split, no permission call | none | source read |
| 17 | frosetrain/eyeofender | Svelte 5 + Tailwind CSS rotate | Both events + permission; crude tilt fix | none | source read |
| 18 | island205/H5Compass | Raphael SVG + canvas level | Buggy (`webkitCompassHeading \|\| alpha`) | MIT (bower.json) | source read |
| 19 | pirxpilot/kompas | Headless lib | Tilt-compensated W3C formula | MIT (package.json) | source read |
| 20 | ai/compass.js | Headless lib (2014) | GPS-calibration hack | MIT | source read |
| 21 | NOAA-ORR-ERD/compass-rose-ui | Two-layer Canvas2D, drag | Pointer `atan2` input | CC0-1.0 | source read |
| 22 | pebble-hacks/pebble-compass | C (Pebble), design ref | Rose/band morph + inertia physics | none | source read |
| 23 | ultrinnan/PipBoy | SCSS CRT/Pip-Boy shell | n/a | GPL-3.0 | source read |
| 24 | Poly Haven "Seadogs Compass" 3D model | glTF asset for three.js | n/a | CC0 (Poly Haven) | API metadata only |
| 25 | watabou/CompassOS | Haxe/OpenFL rose generator | n/a | none | source skimmed |
| 26 | philihp sextant live.jsx | React + CSS 3D transform | Basic | MIT | source read (minor) |
| L | CodePen pens: louh/KpXeey (SVG rose), jackrugile/wqLsn (canvas radar), lbebber/XJRdrV (CSS CRT), chris22smith/LWOGmO (CSS Pip-Boy); Framer Pip-Boy component | n/a | n/a | CodePen default (MIT for public pens) | lead only (CodePen returned 403; Framer returned 429) |

---

## A. Heading-input reference implementations (copy these patterns)

### 1. Cosmodial (Frank Force / KilledByAPixel): the best input handling found
- URL: https://github.com/KilledByAPixel/Cosmodial · live: https://cosmodial.3d2k.com (HTTP 200) · 22★ · pushed 2026-09-29 · MIT · commit `630c928`
- Stack: vanilla ES modules. The sky is WebGL (`js/render/starfield-gl.js`) and the HUD is Canvas2D (`js/render/hud.js`).
- Heading input (`js/ui/gyro.js`):
  - Permission must come from a user gesture: `requestGyroPermission()` (l.40-52) calls `DeviceOrientationEvent.requestPermission` and returns 'granted' / 'denied' / 'unsupported'.
  - It listens to both events and lets the absolute one win (l.97-110). The comment explains why: *"Chrome defines ondeviceorientationabsolute even on devices whose compass fusion never fires it, so attaching to the absolute name alone left the aim frozen."* `onPlain` drives the aim until the first real absolute sample, then `onAbs` owns it.
  - Screen-orientation compensation: `screen.orientation.angle`, falling back to `window.orientation` (l.82-85). On iOS, `az = wrap360(compass + sc)` (l.70), because `webkitCompassHeading` is reported in the native portrait frame.
  - Low-pass across the 0/360 seam: `function lerpAngle(a, b, t) { return a + (((b - a + 540) % 360) - 180) * t; }` (l.55), with `smoothing ?? 0.2` (l.80).
  - A no-data watchdog `onNoData` fires after 3 s (l.86-104), so the UI can say the sensor is silent.
  - `js/core/orientation.js`: full W3C rotation matrix (alpha, beta, gamma) to azimuth, altitude and roll, so the heading stays correct when the phone is held upright.
- Compass strip (Skyrim style): `hud.js` `compassMarks()` (l.27-36) places cardinal marks at `width/2 + signedDelta(centerAz, c.az) * pxPerDeg` across a 90° span in a pill drawn with Canvas `arc`s (`pillPath`, l.72-81).
- Visual style: a polished dark planetarium with a translucent pill compass.
- Reusable: copy `gyro.js` almost verbatim as the team's sensor layer (keep the MIT notice). The strip math is about 10 lines.

### 2. maplibre-gl-compass (qazsato)
- URL: https://github.com/qazsato/maplibre-gl-compass · live: https://qazsato.github.io/maplibre-gl-compass/ (200) · 6★ · 2025-07-13 · MIT · commit `745c1c3`
- Stack: TypeScript, Vite, a MapLibre control. The heading rotates the map (`map.setBearing`); the button is a CSS-spun SVG icon.
- Input (`src/core/Compass.ts`):
  - iOS permission at l.62-78 (`if ('requestPermission' in window.DeviceOrientationEvent)`).
  - It listens to both events and drops the loser: when the absolute event has alpha it removes `deviceorientation`; when `webkitCompassHeading` exists it removes the absolute listener (l.106-114).
  - Android conversion: `360 - event.alpha` (l.140).
  - Smoothing is a circular (vector) mean over the last 100 samples: `Math.atan2(sinSum/n, cosSum/n)` (l.147-168). This is wrap-safe.
  - No screen-orientation handling. In `src/maplibre-gl-compass.ts` l.49, `Math.abs(heading - bearing) >= 1` is not wrap-aware, but that is harmless there.
- Reusable: the circular-mean smoother is about 15 lines. A 100-sample window lags at 60 Hz; use 10-20 samples.

### 3. Parchment (Alex Wohlbruck), a full open-source maps app
- URL: https://github.com/alexwohlbruck/parchment · live: https://parchment.app (200) · 76★ · pushed 2026-11-21 · Apache-2.0 (LICENSE text; GitHub shows NOASSERTION) · commit `76aec23`
- Stack: Vue 3 and TypeScript. `CompassControl.vue` rotates `CompassIcon` through a `:style="{ transform: compassTransform }"` binding (l.99).
- Input:
  - `web/src/services/orientation.service.ts` handles `webkitCompassHeading` (l.74-77). Otherwise `heading = (360 - e.alpha + screenAngle() + 360) % 360` when `e.absolute` is true (l.88-89). `screenAngle()` reads `screen.orientation.angle` (l.40). It listens to both events (l.98-117), and `requestPermission()` is at l.133-164.
  - `web/src/lib/guidance/spring.ts` is a critically damped SmoothDamp spring that is frame-rate independent. `stepAngleSpring` unwraps the target via `angleDelta` before stepping, so the result is wrap-safe.
  - `heading-filter.ts` is a complementary filter: gyro yaw rate between fixes, pulled toward a reference bearing.
- Reusable: `spring.ts` (about 60 lines, Apache-2.0, keep the notice) gives a physical needle that settles without overshoot. Lower damping gives retro wobble.

### 4. LocAR.js (AR.js org): three.js DeviceOrientationControls, maintained
- URL: https://github.com/AR-js-org/locar.js · 74★ · 2026-09-16 · MIT · commit `ba04539`
- Stack: three.js and TypeScript. The orientation drives a camera quaternion.
- Input (`lib/three/device-orientation-controls.ts`):
  - Prefers `deviceorientationabsolute` when `"ondeviceorientationabsolute" in window` (l.129-130).
  - iOS: `alphaOffset = degToRad(360 - webkitCompassHeading - alpha)` (l.149-151). After `setFromQuaternion` it overrides `targetEuler.y = compassY + orientationOffset` (l.311-319). Landscape offset is ±π/2 from `screen.orientation.angle` (l.164-173).
  - Smoothing is `object.quaternion.slerp(target, 1 - smoothingFactor)`, default 0.2 (l.334-337). A quaternion slerp has no 359 to 0 problem. An optional angle threshold suppresses jitter (l.326-331).
  - Permission dialog: `requestPermission` (l.240-283).
- Reusable: drop-in if the compass is a three.js object. This is the modern replacement for the DeviceOrientationControls that three.js removed.

### 5. dave1010/tools compass page
- URL: https://github.com/dave1010/tools/tree/main/tools/compass · 8★ · 2026-06-17 · MIT · commit `3fc1e43` · live URL not confirmed (github.io returned 404)
- Stack: a single `index.html` with Tailwind and a 272 px Canvas2D dial (`drawCompass`, `ctx.rotate(toRadians(-normalizedAngle))` l.108).
- Input:
  - `typeof event.webkitCompassHeading === 'number'`, else `360 - event.alpha` (l.303-313). It listens to both events (l.321-322) and has a permission button (l.328-340).
  - Smoothing is wrap-safe by unwrapping: `targetHeading = displayHeading + shortestAngleDifference(...)`. A rAF loop then runs `displayHeading += diff * 0.18` until `|diff| < 0.05` (l.250-298).
- Reusable: the smallest correct end-to-end example, about 360 lines including UI. A good starting template.

### 6. pirxpilot/kompas: tilt-compensated heading formula
- URL: https://github.com/pirxpilot/kompas · 6★ · 2025-06-13 · MIT (package.json) · commit `00e43c6`
- `lib/kompas.js` `compassHeading({alpha,beta,gamma})` (l.13-44) implements the W3C spec's example: `Vx = -cZ*sY - sZ*sX*cY; Vy = -sZ*sY + cZ*sX*cY; heading = atan(Vx/Vy)` plus quadrant fix. Event choice: `'ondeviceorientationabsolute' in window ? ... : 'deviceorientation'` (l.49). Order of preference is `compassHeading`, then `webkitCompassHeading`, then the computed value if `ev.absolute` (l.58-63). It rounds and emits only when the value changes.
- Gaps: no permission call and no smoothing.
- Reusable: use the formula if the phone may be held upright, as with a "point the phone" UX.

### 7. ai/compass.js (Andrey Sitnik, 2014)
- URL: https://github.com/ai/compass.js · 113★ · 2014-12-18 · MIT · commit `5295de1`
- `lib/compass.js` `watch()` (l.84-110) has three paths: PhoneGap `navigator.compass`, then `webkitCompassHeading`, then an "orientationAndGPS" hack (`degrees = -e.alpha + self._gpsDiff`, which calibrates relative alpha against GPS course while the user walks).
- Status: outdated (no requestPermission, no absolute event), so it is historical only. The GPS-course calibration idea is still a valid fallback when the magnetometer is unreliable indoors.

## B. Gauge and instrument libraries usable as a compass

### 8. SteelSeries-Canvas (Gerrit Grunwald / Mark Crossley)
- URL: https://github.com/HanSolo/SteelSeries-Canvas · 117★ · 2022-11-28 · BSD-style 2-clause text in the `steelseries.js` header (GitHub shows no license) · commit `97a8788`
- Stack: plain Canvas2D, about 15.8k lines and no dependencies (`tween.js` bundled).
- `steelseries.Compass` (l.6991): `frameDesign` (METAL, BRASS, GOLD, ANTHRACITE, TILTED_*; l.15722-15728), `knobStyle` BRASS, `pointSymbols`, `rotateFace` (rotating card instead of needle) and `degreeScale`. `setValueAnimated` (l.7418-7428) uses `diff = getShortestAngle(value, targetValue)` with `Tween.elasticEaseOut`, giving a springy, physical needle overshoot. The shortest path is `wrap(to - from, -180, 180)` (l.15381). There is also `WindDirection` (l.7550).
- Visual style: the most "retro instrument" look available off the shelf: brass bezel, glass highlight, knob.
- Reusable: easiest skeuomorphic brass compass (`new steelseries.Compass(canvas,{frameDesign: BRASS, rotateFace:true})`). Keep the copyright header. Feed it the team's smoothed heading.

### 9. canvas-gauges (Mikhus)
- URL: https://github.com/Mikhus/canvas-gauges · live: https://canvas-gauges.com (200) · 1601★ · 2023-11-11 · MIT · commit `6b179f8`
- `examples/radial.html` l.20-50 is a ready compass config: `data-major-ticks="N,NE,E,SE,S,SW,W,NW,N" data-ticks-angle="360" data-start-angle="180"`. For wraparound, `lib/RadialGauge.js` `set value` (l.905-916) applies the shortest path when `animation && ticksAngle === 360 && useMinPath`: `value = this.options.value + ((((value - this.options.value) % 360) + 540) % 360) - 180`.
- Visual style: a clean, themeable dial with no texture by default.
- Reusable: the most popular and maintained-looking gauge lib. Set `useMinPath: true` or the needle spins the long way at north.

### 10. jQuery Flight Indicators (Sébastien Matton)
- URL: https://github.com/sebmatton/jQuery-Flight-Indicators · 277★ · 2024-05-14 · GPL-3.0 · commit `8422eda`
- Approach: layered SVG images (`img/heading_yaw.svg`, `heading_mechanics.svg`, `fi_box.svg`, `fi_circle.svg`) stacked in divs. `_setHeading` sets `css('transform', 'rotate(' + -heading + 'deg)')` on the card layer (`js/jquery.flightindicators.js` l.82-84).
- Visual style: a realistic aircraft heading indicator (DG).
- Reusable: the layered-SVG plus single-CSS-rotate technique. **GPL-3.0**: copying the SVGs or code makes the project GPL. Use it as a technique reference or redraw. The port `Ponjimon/react-flight-indicators` (27★) is also a lead.

### 11. Svelte CompassBar (TheBanHammer/fh6-tel): Skyrim/Forza heading strip
- URL: https://github.com/TheBanHammer/fh6-tel · 44★ · 2026-07-04 · MIT · commit `7ffeb08`
- `src/lib/components/CompassBar.svelte`: Svelte 5 runes and an SVG viewBox of 800×30. For every 5° tick, `diff = ((t - headingDeg) % 360 + 360) % 360; if (diff > 180) diff -= 360;` cull `|diff| > 133`, `x = CX + diff*SCALE` (l.26-41). Ticks are taller at cardinals and 10° marks get labels. A fixed centre triangle (l.73) and linearGradient edge fades (l.76-87) complete it.
- Visual style: a game-HUD strip with fading edges.
- Reusable: the cleanest Skyrim-style strip found, about 90 lines and MIT. It ports directly to React or vanilla.

### 12. F18-HUD (Unknown6656): fighter-jet HUD for a car
- URL: https://github.com/Unknown6656/F18-HUD · live: https://f18.unknown6656.com/ (200) · 9★ · 2026-08-05 · **AGPL-3.0** · commit `c316cf7`
- Stack: jQuery with custom elements (`<heading-tick>`), driven by CSS custom properties (`--heading`, `css/main.css` l.379-404), lawngreen phosphor colour and custom fonts (`HornetDisplay`, `GlassGauge`).
- Input (`js/script.js` l.482-510): UA-sniffs Android to choose `deviceorientationabsolute`, uses a crude tilt term `-(Math.abs(e.alpha-360) + e.beta*e.gamma/90)`, and calibrates an offset from `webkitCompassHeading`. Bug: `heading = e.absolute || heading;` turns the heading into `true` on absolute events. The exponential `smoothing` class (l.34) has factors around 0.05.
- Visual style: a convincing green-phosphor military HUD heading tape.
- Reusable: aesthetic reference only. AGPL makes copying risky, and the input code has bugs.

## C. Retro, playful and themed compass UIs

### 13. The Emoji Compass (Bad Idea Factory): a His Dark Materials alethiometer
- URL: https://github.com/BadIdeaFactory/the-emoji-compass · live: https://badideafactory.github.io/the-emoji-compass/ (200) · 17★ · 2022-12-06 · Apache-2.0 · commit `9b5f74b`
- Stack: React, Redux and GSAP `Draggable`. The dial is an SVG background (`src/img/compass.svg`) with emoji placed around it by `rotate(θ) translate(r) rotate(-θ)` (`CompassDial.js` l.69).
- Needles (`CompassNeedle.js` l.50-63): `Draggable.create(el, {type:'rotation', throwProps:true, snap:{rotation: v => Math.round(v/inc)*inc}})`. The response needle spins itself (`autoRotateNeedle`).
- Input: touch drag only, no sensors.
- Visual style: antique brass and parchment, with a Gentium Book serif and an aurora backdrop.
- Reusable: the strongest "magic instrument" aesthetic found. It shows that GSAP Draggable rotation with snap gives a satisfying manual dial, which works as a laptop or desktop fallback. GSAP is now free, including Draggable and Inertia.

### 14. Dragon Ball radar (ggj0101/games), a different implementation from CampMap
- URL: https://github.com/ggj0101/games (`src/games/dragonball-radar/`) · 0★ · 2026-02-01 · no license (all rights reserved) · commit `05f76dc`
- Stack: Vue 3.5 with **PixiJS 8** (WebGL 2D) loaded dynamically. `PixiRadarOverlay.vue` builds grid circles and crosshair `Graphics`, a sweep `Sprite` from a canvas-gradient texture with `blendMode = 'add'` (l.53-74), and blips. A Leaflet map sits underneath.
- Input (`DragonballRadar.vue`):
  - `webkitCompassHeading`, else `360 - alpha` (l.371-379), with permission (l.394-399) and both events (l.421-422).
  - The heading-up rAF loop is wrap-safe: `mapRotationDeg = normalize180(mapRotationDeg + normalize180(target - mapRotationDeg) * 0.25)` (l.515-530). The CSS comment reads *"rotation is smoothed in JS to avoid 359° -> 0° jump"* (l.813).
- Visual style: neon-green radar sweep with additive glow over a map.
- Reusable: the technique only, because there is no license. Pixi's additive sweep is the easiest WebGL glow without writing shaders.

### 15. Feng-shui luopan (masterflywolf/luopan)
- URL: https://github.com/masterflywolf/luopan · live: https://luopan.guoxueju.com (200) · 11★ · 2024-02-23 · no license · commit `0295f20`
- Approach: high-resolution raster luopan rings (`img/luopan_3x.webp`) rotated with `style.transform = 'rotate(-…deg)'` (`js/index.js` l.46, 82, 90). It also has camera-overlay (`camera.html`), map (`map.html`) and bubble-level (`js/gradienter.js`) modes, plus a "lock" toggle that detaches the listener (l.144-163).
- Input: Android `deviceorientationabsolute` with `360 - alpha`; iOS `deviceorientation` with `webkitCompassHeading`. There is no `requestPermission`, so it is broken on iOS 13+, and the iOS branch shows a text readout computed from `alpha` (l.86-88 bug).
- Visual style: traditional Chinese gold-on-black geomancer's compass, a striking retro-cultural look.
- Reusable: the idea of a dense, multi-ring traditional dial plus camera-overlay and lock modes. Do not copy the assets (no license).

### 16. Target compass, "the compass doesn't point north" (dado3212 / Alex Beals)
- URL: https://github.com/dado3212/target-compass · live: https://alexbeals.com/projects/barn (200) · 0★ · 2024-11-28 · no license · commit `5feb72f`
- Approach: a single `index.php` with an SVG/CSS dial rotated via `rotateElement(compass, -heading)` and a target label at `heading - targetDirection` (l.256-286). Great-circle `getBearing()` (l.220-230) plus haversine distance.
- Input: permission handled (l.238-253). The Android fallback uses raw relative `alpha` without inverting it (l.274-275: *"This is relative and not true north"*). That is a bug to avoid.
- Reusable: the minimal Jack Sparrow "point at a thing" pattern: the bearing formula and the needle angle = `bearing - heading`.

### 17. Eye of Ender (frosetrain/eyeofender)
- URL: https://github.com/frosetrain/eyeofender · 0★ · 2025-10-11 · no license · commit `2b2abd2`
- Stack: SvelteKit with Svelte 5 and Tailwind. A circular `ring-8 ring-emerald-500` div holds an SVG arrow rotated `rotate({bearing - heading}deg)` (`src/routes/+page.svelte` l.78-83). The bearing comes from a server endpoint (`api/throwEye`).
- Input (l.18-50): both events; the absolute one requires `e.absolute`, and a crude tilt correction `-(alpha + beta*gamma/90)` is applied. Whichever event arrives first removes the other. Permission is requested.
- Visual style: Minecraft Eye of Ender theme, a gaming nostalgia hook.
- Reusable: the concept, and proof that a Svelte + Tailwind single page is enough. It is not wrap-smoothed.

### 18. Apple-Watch-style compass inside a three.js portfolio (MokiMeow/3d-portfolio)
- URL: https://github.com/MokiMeow/3d-portfolio (`src/components/pages/home/watch/apps/Compass.vue`) · live: https://3dinsightportfolio.vercel.app (200) · 0★ · 2026-10-19 · Apache-2.0 · commit `53e2461`
- Approach: a Vue SVG dial (viewBox 340) whose rotating `<g :transform="'rotate(' + -heading + ' 170 170)'">` holds ticks (major every 30°, red north), cardinals and waypoint dots at their bearing and distance. A fixed red and white needle sits on top (l.213-280).
- Input: `webkitCompassHeading ?? 360 - alpha` (l.28) and permission (l.58). **Demo mode:** with no sensor it slowly auto-rotates (`heading + 0.8` per tick, l.147) and respects `reducedMotion`.
- Reusable: a clean SVG structure (rotating card plus fixed needle plus waypoints), and the idle-spin fallback for laptops.

### 19. Pip-Boy shell (ultrinnan/PipBoy)
- URL: https://github.com/ultrinnan/PipBoy · 48★ · 2026-03-25 · GPL-3.0 · commit `ff3e5db`
- Approach: SCSS. A `.scan` bar uses `linear-gradient(transparent, rgba(127,241,42,.5))`, animated by `@keyframes scan` from top -100px to 480px over 4 s with opacity .25 (`scss/_general.scss` l.59-71, 489-497). It uses `$light_green: rgba(51,255,0,.8)` and a night-styled Google map.
- Warning: `js/main.js` l.563 contains a hard-coded Google Maps API key. Do not reuse it.
- Reusable: the CRT scan-bar recipe, which is trivial to re-implement. GPL, so do not copy files. `johndevlin/Pip-Boy-CSS` (3★, 2012, CSS-only Pip-Boy 3000) is a second, older reference.

### 20. pebble-compass (Pebble "official" compass app): a design reference for the "rose to band" morph
- URL: https://github.com/pebble-hacks/pebble-compass · 50★ · 2025-12-06 · no license · commit `c535e41`
- Not web (C on Pebble), but the interaction design is worth borrowing:
  - The face blends between a "rose" (polar dial) and a "band" (Skyrim strip) based on how the watch is held. `compass_window.c` l.7 has `rect_blend(..._rose, ..._band, transition_factor)`, and `data_provider.c` switches when the damped accelerometer gives `y < -700` or `y > -500`.
  - Needle inertia: `angular_velocity += distance*attraction; angular_velocity *= friction` with wrap-safe distance (`data_provider.c` l.43-60). That is a damped spring and gives a physical needle.
- Reusable: the idea of a dial when flat and a strip when held upright, plus a roughly 5-line spring physics loop.

### 21. NOAA compass-rose-ui: draggable direction picker
- URL: https://github.com/NOAA-ORR-ERD/compass-rose-ui · 13★ · 2022-03-14 · **CC0-1.0** (LICENSE.md) · commit `932d824`
- Approach: a jQuery plugin with two stacked canvases (back is the rose, front is the arrow). The angle comes from the pointer via `Math.atan2(x, y)*180/Math.PI` (`compass-rose-ui.js` l.95, l.144) and the arrow is drawn with `ctx.rotate` (l.172-192).
- Reusable: a public-domain pattern for "drag to set a target bearing", useful on laptops or for setting where the physical needle should point.

### 22. H5Compass (island205): an iOS-Compass-app clone
- URL: https://github.com/island205/H5Compass · live: http://island205.github.io/H5Compass/ (200) · 34★ · 2022-11-09 · MIT (bower.json) · commit `d76eb85`
- Approach: Raphael SVG sized to the iPhone 5 (320×568). Tick marks use `transform('R'+i+', 160, 215')` (`index.js` l.31-43). Each tick is re-rotated by `item.transform('R' + (item.degPosition - alpha) + ',160, 215')` (l.181). A canvas bubble level ("gradienter", l.96) is included.
- Input bugs to learn from: `var alpha = event.webkitCompassHeading || event.alpha;` (l.150). That is falsy at exactly 0°, and Android alpha runs counter-clockwise, so it is mirrored. No permission call, only throttling (l.212).
- Visual style: a faithful iOS 7 compass look.

### 23. Roger-random/compass: three.js 3D needle from raw magnetometer
- URL: https://github.com/Roger-random/compass · live: https://roger-random.github.io/compass (200) · 1★ · 2023-06-01 · MIT · commit `9e97690`
- Stack: Angular 16 and three.js 0.151. `compass-needle.component.ts` builds a red and a white `ConeGeometry` in a `Group` and calls `needle.lookAt(mag.x, mag.y, mag.z)` (l.20-29, 35-50).
- Input: the Generic Sensor API `new Magnetometer({frequency:10, referenceFrame:'screen'})` (`magnetometer.service.ts` l.20). That needs Chrome on Android with an experimental flag, so it is **not viable for a demo**. Even so, it is the only true 3D field-vector needle found.
- Reusable: the idea of a 3D needle that dips with the magnetic field (inclination) for a "real physics" wow moment, built from a two-cone group.

### 24. Poly Haven "Seadogs Compass" (3D asset)
- URL: https://polyhaven.com/a/seadogs_compass (200) · API: https://api.polyhaven.com/info/seadogs_compass
- Metadata from the API: brass, aged patina, hinged lid and sight wire, engraved dial, 11,645 polys, textures up to 8K, author Benny Weimer. Poly Haven assets are CC0.
- Not verified: whether the needle or card is a separate mesh that can be rotated. Inspect the glTF node list before committing.
- Reusable: the fastest route to a photoreal brass compass in three.js or R3F (`useGLTF`). Use the 1K textures for phones.

### 25. watabou CompassOS: procedural compass-rose generator
- URL: https://github.com/watabou/CompassOS · tool: https://watabou.itch.io/compass-rose-generator (429 when checked) · 91★ · 2019-04-17 · no license · commit `11baac6`
- Approach: Haxe/OpenFL with a layered data model (`data/layers/LayerRing.hx`, `LayerStar.hx`, `marks/MarkNotch.hx`…) drawn by `RoseView.hx` through a `Brush`.
- Reusable: inspiration for an old-map rose (star points, rings, notches). The team could export an SVG from the itch tool and animate it with CSS, after checking the tool's terms for its output. Status: source skimmed (structure and RoseView only).

### 26. philihp "Live sextant" (minor)
- URL: https://github.com/philihp/philihp.github.io (`app/sextant/live.jsx`) · 2★ · MIT · commit `4d6e70f`
- A React and Nextra page. A card is tilted with CSS 3D `rotateZ(yaw) rotateX(pitch) rotateY(roll)` computed from `accelerationIncludingGravity` (l.15-21) and written by a rAF loop. It requests both the DeviceMotion and DeviceOrientation permissions (l.88-96).
- Pitfall: `transition: 'transform 60ms linear'` on a raw yaw will spin the long way at 359 to 0.
- Reusable: the "CSS 3D tilt" pattern, a cheap parallax for a skeuomorphic dial.

## D. Leads only (not opened)
- CodePen (all return HTTP 403 to curl and WebFetch):
  - louh/pen/KpXeey (SVG rose with `rose` and `needle-outside` groups)
  - jackrugile/pen/wqLsn (canvas radar sweep with Sketch.js)
  - lbebber/pen/XJRdrV (CSS CRT on/off effect)
  - chris22smith/pen/LWOGmO (CSS Pip-Boy screen)
  - ketnerac/pen/poMVgyd (image needle driven by a slider)
  - Jeremy-Walton/pen/qEdeppd
- Framer marketplace Pip-Boy component (radar sweep, scanlines, boot animation; 429 when checked).
- amCharts "Compass chart" demo (https://www.amcharts.com/demos/compass-chart/). amCharts is commercial, free with branding.
- Others found by code search but not opened:
  - Ponjimon/react-flight-indicators (27★)
  - geoblocks/cesium-helpers `cesium-compass-bar`, a web component
  - andreumassanet/planeteer `src/hud/compass.ts` (comic-style Earth, MIT)
  - mullevik/easter-run `CompassDevice.vue` (MIT)
  - jlmayorgaco/v-potter-quest
  - BelegCufea/CompassHUD (WoW Lua)
  - jekkle/cartur-compass-clock (C#, Skyrim bar)
- A GSAP forum thread confirms that the shortest-path rotation at 0/360 is a common animation bug (fixed with GSAP's `_short` rotation suffix).

## E. Tech verdict for a weekend hackathon

**Rendering.** Use SVG or CSS transforms for the dial, and keep it 2D. Most of the working, good-looking examples rotate one group or element per frame: #9 canvas-gauges, #10 flight indicators, #11 the Svelte strip, #13 Emoji Compass, #15 luopan, #18 Watch compass. That approach is resolution-independent, easy to theme, and needs no build pipeline.
- **Canvas2D** is the next step if you want textured skeuomorphism for free. SteelSeries (#8) gives a brass instrument with one constructor and an elastic needle.
- **PixiJS** (#14) is the cheap way to get glow, such as a radar sweep with additive blend, without writing shaders.
- **three.js** is justified only for a "hero" 3D brass object: #24 Poly Haven CC0 model with #4 LocAR slerp controls, or #23's 3D needle. It costs more time and battery and needs an asset check. Use it for a landing or attract screen, not the core instrument.
- Retro styling (CRT scanlines, phosphor green) is a CSS overlay layer (#19, #12) on top of either approach.
- For a Skyrim strip, use #11's wrap-safe tick math (SVG) or #1 `compassMarks` (Canvas).

**Input-handling pattern** (the evidence converges on this; #1, #3 and #5 all implement it correctly):
1. Request permission from a button tap: `if (typeof DeviceOrientationEvent.requestPermission === 'function') await DeviceOrientationEvent.requestPermission()` (#1, #2, #3).
2. Listen to **both** `deviceorientationabsolute` and `deviceorientation`. Let the absolute event win once a real sample arrives (#1 l.97-110, #2 l.106-114).
3. Heading = `e.webkitCompassHeading` (iOS, already clockwise from north). Otherwise use `360 - e.alpha`, only when `e.absolute`, or the tilt-compensated formula from #6 if the phone is held upright. Never use `webkitCompassHeading || alpha` (#22 bug) or raw relative alpha (#16 bug).
4. Add `screen.orientation.angle` (#1, #3).
5. Smooth wrap-safely, using either a shortest-path lerp, `a + (((b - a + 540) % 360) - 180) * t` with t about 0.15-0.25 in a rAF loop (#1, #5, #14), or a critically damped angular spring (#3 `spring.ts`, #20 physics) for a physical needle. A circular mean (#2) also works. If you use CSS `transition` on rotation, accumulate an unwrapped angle; never feed raw 0-360 values.
6. Build a demo or no-sensor fallback from day one: idle spin (#18), drag-to-rotate (#13 GSAP Draggable, #21 atan2) and a no-data watchdog (#1). This matches the earlier finding that indoor compasses are unreliable.

**Licenses.**
- Safe to copy with attribution: Cosmodial `gyro.js` (MIT), Parchment `spring.ts` (Apache-2.0), canvas-gauges (MIT), the Svelte CompassBar (MIT), SteelSeries (BSD-style; keep the header), NOAA (CC0) and the Poly Haven model (CC0).
- Reference only: GPL/AGPL projects (#10, #12, #19) and unlicensed repos (#14-#17, #20, #25).
