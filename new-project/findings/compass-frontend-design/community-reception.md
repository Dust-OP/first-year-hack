# Worker report: community reception of compass front-end designs

Worker: community-reception. Date: 2026-11-21. Read-only research. Nothing was logged in to, posted or voted on. Fetched pages were treated as data.
Companion slice: GitHub repo source reading (another worker). Related prior-art reports: `../../20261121-retro-compass-hackathon/workers/`.

## 0. Access limits (read first)

- **Reddit could not be read at all.** WebFetch refuses `www.reddit.com` and `old.reddit.com`. WebSearch rejects `allowed_domains: reddit.com` because Reddit blocks the crawler, and `site:reddit.com` queries returned no Reddit URLs. Redlib mirrors failed (TLS error, connection refused, 403, Anubis bot wall). `web.archive.org` is also refused. Curl to Reddit was denied by the permission classifier, and I did not work around that.
- Result: **no Reddit thread is counted as inspected**, and I have no Reddit thread URLs to give even as leads. If Reddit reception matters, someone should read it in a normal browser. Suggested searches: r/webdev "compass", r/threejs "compass", r/InternetIsBeautiful "compass", r/Fallout "pip-boy web", r/sailing "KIP".
- **Substitutes used:** Hacker News (threads read through news.ycombinator.com, plus the hn.algolia.com search API to find them), the three.js Discourse forum, Product Hunt, itch.io comments, the OpenMarine forum, the App Store, GitHub issues, WebKit Bugzilla, the GSAP forum, dev.to and maker blogs.
- CodePen pen pages returned 403, and the Dribbble search page came back empty, so pens and shots there have no stats. Awwwards' "compass" search found only brand sites named Compass, with no compass UI.

Status key: **thread read** = post and replies read. **post only** = post or page read, no replies (or none exist). **lead only** = seen in search results, not opened, or opened but unreadable.

## 1. Candidates

Ordered roughly by how useful the reception is to the team.

### 1. lamplightdev "A cross-browser offline-enabled web compass" (web, rotating dial)
- Project: http://lamplightdev.github.io/compass/ (repo github.com/lamplightdev/compass). Discussion: https://news.ycombinator.com/item?id=9008213 (HN, 2015-02-06, 54 points, 24 comments).
- Look and tech: a phone web app with a rotating outer dial, a needle, N/E/S/W labels and a HDG/Lat/Lng readout. It works offline. It uses the Location, Device Orientation, Screen Orientation, Screen Lock and Fullscreen APIs. The page tells users to trace a figure 8 to calibrate.
- Reception:
  - jnbiche: "a very attractive design, despite it's technical difficulties."
  - moron4hire: "getting things to look this nice in mobile browsers AND actually do something is really hard." Also: "usually it's the needle that moves with the orientation, not the dial."
  - financequoll: "The outer ring rotates twice as much as I physically rotate my phone." jipumarino said that on an iPhone 5 "it seems to point exactly in the opposite direction." Another user said Android in landscape was off by a quarter turn.
  - lamplightdev (author): "each browser seems to have its quirks in the implementation of the spec".
- Status: thread read.
- Borrow: the praise went to the look, and the complaints were all about sensor-axis bugs. Test iOS (inverted alpha versus `webkitCompassHeading`) and landscape before the demo. Decide on purpose whether the card or the needle rotates. Show the heading as a numeric readout.

