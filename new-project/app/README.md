# Career Compass (demo v1)

Working title. A phone web app for **Track 2: Retro Remix**: the compass no longer points north, it points at the person nearby you should be working with.

Built 21 Nov 2026. No dependencies: Node 20+ only.

## The flow

1. **Sign in with email** (a one-time code sent by Logto), then fill in your profile: name, what you do, your LinkedIn profile, what you offer and what you are looking for. Without Logto configured, a quick sign-up with no email check takes its place.
2. **Start compass.** The phone asks for location and motion access.
3. The dial shows everyone within 500 m who has the app open. The **red needle** points at your best match (tap anyone else to follow them instead).
4. **Turn until the needle points up.** The dial moves like a real compass: it follows you with a little inertia, overshoots slightly and settles. Hold your aim on someone (within 15°) for a moment and the compass has found them: a ring closes round the rim, the markings fade into **their profile picture** in the same glass disc, and their card pops up with who they are, why they match and their LinkedIn link. Turn 28° or more away, tap the picture or close the card, and the compass fades back. Tapping someone's dot shows them at once.
5. **Send invitation.** They get it under *People*, read your profile, and **accept or decline**.
6. Once accepted, both sides get **Connect on LinkedIn**, which opens the other person's real LinkedIn profile.

## Run it

```sh
cd new-project/app
npm start          # http://localhost:3000
npm test           # 8 tests: bearings, LinkedIn URL check, invite/accept/decline, demo bots, email sign-in
```

A laptop has no compass sensor that a browser can read, and the app says so instead of pretending. You turn by hand, and the dial still behaves like a physical thing:

- **Drag** it and it stays under the pointer. **Flick** it and it keeps spinning until friction stops it.
- **Scroll** over it with the wheel or two fingers.
- **Left/right arrow keys**: a tap turns 5°, holding the key spins the dial up and letting go lets it coast.
- In Safari, two fingers turning on the trackpad rotate it too (written; Safari was not run).

A device that does have a sensor (tablets, some 2-in-1s) uses it without being asked. *Turn by hand* under *Demo tools* switches between the two on any device.

Open *Demo tools* and tap **Add demo people** to place five bots around you; one of them invites you, and any bot you invite accepts after a few seconds. That shows the whole flow on one device. *Demo tools* also shows the heading input live: which event arrived, its alpha, beta and gamma, and the heading made from them.

### On real phones

Browsers only give location and compass access to **HTTPS** pages, so `http://192.168.x.x:3000` will not work on a phone. Put the laptop behind an HTTPS tunnel and open the tunnel URL on both phones, for example:

