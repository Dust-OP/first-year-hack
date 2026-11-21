# Result: front-end design and tech for the compass element

Date: 2026-11-21. Project: KCL First Year Hackathon, Track 2 "Retro Remix" (repo `Dust-OP/first-year-hack`, folder `new-project/`).
Status: **approved by the project owner on 2026-11-21.** The technical recommendation (points 1–4 below) is adopted in demo v1 (`app/public/compass.js`, `app/public/heading.js`). The visual style is a separate decision: see Adoption state.

## Recommendation

1. **Build the compass dial in SVG and rotate one `<g>` with a CSS transform**, driven by a `requestAnimationFrame` loop.
   - This is how most of the good-looking working examples are built (canvas-gauges config, the Svelte CompassBar, Emoji Compass, luopan, the MokiMeow Vue dial). Community opinion also prefers SVG to Canvas for crispness and accessibility (HN 12580929).
   - Retro effects (CRT scanlines, phosphor glow, brass gradients) go on as a CSS/SVG-filter overlay.
   - Use three.js only for an optional 3D "hero" object, such as the CC0 Poly Haven brass compass model. three.js dropped DeviceOrientationControls in r134; LocAR.js is the maintained replacement. *(verified-in-source, worker; community-reported)*
2. **Copy the heading-input pattern from Cosmodial `js/ui/gyro.js`** (MIT, commit `630c928`):
   - Ask for the iOS 13+ `DeviceOrientationEvent.requestPermission()` from a button tap, over HTTPS.
   - Listen to both `deviceorientationabsolute` and `deviceorientation`; once a real absolute sample arrives, let the absolute event win.
   - On iOS use `webkitCompassHeading`; elsewhere use `360 - alpha`, and only when `e.absolute` is true.
   - Add `screen.orientation.angle`.
   - Smooth along the shortest path: `a + (((b - a + 540) % 360) - 180) * t`, with t ≈ 0.2. Never put a CSS transition on raw 0–360 values.
   - *Status:* verified-in-source. The main agent spot-checked lines 24–109 via `gh api`. Not executed on a phone.
3. **Build a no-sensor demo mode from day one**: drag-to-rotate or an idle spin, plus a calibrate prompt.
   - Indoor phone compasses drift by tens of degrees or more. CampMap measured more than 100° near concrete; see [`../retro-compass-prior-art/`](../retro-compass-prior-art/SUMMARY.md).
   - iOS in-app browsers can deny the permission instantly. *(community-reported, inferred for the KCL venue)*

## Style directions, with references

| Direction | Best references |
| --- | --- |
| Brass / nautical instrument | SteelSeries-Canvas, Emoji Compass, Rhumb Line, Poly Haven Seadogs model, Tactile UI liquid-damped compass |
| Game HUD heading strip (Skyrim/Forza) | fh6-tel CompassBar.svelte, Cosmodial strip, Coherent Labs CSS-3D |
| CRT / Pip-Boy / military HUD | F18-HUD (copy the look only; AGPL and buggy input), PIP Compass LT, PipBoy scanlines (GPL) |
| Radar sweep | ggj0101 Dragon Ball radar (PixiJS; no license, so reference only) |
| Old-map generative rose | watabou Compass Rose Generator / CompassOS |
| Cultural instrument | luopan (feng-shui compass) |
| "Points to a target, not north" | target-compass, Eye of Ender, Galactic Compass, LeaScope, "What's in that direction?" |

## Candidate count

41 distinct candidates in total (26 + 17 − 2 overlaps):
- **GitHub worker:** 26. Source was read for 23; the other 3 have metadata only or were partly read.
- **Community worker:** 17 with reception evidence. 12 threads were read with replies; 5 were read as the post only.
- **Overlap:** 2 (canvas-gauges, watabou).

The full per-candidate data (URLs, stars, license, commit, line anchors, quotes) is in [`github-frontend.md`](github-frontend.md) and [`community-reception.md`](community-reception.md).

## Visual showcase

[`showcase/index.html`](showcase/index.html) shows every candidate plus 6 leads, 47 cards in all, each with screenshots, tech, licence, what to borrow and reception. A published copy is at https://claude.ai/artifact/Ho9vk78aBfuxteoMkCob7N; it is private until shared.

- **How the images were made:** screenshots were taken on 2026-11-21 with headless Chromium (Playwright build 1248) and no compass sensor, so live apps show their no-sensor or permission state. Other images are the projects' own README or store images. The SteelSeries brass view was rendered by us from the library.
- **Cards without a picture (8):** the reason is given on each card: Product Hunt bot check, a 404, no published screenshot, or no public page.
- **Third-party content:** the screenshots are third-party content, kept for design reference only.
- **Build inputs:** `showcase/tools/` holds the item data, image manifest, capture log, page template and the `capture.py` / `build.py` scripts.

## Limits and gaps

- **Reddit was not inspected.** WebFetch refuses reddit.com, old.reddit and web.archive.org. WebSearch rejects the reddit.com domain filter. Direct curl was denied by the permission classifier. No Reddit thread is counted. *Next check:* a team member opens Reddit search in a normal browser for "compass" in r/web_design, r/threejs, r/InternetIsBeautiful and r/creativecoding, and pastes the threads in.
- CodePen (403) and the Framer Pip-Boy component (429) were not opened.
- Live demos only got an HTTP status check. No candidate was run on a phone.
- License: copy with attribution from MIT, Apache-2.0, BSD-style and CC0 sources only. Treat GPL, AGPL and unlicensed repos as visual reference only.
- The PipBoy repo contains a hard-coded third-party API key. Do not reuse it; the key is not reproduced here.

## Adoption state

- **2026-11-21, approved by the project owner.** Adopted in demo v1 (`app/`, commit `8225e57`): SVG dial rotated with a CSS transform, DeviceOrientation heading with the iOS permission prompt, and a no-sensor drag-to-turn demo mode.
- **Visual style:** on 2026-11-21 the owner chose to replace the brass-and-paper look of demo v1 with Apple-style liquid/frosted glass with the Apple system colours and fade transitions for each action. That style choice is the owner's direction, not a recommendation from this research.
- **Still unverified:** nothing has run on a real phone. Next check: open `app/` over HTTPS on one iPhone and one Android phone, outdoors, and record what the heading does.