### 2. Galactic Compass (native iOS, floating green arrow) and Galactic Compass 2 (AR, Liquid Glass)
- Project: https://interconnected.org/home/2024/02/15/galactic-compass. Discussion: https://news.ycombinator.com/item?id=39389858 (HN, 2024-02-15, 175 points, 60 comments). v2: https://interconnected.org/home/2026/08/21/galactic and https://news.ycombinator.com/item?id=49391348 (23 points, 3 comments).
- Look and tech: one floating green 3D arrow that always points at the galactic centre. It was the author's first app, built with ChatGPT. v2 adds a RealityKit AR mode ("the arrow remains rock solid as you walk around"), an Apple Watch haptic "bump" when the arrow points straight ahead, and a Liquid Glass look.
- Reception:
  - crazygringo: "the drawn arrow totally breaks down when the phone is held vertically."
  - genmon (author): "I need to find someone more familiar than I am with combining quaternions and reference frames to lend a hand!"
  - v2 post (author): the first version "didn't work when you lifted your phone higher than about 30 degrees". The fix was quaternions.
- Status: thread read (v1). v2: post and 3 replies read.
- Borrow: the single-purpose "points at something absurd and poetic" idea is what drew 175 points, not visual complexity. If the needle has to work with the phone held upright, use full orientation (quaternions or a 3D library), not just alpha. The haptic "on target" bump is a cheap feature to copy.

### 3. Rhumb Line: a 3D ship's cabin chart table (three.js, nautical/retro)
- Project: https://shockingmike.github.io/rhumb-line/. Discussion: https://discourse.threejs.org/t/rhumb-line-explore-a-3d-ships-cabin-to-find-the-coffee/94404 (three.js forum showcase, 2026-09-16, 6 likes, 5 replies).
- Look and tech: a concept landing page for a fictional coffee roaster. You sit at a chart table at sea with 9 clickable objects, including a compass. A porthole brings in a storm, and the paper chart becomes a 3D chart. It uses three.js r186 with no model or texture files: all geometry is procedural, using MeshPhysicalMaterial clearcoat and transmission, PMREM lighting, GTAO, depth of field, bloom, ACES and SMAA. Quality drops when FPS drops, and there is a scrolling fallback without WebGL.
- Reception:
  - manthrax: "Great vibes, and verrry nice/clean presentation!"
  - red-reddington: "Very artistic. Bravo for the concept!" He also reported that pinch-zoom on mobile scales the viewport and pixelates the scene, and suggested `maximum-scale=1, user-scalable=no`.
- Status: thread read.
- Borrow: a strong reference for a brass-and-lacquer nautical scene. Copy the adaptive-quality and no-WebGL-fallback ideas. Lock viewport zoom on a full-screen WebGL compass.

### 4. Canvas Gauges (analog gauge library; the debate over skeuomorphic dials)
- Project: https://canvas-gauges.com/. Discussion: https://news.ycombinator.com/item?id=12580929 (HN, 2016-09-26, 149 points, 59 comments).
- Look and tech: skeuomorphic radial and linear gauges drawn on Canvas, about 10 KB gzipped (askmike). Radial gauges can be configured to look like a compass. No compass example came up in the thread.
- Reception (instructive critique):
  - throwawayReply: "Radial gauges are an example of bad skeuomorphism." white-flame replied: "They're the quickest way to convey a scalar value at a glance."
  - extra88: "SVG is probably a better choice than canvas." andrewstuart2 recommended SVG with D3 and text labels.
  - ctoth: "These do not appear to be accessible at all." extra88: "its better to bake accessibility in to a thing than to have a separate accessible version."
  - perilunar: "The bounce on that first thermometer-style gauge is just weird, and breaks the illusion."
- Status: thread read.
- Borrow: a compass is the one place where a radial dial is unambiguously right. Still pair it with a large numeric bearing, and make animation overshoot feel physical rather than bouncy. Canvas output is invisible to screen readers, so expose the heading as text or ARIA.