```sh
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

(Not tried on this machine yet.) On iPhone use Safari itself, not a browser inside another app: in-app browsers can refuse motion access.

#### What to check on a phone

Nothing below has been seen on a real phone. Open *Demo tools* first: its readout shows what the sensor sends. Stand outdoors, away from cars and railings, and use a second phone's compass app or a known street direction as the reference.

On both phones:

1. **Start.** Tap *Start compass* and allow motion and location. The readout's first line should say `the compass sensor` within a second or two, not `by hand`.
2. **Flat.** Hold the phone flat and face north, east, south and west in turn. Write down the heading on each. It should agree with the reference to within about 10°.
3. **Tilted.** Face one fixed landmark and raise the phone slowly from flat to upright, as if to take a photo. The heading should stay within about 10° all the way. Note any jump and the `beta` at which it happens (the hand-over between "top edge" and "back of the phone" is at beta 65° to 80°). On Android, above about 65° of lift a rolled wrist shifts the heading (a 20° roll moves it about 14° at 70° of lift and 20° at 75°), so keep the phone level from side to side while you raise it.
4. **Upright with a twist.** Hold it upright and turn only your wrist left and right by about 30°. The heading should follow where the back of the phone faces.
5. **Landscape.** Unlock rotation, turn the phone on its side (both ways), face the same landmark flat and upright. The heading should match step 2, and `screen` in the readout should read 90 or 270.
6. **Feel.** Turn a quarter turn briskly and stop. The dial should arrive, pass the mark by a few degrees once and settle in about half a second. At rest it should be steady or tremble by less than a degree. If it lags or swings too much, change `rose` in `public/tuning.js`.
7. **Find someone.** With demo people added, or a teammate 50 m away: turn to them, hold still. The ring should close in under half a second and the picture (or initials) fade in, once, with no flicker. Sweep past them quickly: nothing should appear. Turn away: it should go only after about 28°.
8. **Back from the background.** Switch to another app for ten seconds and return. The dial should carry on from where it was without spinning.
9. **By hand.** *Demo tools* > *Turn by hand*: drag with one finger, flick, and check the page does not scroll while the finger is on the dial. *Use the sensor* brings the sensor back.

iPhone only (Safari):

10. The **permission prompt** appears on the tap on *Start compass*. Answer *Don't Allow* once (the status should say you turn by hand, and dragging should work), then reload and allow.
11. The readout shows `webkitCompassHeading` and `accuracy`. Note the usual accuracy outdoors and indoors. Above ±30° for a second the orange **figure-of-eight hint** should appear; do the figure of eight and it should go.
12. In step 3, watch whether iOS's own heading jumps or flips when the phone passes upright. The app uses that value as iOS gives it; if it flips, tell the team and hold the phone below upright for the demo.
13. Two fingers turning on the dial in *Turn by hand* mode should rotate it and must not zoom the page.

Android only (Chrome):

14. The readout should name the event `deviceorientationabsolute`. Lay the phone still on a table: Chrome stops sending events when nothing moves, which is normal; the dial must simply stay put.
15. Android browsers report no accuracy, so the figure-of-eight hint never appears by itself there. If the heading is off against the reference, do the figure of eight anyway and compare again.
16. On the lock-on in step 7 the phone should give one short vibration.

## What is real and what is not

| Part | State on 21 Nov |
|---|---|
| Sign-up, nearby people, bearing and distance, invite, accept, decline, LinkedIn link | Works. Checked in a real browser with two simulated phones 120 m apart, and by `npm test` |
| Email sign-in through Logto | Written and checked in a browser against a **local stand-in** for Logto (`npm run mock-signin`). **Not yet run against the real Logto**: that needs the App ID |
| Compass heading from the phone sensor | Written and run in a browser, **not yet run on a phone**. On 21 Nov in headless Chromium 156: Chrome's own virtual orientation sensor (real `deviceorientationabsolute` events, only the hardware pretend) gave the expected heading, to the two decimal places the readout prints, for 24 attitudes: flat, tilted, upright and in both landscapes, including five where the old `360 - alpha` was 20° to 180° out (upright with the wrist twisted; a landscape camera hold leaning past vertical). Those 24 were run with the blend at 50° to 75° of lift; after it moved to 65° to 80° the same virtual sensor was run again for 52 attitudes, portrait and both landscapes: outside the blend the heading was the expected one to within 0.1° (Chrome rounds the angles it sends to 0.1°), a 20° roll of the wrist moved it by 0.00° up to 65° of lift, and the flip came between 21.0° and 21.1° past vertical. Events built in the page covered the iPhone shape (`webkitCompassHeading`, accuracy, the permission answer), missing readings and the fallbacks. What only a phone can show is listed under *What to check on a phone* |
| Dial physics, lock-on and the picture reveal | Works in Chromium at phone and laptop size, light and dark, and with reduced motion. Measured in the page at 60 frames a second: the dial overshoots a quarter turn by 9.5% and is inside 2% after 0.47 s; a 3 s stall moves it one frame's worth, not three seconds' worth. Safari and Firefox were not run |
| Profile pictures | The dial shows `picture` when a person carries one (a URL, or `null`). **The server on this branch does not send it yet**, so today everyone appears as large initials. Checked with pictures added to the server's answers on their way to the page: a good one, `null`, slow, missing (404) and not-an-image |
| Snowflake as the database | **Works on the team's account** (checked 21 Nov, about 13:00): `npm run snowflake:check` passes, and sign-up, position, nearby, invite and accept were run through the live server on the Snowflake store. Snowflake's bearing matches our own maths (Bush House → Big Ben: 199.87° both). Without `.env` the app falls back to an in-memory store |
| Sending the LinkedIn connection request for the user | **Not possible, by LinkedIn's rules.** See below |

### Sign-in (Logto)

Sign-in uses the team's existing self-hosted Logto at `auth.dustpowered.studio`, the same one the Cila client uses. Logto emails the one-time code from the existing `dustpowered.studio` sender, so there is no email setup in this app.

To switch it on:

1. In the Logto console create an application of type **Single Page App**.
2. Add the redirect URI `<app address>/callback` and the post sign-out redirect URI `<app address>`. For laptop testing the app address is `http://localhost:3000`. Every address the app is opened from must be added, including the HTTPS one for phones.
3. Put the App ID in `.env` as `LOGTO_APP_ID` (it is not a secret) and restart.