### 5. Tactile UI "Compass" by Ciprian Titire (React/web component, liquid-damped skeuomorphic)
- Project: https://21st.dev/@cipriantitire/components/compass (library: https://21st.dev/@cipriantitire/library/tactile-ui). Peerlist: https://peerlist.io/cipriantitire/project/tactile-ui (403, not read).
- Look and tech: a "liquid-damped compass". The card swings past its mark and settles, a lit display shows the bearing, and a knurled bezel turns one degree per click. It is themed from shadcn and supports `.dark`. Screen readers get a real slider (0–359, announced like "274 degrees, west", with arrow, Shift and Page keys). It is MIT-licensed in the free set and installs through the shadcn CLI (21st API key, with limited free installs). The library claims React, Vue, Svelte or plain JS with no dependencies (third-party listing, not verified).
- Reception: no visible likes or comments.
- Status: post only.
- Borrow: the best "modern skeuomorphic" reference found. Its damped overshoot and settle answers the "bouncy gauge" critique in #4, and its slider semantics answer the accessibility critique. The GitHub worker should check its source.

### 6. MBCompass (Android, Compose-era FOSS compass): smoothing versus latency
- Project: https://github.com/CompassMB/MBCompass. Discussions: https://news.ycombinator.com/item?id=44155741 (2025-06-02, 61 points, 38 comments) and https://news.ycombinator.com/item?id=46614688 (2026-01-14, 137 points, 47 comments).
- Look and tech: a minimal dial with an accuracy readout in the top bar, a recalibration dialog and an OpenStreetMap view. Android sensor fusion (accelerometer, gyroscope and magnetometer) plus a low-pass filter. True north via declination.
- Reception:
  - AshamedCaptain: "Pretty snappy, almost matches the refresh rate and latency of the iphone's compass app." The same user later: "TFA looks way more sluggish, but I guess it is an effect of the smoothing."
  - nativeforks (author): "MBCompass applies smoothing intentionally to reduce jitter on noisy sensors — especially on low-end devices."
  - rapnie: "I get compass deviation of >60° as if the train is making curves all the time."
  - maelito: "Not many people know that compass on the Web is possible."
  - ianburrell: "It would be really useful if it could show true north in addition to magnetic north."
- Status: thread read (both).
- Borrow: tune the smoothing amount, because people notice both jitter and lag. Show an accuracy or calibration state. Offer a true/magnetic toggle as a credibility feature.

### 7. watabou Compass Rose Generator (generative, old-map aesthetic)
- Project and discussion: https://watabou.itch.io/compass-rose-generator (comments: https://watabou.itch.io/compass-rose-generator/comments, itch.io, oldest comments are about 7 years old).
- Look and tech: a procedural, ornate cartographic compass rose with palettes, runnable in the browser. The same author added a rose to the Perilous Shores map generator (C toggles it, Shift+C customises it).
- Reception:
  - Vospi: "Man, they are so beautiful." reptilebooy: "I cannot begin to explain how amazing this is"
  - cpeter2: "I wish there was a way to save the Compass Rose you make as a PNG". Daveeisinger: "Transparency would be wonderful; SVG export would be even better."
  - Vagabondluc: "You should include the option to change the direction of the north"
- Status: thread read (comments).
- Borrow: a procedural rose seeded per user or per destination could be the "remix" angle. Make the rose exportable (SVG/PNG) and keep it as vector art.

### 8. "There": a web cosmic compass (browser, 3D arrow + AR)
- Discussion: https://www.producthunt.com/p/there-c8f71fe3-71b4-4633-8d40-584e4c7e40e8/there-4 (Product Hunt, about late 2025, 9 replies).
- Look and tech: browser-based with no install or account. It uses location and device sensors to drive a 3D arrow that points to each planet as you turn, has a camera AR overlay, and the arrow cycles accent colours. The maker built it with Google AI Studio/Gemini.
- Reception:
  - Donkey: "Love this idea and love that you've not required registration." and "I think it might just need some tweaking on the responsive design element."
  - Sen Lin (maker): "I think the planet now on the desktop is too big so will adjust a bit to make it looks nicer"
- Status: thread read.
- Borrow: proof that a web-only, no-login sensor compass is well received. Design a desktop/no-sensor fallback screen on purpose.

### 9. "What's in that direction?" (iOS compass of landmarks, sun and golden hour)
- Discussion: https://www.producthunt.com/posts/what-s-in-that-direction (Product Hunt, 2026, 127 points, #11 of the day, 16 comments). Built with Flutter, Firebase and Wikipedia.
- Look and tech: a compass that lists places of interest in the direction you point, with sunrise and sunset direction and golden hour.
- Reception:
  - Martin Machava: "I love it and the idea is so unique!"
  - Johannes Berding (maker) on what's next: "A new compass face with a map - sort of a gta-style inspired minimap"
- Status: thread read.
- Borrow: the content around the dial (what lies in that bearing) carries the product. The maker himself pointed to a game-minimap face as the next step.

### 10. PhotoFind: a compass that points to a photo's EXIF location (native iOS, after a failed web attempt)
- Project: http://www.getphotofind.com/. Discussion: https://news.ycombinator.com/item?id=9600400 (HN, 2015-05-25, 120 points, 47 comments).
- Look and tech: pick a photo and an arrow points to where it was taken. The author first tried JavaScript, but iOS strips EXIF location from file-input uploads, so the app went native.
- Reception:
  - mrfusion: "The compass isn't updating for me in iphone 6."
  - gohnjanotis (author): "Sometimes there are calibration issues." and "Try rotating your phone around in a circle a bunch"
- Status: thread read.
- Borrow: the "point at a memory" idea suits Retro Remix. Warning: browser uploads on iOS may strip EXIF GPS, so test before relying on it.

### 11. LeaScope: "What country you would hit if you went straight where you're pointing" (iOS)
- Discussion: https://news.ycombinator.com/item?id=44962767 (HN, 2025-08-20, 80 points, 40 comments).
- Look and tech: traces the great circle along the phone's bearing and shows the first country hit, with historical maps (1 BC to 1900 AD) and AI blurbs.
- Reception:
  - brgross (author): "Probably will work best if you hold your phone pretty flat :)"
  - cozzyd: "I suppose the heading error from the compass is so large there is little reason to use the real geodesic"
  - dmd: "if I face 270, I get Canada, but if I face 269.9, I get Mexico."
  - adamcharnock said his first instinct was to point the phone at the floor to look for Australia.
- Status: thread read.
- Borrow: an "old maps through a compass" concept that fits Retro Remix. Show the uncertainty (a cone or sector, not a line), because a phone heading is only good to a few degrees.

### 12. Coherent Labs "Making a 3D compass" (game HUD compass strip in CSS 3D)
- Project: https://coherent-labs.com/blog/uitutorials/hud-3d-compass (blog, 2024-09-11, Martin Bozhilov).
- Look and tech: a curved HUD ring of 24 semi-transparent planes (15° each), with `preserve-3d`, `perspective: 2500px`, yellow bold cardinal labels, tick marks, and POI icons (quests, enemies) riding the ring.
- Reception: no comments on the page. The author's own caveat is that radius rounding causes 1–2 px gaps or overlaps at some widths, which needs manual `translateZ` tuning.
- Status: post only.
- Borrow: the Skyrim/Fallout-style heading strip is a good second view (a top strip alongside the round dial). Plain CSS can do it without WebGL.

### 13. Lee Martin's star "wayfinder" for Ayra Starr (three.js + device orientation, music-campaign web app)
- Project write-up: https://dev.to/leemartin/finding-stars-and-affirmations-in-the-sky-with-threejs-for-ayra-starr-2e4g (dev.to, 2024-04-01).
- Look and tech: a three.js sky with a star sprite and a 2D wayfinder arrow made by converting the target to camera space and applying `atan2` → CSS rotate. It uses the removed `DeviceOrientationControls`, patched back in with patch-package. Orientation permission is requested alongside camera permission in an onboarding step.
- Reception: 0 comments.
- Status: post only.
- Borrow: the "ask for permission in an onboarding step" pattern, and the cheap 3D-target → 2D-needle maths. Note the dependency on a class three.js removed.