How it works: the browser goes to Logto and comes back to `/callback` with a one-time code (`public/auth.js`, OpenID Connect with PKCE, no SDK). It swaps the code for an ID token and posts that to `/api/session`. The server checks the token's signature against Logto's published keys (`lib/logto.mjs`) and issues the app's own session token. A first-time user has no profile yet and stays off every compass until they fill it in.

Things to know:

- Accounts are shared with Cila: someone who signs in here becomes a user in Cila's Logto, and the sign-in page carries Cila's branding.
- Sign-in depends on that Logto server being up.
- `DEMO=1` keeps a "Try the demo without an account" button next to email sign-in. Set `DEMO=0` to require email for everyone.
- To try the flow with no Logto access: `npm run mock-signin` in one terminal, then `LOGTO_ENDPOINT=http://localhost:3299 LOGTO_APP_ID=mock-app npm start`. The stand-in accepts any email and sends nothing. It is for local testing only.

### LinkedIn

LinkedIn does not let ordinary third-party apps send connection requests or read someone's profile: its invitation API is limited to approved partners, and "Sign in with LinkedIn" only returns name, email and photo. (From prior knowledge; not re-checked against LinkedIn's docs today.)

So the request and the accept/decline happen **inside our app**, and the last step hands over to LinkedIn: the button opens the person's profile, and on a phone that opens the LinkedIn app, where they tap Connect. Users paste their own profile link at sign-up; nothing checks that the link is really theirs.

### Location limits

- Phone GPS is good to about 5–10 m outdoors and often 20–50 m indoors. Two people in the same room cannot be told apart by direction. The server reports how unsure each bearing is, and the dial draws a wide red wedge and says "direction uncertain" instead of pretending.
- For the film or a live demo, stand outdoors at least 50 m apart, or use demo people and *Turn by hand*.
- Indoor phone compasses can be off by a lot (see `../findings/compass-frontend-design/RESULT.md`). *Turn by hand* is the fallback.

### Heading limits

- **What "heading" means here.** Where you point the phone: the top edge while it lies flat or is tilted like a remote control, the back of the phone while it is held upright like a camera, and a blend between 65° and 80° of lift. Up to 65° a sideways roll of the wrist does not move the heading; above that it starts to, because the back of the phone turns with the wrist. With the screen turned, the edge that is up on the screen counts.
- **One blind spot.** Lean an upright phone back about 21° past vertical and the answer flips by 180°. Some flip is unavoidable; it was put where nobody holds a phone.
- **iPhone.** The app takes iOS's own `webkitCompassHeading` and does no tilt maths of its own there. How that value behaves when the phone is upright has not been seen. A reading whose accuracy is negative is ignored (iOS's way of saying it has none yet).
- **Android.** No accuracy is reported, so poor calibration cannot be detected. Chrome sends nothing while the phone is still, so a silent sensor is not treated as a broken one.
- **Magnetic north.** The phone gives magnetic north and the bearings to people are true. In London the gap is about 1° (from prior knowledge, not re-checked), far below everything else here.
- **No compass.** A laptop, a refused permission or an in-app browser means turning by hand. The app never invents a heading.

### Privacy choices already in the code

- Another person's coordinates never leave the server. Clients get a bearing and a distance only.
- Only the latest position is stored, and it stops counting after 45 seconds. *Go invisible*, signing out or closing the page removes it at once.
- Someone who was declined cannot invite the same person again.
- The app keeps a random session token on the device and the server stores only its hash. There are no passwords. Your email address is never shown to other users.