### 14. KIP (Signal K marine instrument panel): a real sailing-instrument web UI
- Project: https://github.com/mxtommy/Kip. Discussion: https://forum.openmarine.net/showthread.php?pid=14222 (OpenPlotter forum thread "@mxtommy KIP instrument display webapp for Signalk", post #84, 2020-05-18).
- Look and tech: an Angular web app with a marine compass card widget (heading, bearing to waypoint, wind angle) and a sailboat wind gauge. It ships with Signal K and runs on boat tablets.
- Reception:
  - fishy: "I find the compass dials a win- but they are hard to read." and "Maybe a bit more contrast , or a dial based on a 'regular' ship compass?"
- Status: post only (one relevant post in a long thread). A second OpenMarine thread (tid=2796) only says "Try KIP."
- Borrow: real sailors want a ship's-compass card look and high contrast. Contrast matters more than ornament for anything read in daylight.

### 15. PIP Compass LT (Fallout/Pip-Boy-themed iOS compass)
- Project: https://apps.apple.com/us/app/id1484261553 (App Store, v1.0 on 2019-10-22, 4.8 from 64 ratings).
- Look and tech: a Fallout-themed compass and map. Not a web app.
- Reception:
  - Riot the boss: "This app feels like stepping straight out into the Fallout wasteland and glowing pit boy colors"
  - Lyra t Scarlett: "every once in a while it will say north when it's not pointing north"
  - Nikoname1rst: "I just wish you could plot destinations on it and then it would be truly perfect."
- Status: post only (store reviews).
- Borrow: Pip-Boy green CRT is a proven nostalgic skin. Users asked for destinations on the dial, so a "point to X" mode would be wanted. Web CRT-effect leads, not inspected for reception: Framer Pip-Boy component https://www.framer.com/marketplace/components/pipboy/ and `vault66-crt-effect` (npm, Fallout preset).

### 16. "The first new compass since 1936" (physical, inductively damped, transparent face)
- Video: https://www.youtube.com/watch?v=eiDhbZ8-BZI. Discussion: https://news.ycombinator.com/item?id=46464689 (HN, about 2026-01, 67 points, 55 comments). Hackaday: https://hackaday.com/2026/01/11/a-new-kind-of-inductively-damped-compass
- Why it's here: a current retro-instrument design talking point. Eddy-current damping lets the face be see-through.
- Reception:
  - artimaeis: "By removing the plate and adding the ring, you can see through the face"
  - iefbr14: "In the demo there is a cut in the video where the needle abrubtly stops." Several commenters suspected the demo was edited.
  - IAmBroom: "Traditional compasses don't seem to be as easily fooled by stray EM noise."
- Status: thread read.
- Borrow: the visual motif of a transparent face with a floating ring for a glass UI. A demo of "damped needle settling" must look honest, because HN noticed edited footage.

### 17. Marine-Compass by richtr: "Standards-compliant 3D compass for the web" (2012)
- Project: https://github.com/richtr/Marine-Compass. Discussion: https://news.ycombinator.com/item?id=4115768 (HN, 2012-06-15, 5 points, 2 comments).
- Reception: altsa: "I'm trying to load the demo on my Macbook Pro with Chrome, but its not working". The author replied that it works on Chrome 19. The same author later wrote the Full-Tilt orientation library he recommended in thread #1.
- Status: thread read (thin).
- Borrow: historical. A 3D marine card on the web is an old idea, so the novelty has to come from elsewhere.

### Lead only (not counted)
- Compass in the Sky (blinry, "a game of solar orientation"): https://sun.blinry.org, HN https://news.ycombinator.com/item?id=34456220 (2 points, 0 comments). The page text was empty to the fetcher.
- Rive "Compass UI" by drawsgood (CC BY, "A number driven compass UI", 2023-03-15): https://rive.app/community/4625-9365-compass-ui. No counts are visible. It could be driven by a Rive state-machine number input.
- OpenBridge maritime design system (web components, HTML/SVG, includes ship instruments): https://github.com/Ocean-Industries-Concept-Lab/openbridge-webcomponents, Figma showcase post with 0 replies. Not confirmed to include a compass.
- Show HN Spacetime Watch (astrolabe-inspired Wear OS face): https://spacetime.watch/ (2 points, 1 comment).
- A geography game where you aim a compass at cities on a globe: https://compasspost.nodewires.com/, HN https://news.ycombinator.com/item?id=50522994 (3 points). The one reply says nothing about the design.
- CodePen compass pens seen in search (no stats, the pages returned 403): codepen.io/louh/pen/KpXeey (SVG), codepen.io/chrislanejones/pen/yyYPOPa (React + Framer Motion SVG), codepen.io/shelvaldes/pen/vYGEeZQ (clip-path + `--metal` variable), codepen.io/chris22smith/pen/LWOGmO (Fallout 4 Pip-Boy screen in CSS).

## 2. Tech feedback from the community