## Snowflake

The Snowflake store keeps users, positions and invitations in three tables and lets **Snowflake compute the compass**: `ST_DWITHIN` finds who is in range, `ST_DISTANCE` the distance and `ST_AZIMUTH` the bearing. The research in `../findings/snowflake-real-projects/` found no hackathon project doing bearings in Snowflake. The *Demo tools* panel shows the exact SQL, row count and latency of the last query, for the judges.

To switch it on:

1. Run [`snowflake/setup.sql`](snowflake/setup.sql) in Snowsight as ACCOUNTADMIN (role, XS warehouse, three tables, key-pair service user).
2. `cp .env.example .env` and fill in the `SNOWFLAKE_*` values. Keep the private key outside the repo.
3. `npm run snowflake:check`. It logs in as the app role and compares Snowflake's bearing and distance with our own maths for Bush House → Big Ben.
4. `npm start`. The first line printed says `store: snowflake`.

Each compass tick is four to six statements: the session lookup, the position MERGE, the nearby query and the invitations query side by side, then one or two profile lookups once you have invitations. Measured on 21 Nov: about 1.2 s per tick with the warehouse awake (the nearby query itself about 0.3 s), against a 3 s polling interval. The first call after the warehouse has slept takes longer. If it feels slow on the day, demo on the in-memory store: stop the server and run `SNOWFLAKE_ACCOUNT= npm start` (the empty value wins over `.env`; the first line then says `store: memory`). Everyone signs up again, because that store starts empty. Show the Snowflake query separately.

The app role cannot delete users, so the two check accounts from that run ("Check Run A" and "Check Run B") and one invitation between them remain in the tables. They have no position, so they never appear on a compass.

## Files

| Path | What it is |
|---|---|
| `server.mjs` | Local server: static files plus the API |
| `lib/api.mjs` | All API routes as one `(Request) => Response` function |
| `lib/logto.mjs`, `public/auth.js` | Email sign-in: server-side ID token check, browser-side OpenID Connect flow |
| `dev/mock-oidc.mjs` | Local stand-in for Logto, for tests and offline tries |
| `lib/geo.mjs`, `lib/match.mjs` | Bearing and distance maths; the tag-overlap match score |
| `lib/store-memory.mjs` | Default store |
| `lib/snowflake.mjs`, `lib/store-snowflake.mjs` | Snowflake SQL API client (no driver) and store |
| `snowflake/setup.sql`, `snowflake/check.mjs` | Account setup and the one-command check |
| `public/compass.js` | **The dial.** Restyle or replace this file; keep `createCompass`, `setPeople` and `render` and nothing else needs to change. The needle and the lock ring are drawn here |
| `public/heading.js` | Which way the user faces: the permission prompt, the tilt-compensated heading from the sensor, iOS accuracy, and turning by hand with momentum |
| `public/physics.js` | The spring that makes the dial and the needle move like a needle in fluid. No DOM: it runs in Node too |
| `public/lockon.js` | When the compass has "found" someone: capture angle, dwell, wider release angle, tap and dismiss. No DOM |
| `public/reveal.js` | The picture that replaces the dial: preloading, initials when there is no picture, the way back |
| `public/tuning.js` | **Every number that decides the feel**, each with a line saying what it does. Change one and reload |
| `public/app.js`, `index.html` | Screens, location, polling, the card and the inbox |
| `public/style.css` | The look: Apple-style liquid glass, Apple system colours (light and dark), fade transitions for every view, sheet and button state |
| `public/motion.js` | Presentation only: adds the in-between animation stages (busy shimmer while a request runs, rows sliding and fading in the People lists, card cross-fade). Deleting it leaves the app working |
| `test/*.test.mjs` | Tests |

## Next

1. Create the Logto application, set `LOGTO_APP_ID` and sign in once with a real email to confirm the code arrives.
1. Try it on one iPhone and one Android phone over HTTPS, outdoors, following *What to check on a phone*. Record what the heading does.
3. Drop in the designed dial from the front-end session.
4. Pick the real name.