### iOS permission (the biggest practical risk)
- History. iOS 12.2 added a Safari setting with motion access off by default. In 2019, Jay_Treat on the three.js forum found it worked only with HTTPS plus the setting ("HTTPS fixes it!"): https://discourse.threejs.org/t/iphone-ios-12-2-will-disable-gyroscope-access-by-default/6579. iOS 13 replaced this with `DeviceOrientationEvent.requestPermission()`.
- sirxemic (three.js #17713, 2019): "do this on a user action like tapping a button". Also: "once you've permitted (or denied) controls, it won't ask again (even in new tabs) until you restart safari." https://github.com/mrdoob/three.js/issues/17713
- MDN: `requestPermission()` needs transient activation. Pass `true` to include the magnetometer (compass) data. Secure context only.
- Embedded WebViews or in-app browsers can resolve "denied" immediately, as in the Pi Browser issue: https://github.com/pi-apps/pi-platform-docs/issues/630. Demo in real Safari or Chrome, not inside a QR-scanner's in-app browser.
- Brave on desktop or Android may silently block the API. andirk: "I like how it doesn't work on default Brave browser! Does work on my default android Chrome." https://news.ycombinator.com/item?id=44002631

### Getting a real heading across browsers
- iOS Safari: read `event.webkitCompassHeading`, which is clockwise from magnetic north. Chrome/Android: use `deviceorientationabsolute` and `360 - alpha`. WebKit does not implement `deviceorientationabsolute`. marcoscaceres (W3C #137, 2024): "In WebKit specifically, we don't implement" it. The spec question is still open: https://github.com/w3c/deviceorientation/issues/137
- Plain `deviceorientation` alpha can be relative to the page's starting orientation, not north (dev.to write-up).
- Holding the phone upright or in landscape breaks naive maths. moron4hire (HN 2015): in portrait "it completely gimbal locks". Galactic Compass broke above about 30° tilt until the author learned quaternions. Roger Cheng found Chrome's Generic Sensor `Magnetometer` "screen" frame transform "backwards" in landscape: https://newscrewdriver.com/2023/04/12/compass-web-app-in-landscape-exposed-browser-bugs. Practical answer: **lock the UI to portrait and tell users to hold the phone flat**, like LeaScope's author did.
- Firefox showed "Use of the orientation sensor is deprecated" warnings, and Firefox lacks the Generic Sensor API (HN gyro-web thread https://news.ycombinator.com/item?id=26327532). AbsoluteOrientationSensor is effectively Chromium-only.

### Jitter, smoothing and needle animation
- There is a trade-off between smoothness and lag (MBCompass thread above). Use a low-pass filter on the angle, but note that a naive average breaks at 359°→0°. Smooth on sin/cos or on the unwrapped delta.
- The wraparound spin is a common bug. GSAP admin Rodrigo: "add to the rotation value using relative values, that is += or -=", for example going 355→375 instead of 355→15: https://gsap.com/community/forums/topic/45500-using-gsap-to-animate-a-rotating-compass-needle-smoothly-while-keeping-it-accurate-with-an-online-compass-gps-direction/. Roblox and GDevelop users report the same full-360 spin. Fix: keep a cumulative angle and add `((target - current + 540) % 360) - 180` each frame.
- WebKit Bug 217043 "Deviceorientation controls jumping/shaky" (iOS 13/14, three.js/A-Frame) is still open, with no root cause. "a restart appears to address the issue": https://bugs.webkit.org/show_bug.cgi?id=217043
- Interference. rapnie saw more than 60° deviation on a train. The devtools.tools guide says "Indoors, near appliances, or inside a metal-frame building, expect drift of tens of degrees": https://www.devtools.tools/blog/digital-compass-guide. Several apps prompt a figure-8 calibration. **For a KCL indoor demo, expect the heading to be off, and add a "calibrate / manual dial" fallback.**
- Physical-needle note: ghusbands (HN #16) said eddy-current damping "works best while the needle is moving fast". A smoothing curve that is critically damped (no long wobble) reads as "real instrument".

### three.js vs SVG vs Canvas (community opinion)
- three.js removed `DeviceOrientationControls` in r134 (PR #22646) because a reliable cross-device implementation wasn't possible. Lee Martin patched it back in with patch-package. Forum users now drive the camera from raw `deviceorientation` themselves. ch3 (three.js forum, 2022): his custom approach "kinda works, but not great and it gets into a gimbal lock when pointing the phone vertically": https://discourse.threejs.org/t/accurate-device-orientation-tracking/36201
- SVG over Canvas for gauges: extra88 and andrewstuart2 in the Canvas Gauges thread, mainly for accessibility and text labels. The three.js forum also overlays an SVG/HTML compass that rotates to the camera direction rather than drawing it in WebGL.
- three.js earns its place for a full atmospheric scene (Rhumb Line), not for the dial itself. Rhumb Line still needed adaptive quality and a fallback.
- CSS 3D is enough for a HUD strip (Coherent Labs). CSS `transform: rotate()` on an SVG card is what most working web compasses use (lamplightdev, Lee Martin's wayfinder, dev.to/online-compass).
- Suggested default: **an SVG dial and needle rotated with CSS transforms, plus a requestAnimationFrame smoothing loop**. Add three.js only for a hero scene.

### Libraries mentioned by community members
- Full-Tilt (richtr) was recommended in the 2015 HN thread. It is old and needs checking before use.
- `react-world-compass` (`useCompass` hook): https://github.com/chunlaw/react-world-compass (lead only).
- GSAP CSSPlugin short rotation, or relative `+=` rotation, for the needle.
- Tactile UI Compass (MIT, shadcn) as a ready skeuomorphic component.
- Canvas Gauges (about 10 KB gzipped), JustGage, and an SVG Ractive gauge (konsumer) as gauge options. The thread said Canvas Gauges is not accessible.

## 3. Search scope and uncertainty
- Queries covered Show HN compass threads (via the Algolia API: show_hn "compass", "deviceorientation", stories over 40 points), three.js forum, Product Hunt, itch.io, Dribbble, CodePen, Awwwards, Codrops, Rive, 21st.dev, OpenMarine, App Store, GitHub issues, W3C and WebKit.
- Not covered: Reddit (blocked, see §0), X/Twitter (not attempted, as no reliable fetch path exists), Behance, and Codrops (no compass demo surfaced in search). Dribbble and CodePen stats were unavailable.
- Most praised items are niche (single-digit to low-hundreds votes). The strongest HN reception (Galactic Compass, 175 points) rewarded the concept over the visuals.
