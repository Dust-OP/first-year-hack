# Career Compass (demo v1)

Working title. A phone web app for **Track 2: Retro Remix**: the compass no longer points north, it points at the person nearby you should be working with.

Built 21 Nov 2026. Node 20+. Locally it runs with no install; the one dependency (the Neon Postgres driver) is loaded only when `DATABASE_URL` is set.

**Live:** https://wayrise.app (Vercel project `career-compass`, team `chatgpt-6e55`). The project's generated `*.vercel.app` addresses redirect there. See [Deploy on Vercel](#deploy-on-vercel).

## The flow

1. **Sign in with LinkedIn** (your name and photo come from LinkedIn) or **with email** (a one-time code sent by Logto), then fill in your profile. After a LinkedIn sign-in the only question is your LinkedIn share link ("Open my LinkedIn" and "Paste link" help you get it). After an email sign-in it is name, what you do, your LinkedIn share link, an optional photo, what you offer and what you are looking for. The link may be the share link with its `?utm_…` tail, the whole text a share sheet copies, `linkedin.com/in/...` or a bare handle; the app keeps only `https://www.linkedin.com/in/<handle>`. The first screen always offers both sign-ins; one this server has not set up (email needs `RESEND_API_KEY` for the emailed code or `LOGTO_APP_ID` for Logto; LinkedIn needs `LINKEDIN_CLIENT_ID`/`LINKEDIN_CLIENT_SECRET`) is shown greyed out with "Not set up on this server yet". In demo mode the same screen also offers a quick sign-up with no check.
2. **Start compass.** The phone asks for location and motion access. Without a position you are not on anyone's compass, and the page says why and what to do.
3. The dial shows everyone within 500 m who has the app open. The **red needle** points at your best match (tap anyone else to follow them instead).
4. **Turn until the needle points up.** The dial moves like a real compass: it follows you with a little inertia, overshoots slightly and settles. Hold your aim on someone (within 15°) for a moment and the compass has found them: a ring closes round the rim, the markings fade into **their profile picture** in the same glass disc, and their card pops up with who they are, why they match and their LinkedIn link. Turn 28° or more away, tap the picture or close the card, and the compass fades back. Tapping someone's dot shows them at once.
5. **Send invitation.** They get it under *People*, read your profile, and **accept or decline**.
6. Once accepted, both sides get **Connect on LinkedIn**, which opens their profile or pre-fills the optional connection worker form in People.

## Run it

```sh
cd new-project/app
npm start          # http://localhost:3000
npm run phones     # the same server behind an https address, with a QR code, for real phones
npm test           # 37 tests: one account per person, bearings, invite/accept/decline, demo bots, email sign-in, LinkedIn sign-in and its
                   #           error messages, pictures, the privacy boundary, bad requests to the server,
                   #           Snowflake store without the new tables, QR code
```

A laptop has no compass sensor that a browser can read, and the app says so instead of pretending. You turn by hand, and the dial still behaves like a physical thing:

- **Drag** it and it stays under the pointer. **Flick** it and it keeps spinning until friction stops it.
- **Scroll** over it with the wheel or two fingers.
- **Left/right arrow keys**: a tap turns 5°, holding the key spins the dial up and letting go lets it coast.
- In Safari, two fingers turning on the trackpad rotate it too (written; Safari was not run).

A device that does have a sensor (tablets, some 2-in-1s) uses it without being asked. *Turn by hand* under *Demo tools* switches between the two on any device.

Open *Demo tools* and tap **Add demo people** to place five bots around you; one of them invites you, and any bot you invite accepts after a few seconds. That shows the whole flow on one device. *Demo tools* also shows the heading input live: which event arrived, its alpha, beta and gamma, and the heading made from them.

### On real phones

Browsers only give location and compass access to **HTTPS** pages, so `http://192.168.x.x:3000` does not work on a phone, and university Wi-Fi usually stops devices from reaching each other anyway. One command puts the laptop behind an https address:

```sh
brew install cloudflared     # once
npm run phones
```

It starts the server and a Cloudflare quick tunnel (no account), waits until the public address answers, and prints the address with a QR code to scan. Ctrl-C stops the server and closes the tunnel. Things to know:

- **The address is new on every run.** Anyone who has it can reach this laptop's copy of the app while the command runs. Demo mode is on unless `DEMO=0`, so they can also sign up without an account and add demo people to this server's store; the command says so when it prints the address.
- Sign-in providers only send people back to addresses they were told about. For each run, add `<address>/api/linkedin/callback` to the LinkedIn app and `<address>/callback` to the Logto app; the command prints both. The quick sign-up needs nothing.
- While `npm run phones` runs, open the printed https address on the laptop too: a LinkedIn sign-in started from `http://localhost:3000` fails the first time with "Sign-in was interrupted".
- The LinkedIn stand-in (`LINKEDIN_MOCK_URL`) only works in a browser on the laptop. Phones still show its button, but it sends them to their own `localhost`; the command warns about this. On phones use "Try the demo without an account".
- On iPhone use Safari itself, not a browser inside another app: in-app browsers can refuse motion access.
- Run on this Mac on 21 Nov over the university network: the address was up and answering about 10 s after the command started, and the whole two-person flow passed through it in a test browser (below). **Not yet opened on a real phone.**
- Do not open the address by hand in the first second after it appears. A lookup made before the name exists is remembered as "no such site": on this Mac that lasted over three minutes. The command waits for you and checks without that kind of lookup.

If a phone is opened over plain http anyway, it is **not** placed anywhere: the page says it needs the https address. The old behaviour put every such phone on one fixed spot (Bush House), so two real people saw each other at 0 m.

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
| Two people finding each other with the browser's real location (not a fixed demo spot) | Works in a test browser: two separate sessions given GPS positions 120 m apart saw each other at 120 m, bearings 90° and 270°; moving one to 150 m north-east gave 45° and 225° about 3 s later. Also run through the https tunnel. **Not yet on two real phones**: see [Two-phone check](#two-phone-check) |
| Presence | A new person shows up about 3 s after tapping Start. They leave about 3 s after *Go invisible*, sign-out, closing or reloading the page, and 46 to 48 s after their phone goes silent (45 s rule plus one 3 s tick). Measured in the test browser |
| Sign in with LinkedIn | Written and checked in a browser against a **local stand-in** for LinkedIn (`npm run mock-linkedin`). **Not yet run against the real LinkedIn**: that needs a LinkedIn developer app |
| Recording the LinkedIn profile | Works on the in-memory store (tests). The Snowflake table and statements are **written, not run** |
| Pictures (`picture` on every person) | Works: picked photo, LinkedIn picture through the stand-in, or generated initials. A real LinkedIn picture has not been loaded |
| `npm run phones` (https tunnel and QR code) | Run on this Mac on 21 Nov; the QR symbols were decoded back by macOS's QR reader. **Not yet scanned with a phone** |
| Email sign-in through Logto | Written and checked in a browser against a **local stand-in** for Logto (`npm run mock-signin`). **Not yet run against the real Logto**: that needs the App ID |
| Compass heading from the phone sensor | Written and run in a browser, **not yet run on a phone**. On 21 Nov in headless Chromium 156: Chrome's own virtual orientation sensor (real `deviceorientationabsolute` events, only the hardware pretend) gave the expected heading, to the two decimal places the readout prints, for 24 attitudes: flat, tilted, upright and in both landscapes, including five where the old `360 - alpha` was 20° to 180° out (upright with the wrist twisted; a landscape camera hold leaning past vertical). Those 24 were run with the blend at 50° to 75° of lift; after it moved to 65° to 80° the same virtual sensor was run again for 52 attitudes, portrait and both landscapes: outside the blend the heading was the expected one to within 0.1° (Chrome rounds the angles it sends to 0.1°), a 20° roll of the wrist moved it by 0.00° up to 65° of lift, and the flip came between 21.0° and 21.1° past vertical. Events built in the page covered the iPhone shape (`webkitCompassHeading`, accuracy, the permission answer), missing readings and the fallbacks. What only a phone can show is listed under *What to check on a phone* |
| Dial physics, lock-on and the picture reveal | Works in Chromium at phone and laptop size, light and dark, and with reduced motion. Measured in the page at 60 frames a second: the dial overshoots a quarter turn by 9.5% and is inside 2% after 0.47 s; a 3 s stall moves it one frame's worth, not three seconds' worth. Safari and Firefox were not run |
| Profile pictures | The dial shows `picture` when a person carries one (a URL, or `null`). **The server on this branch does not send it yet**, so today everyone appears as large initials. Checked with pictures added to the server's answers on their way to the page: a good one, `null`, slow, missing (404) and not-an-image |
| Vercel deployment | Deployed 21 Nov (production, London region `lhr1`). Health, static files, `/callback` and the API routes checked on the live URL. **Runs on the in-memory store until the Neon database is connected**; see below |
| Snowflake as the database | **Works on the team's account** (checked 21 Nov, about 13:00): `npm run snowflake:check` passes, and sign-up, position, nearby, invite and accept were run through the live server on the Snowflake store. Snowflake's bearing matches our own maths (Bush House → Big Ben: 199.87° both). Without `.env` the app falls back to an in-memory store |
| Sending the LinkedIn connection request for the user | Optional per-participant browser worker. Setup and verification limits below. |

### Sign-in with an emailed code (wayrise.app)

With `RESEND_API_KEY` in `.env`, the welcome screen asks for an email address and emails a 6-digit code from `hello@wayrise.app` through Resend. It behaves like Logto's email code (10 minutes, a minute between codes), but runs in this app, with no Cila accounts or branding. It is on at https://wayrise.app (Vercel) as well as from a laptop. It replaces the Logto button when both are set up.

- **Domain:** `wayrise.app` (Name.com) runs its DNS on Cloudflare. Resend sends from it (region eu-west-1, DKIM, SPF and DMARC records in Cloudflare). Mail sent to `hello@wayrise.app` is forwarded to a team member's Gmail by Cloudflare Email Routing. Both directions were tested on 21 Nov.
- **How it works:** `POST /api/email-code/start {email}` emails the code and sets an HttpOnly cookie `cc_ec` holding a random key for this browser. `POST /api/email-code/verify {code}` checks the code against that browser's record and issues the app's session like the other sign-ins. Users are stored with `sub = 'email|<address>'` and are not merged with Logto or LinkedIn accounts that share the address.
- **Limits:** 5 wrong codes per code. Codes to one address: one a minute, five an hour. One client (IP address): ten an hour. All addresses together: 90 a day, under Resend's free 100 a day. `/start` never looks up accounts, so its answer is the same for known and unknown addresses.
- **Where that state lives:** with `DATABASE_URL` set (Vercel), in Postgres (`lib/email-code-postgres.mjs`: tables `email_codes` and `email_code_sends`, made on first use), shared by every instance; single use and the wrong-guess count are atomic, and the send log keeps only SHA-256 hashes of the address and IP for a day. Without a database, in the server process's memory (`lib/email-code.mjs`), which is exact for one `npm start` and lost on restart. The Vercel entry (`api/index.mjs`) never uses the memory version: without a database it leaves email-code sign-in off. Codes are stored as an HMAC keyed by the browser's cookie key, which is not stored, so reading the tables does not let anyone test codes. `npm run db:check` also runs this state against the database, in a throwaway schema.
- Behind the `cloudflared` tunnel every request reaches the server from this machine, so the client's address comes from the tunnel's `CF-Connecting-IP` header. That header is trusted only on requests from this machine.
- Tests use a fake mailer (`test/email-code.test.mjs`); nothing is sent.

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
- Demo mode is on unless `DEMO=0`, and it keeps a "Try the demo without an account" button next to LinkedIn and email sign-in. Set `DEMO=0` to require a real sign-in for everyone.
- To try the flow with no Logto access: `npm run mock-signin` in one terminal, then `LOGTO_ENDPOINT=http://localhost:3299 LOGTO_APP_ID=mock-app npm start`. The stand-in accepts any email and sends nothing. It is for local testing only.

### LinkedIn

What LinkedIn allows was checked against its documentation on 21 Nov 2026: [`../findings/linkedin-integration/RESULT.md`](../findings/linkedin-integration/RESULT.md). In short:

- **Sign In with LinkedIn (OpenID Connect)** is self-service and returns a member id, name, picture link, locale and, optionally, email. It does **not** return the person's profile address or headline, so users still paste their own `linkedin.com/in/...` link, and nothing checks that the link is really theirs.
- The Invitations API requires partner access. The team reports separate permission for the optional browser workflow below. Sign-in alone grants no browser session.

#### Remote connection worker

On a single persistent worker host use Node 24+, a non-root service account, an encrypted volume, and one worker process per data directory. Install the pinned dependency with `npm ci` and Chromium with `npx playwright-core install chromium` (or set `CONNECTION_CHROME` to a Chromium executable). Set the following through your service's secret manager:

| Setting | Where | Value |
|---|---|---|
| CONNECTION_DATA_DIR | Worker only | Absolute private directory outside the checkout for SQLite sessions and jobs |
| CONNECTION_SESSION_KEY | Worker only | Stable 32 random bytes in base64, generated with `openssl rand -base64 32` |
| CONNECTION_WORKER_TOKEN | Web server and worker | Independent random bearer secret, at least 32 characters |
| CONNECTION_WORKER_URL | Web server and enrollment station | Origin of the worker's HTTPS reverse proxy, or `http://127.0.0.1:3310` on one host |
| CONNECTION_PORT | Worker | Optional loopback port, default 3310 |

Start `node connections-worker.mjs`. Keep the encryption key, tokens, bodies and pairing codes out of logs. The web server forwards authenticated requests to the worker. On separate hosts expose the worker through TLS and restrict ingress to the web backend and enrollment station. Configure a durable app user store so Compass account IDs survive restarts.

1. Sign in to Compass and open **People → Get pairing code**. Quick demo accounts cannot submit jobs.
2. On a private team-hosted display dedicated to that participant, run `node dev/pair-connections.mjs` with the worker URL and a browser installed. Enter the one-time code and sign in to LinkedIn in the fresh browser. Confirm the account before pressing Enter. This station only needs the worker URL. Give each participant exclusive access during enrollment and close their display afterwards. Codes expire after ten minutes. Repeat this step when LinkedIn asks for verification.
3. Under **People**, paste a profile URL and tap **Add Connection**. The accepted match’s **Connect on LinkedIn** button pre-fills the same form. A click submits one job from the participant’s linked session. **Disconnect LinkedIn worker** removes that session, its pairing code and job history.
4. API clients send an authenticated `POST /api/connections` with `{"profileUrl":"https://www.linkedin.com/in/example-user/"}`. A new job returns HTTP 202 with `jobId` and `status`. Poll `GET /api/connections?jobId=…` with the same Compass bearer token. An unpaired account gets `verification_required` immediately. Repeated requests for the same owner and target return the existing job unless it failed before submission or required verification.
5. The worker recognizes English profile controls. It reports `sent` after confirmation, `pending` for an existing invitation, and `already_connected` for a first-degree connection. If it loses confirmation after a click or restarts during delivery, it reports `outcome_unknown`. Review the sent invitations in LinkedIn before taking any further action.

The worker is opt-in and requires separate provisioning from the Vercel app. Real LinkedIn enrollment, current profile layouts and invitation delivery still need a team-authorized live check.

**To switch LinkedIn sign-in on** (not done yet; nobody has run this against the real LinkedIn):

1. At <https://www.linkedin.com/developers/apps> create an app, and on its **Products** tab request **Sign In with LinkedIn using OpenID Connect**.
2. On the **Auth** tab add the redirect URL `<app address>/api/linkedin/callback` for every address the app is opened from: `http://localhost:3000/api/linkedin/callback` for the laptop, and the https address for phones.
3. Put the Client ID and Client Secret in `.env` as `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`, and restart. The first line printed then says `sign-in: LinkedIn`. Without both values the button is not shown and the app is exactly as before.

How it works: LinkedIn's token endpoint needs the client secret, so, unlike the Logto flow, the exchange runs on our server (`lib/linkedin.mjs`). The button goes to `/api/linkedin/start`, which sends the browser to LinkedIn. LinkedIn sends it back to `/api/linkedin/callback` with a one-time code; the server swaps the code for an access token, reads the member from LinkedIn's userinfo endpoint, records it and hands the page a one-time code for its session. The secret and the access token never reach a browser, and the access token is not kept. The server reads userinfo rather than checking the ID token; the reasons are in the findings file.

When a sign-in does not finish, the server sends the browser back with a short code, `/#linkedin_error=cancelled`, `failed`, `interrupted`, `refused` or `no_profile`, and the page shows its own sentence for that code (`public/auth.js`). Anything else after the `=` gets one general sentence, so a hand-written link cannot put its own text on the page. The email sign-in return (`/callback?error=...`) is treated the same way. What LinkedIn actually said goes to the server log.

To try it with no LinkedIn app: `npm run mock-linkedin` in one terminal, then start the app with the three values it prints. The stand-in "signs in" any name you type. It is for local testing only.

**What is recorded** for someone who signs in with LinkedIn, one record per user: LinkedIn's id for them, name, given and family name, email, whether LinkedIn says the email is verified, the picture link, locale, the profile address they typed, LinkedIn's answer as received, and when it was first recorded and last read. It is read again only when that person signs in again, never on a schedule. They can see it and delete it under **People, Your LinkedIn data**. Deleting removes that record only: the account, the profile (name included), a picked photo and the sign-in id `linkedin|<sub>` in the user row stay, and the record is made again at the next LinkedIn sign-in. A later processing job can read it through `store.listLinkedinProfiles()` or the `LINKEDIN_PROFILES` table. LinkedIn's API terms limit what such a job may do with it; see the findings file before writing one.

Things to know: signing out of the app does not sign the browser out of LinkedIn, so on a shared device the next "Sign in with LinkedIn" can go straight through as the previous person. A second device signing in ends the first device's session, as with email sign-in.

### Pictures

Every person the API returns (`nearby` items, `person` in the People lists, and `me`) has `picture`: a URL on our own origin, `/api/avatar?id=<user id>`, that an `<img>` can load. Behind it, in order: the photo the person picked on the profile form (shrunk in the browser to a 256 px JPEG), their LinkedIn picture (fetched by our server and passed on, so the viewer's browser never contacts LinkedIn), or a generated tile with their initials. Demo bots only ever get initials. The picture route asks for no sign-in, because an `<img>` cannot send the app's token; user ids are random.

### Location limits

- Phone GPS is good to about 5–10 m outdoors and often 20–50 m indoors. Two people in the same room cannot be told apart by direction. The server reports how unsure each bearing is, and the dial draws a wide red wedge and says "direction uncertain" instead of pretending.
- For the film or a live demo, stand outdoors at least 50 m apart, or use demo people and *Turn by hand*.
- Indoor phone compasses can be off by a lot (see `../findings/compass-frontend-design/RESULT.md`). *Turn by hand* is the fallback.
- **Nobody is placed at a made-up position.** With no position (plain http, location refused, no fix yet) a person is off every compass and the page says which of the three it is and what to do, with **Try again**. The fixed Bush House position is only a button, *Use a demo position instead*, shown in demo mode (on unless `DEMO=0`); everyone who chooses it stands on the same spot.
- A position less accurate than 100 m is called out in the status line as too rough to point with. On an iPhone this usually means Precise Location is off for the site.
- Updates are polled every 3 s, so a move shows on the other phone 3 to 6 s later.

### Two-phone check

This has not been done. A test browser stands in for the phones' GPS, not for their compass, their permission prompts or their network. With `npm run phones` running and two people outdoors, at least 50 m apart:

1. Scan the QR code on both phones. iPhone: Safari. Android: Chrome. Does the page load?
2. Sign up on both (quick sign-up is enough). Tap **Start compass**. Does each phone ask for location and, on iPhone, motion? Allow both.
3. Read the status line on each: it should say "Position accurate to about N m" with N under 100. Write N down. If it says the position is too rough, turn on Precise Location and tap **Try again**.
4. Within about 5 s each should see "1 person within 500 m". Open the other person's card: is the distance about right? Do the two bearings differ by about 180°?
5. Turn until the needle points up. Is the other person really in front of you? (This also tests the compass heading, which has never run on a phone.)
6. One person walks 30 m sideways. Does the other phone follow within about 6 s?
7. Send an invitation, accept it on the other phone, and tap **Connect on LinkedIn** on both: does it open the right profile, in the LinkedIn app if installed?
8. Lock one phone for a minute, then unlock it. The other should lose that person after about 45 s and get them back within a few seconds of the unlock.
9. On one phone refuse location (or switch it off in settings and reload). Does the notice under the compass explain it, and does **Try again** work after allowing it?
10. Close the tab on one phone. The other should lose that person within about 3 s; if the browser was swiped away instead, within about 45 s.

### Heading limits

- **What "heading" means here.** Where you point the phone: the top edge while it lies flat or is tilted like a remote control, the back of the phone while it is held upright like a camera, and a blend between 65° and 80° of lift. Up to 65° a sideways roll of the wrist does not move the heading; above that it starts to, because the back of the phone turns with the wrist. With the screen turned, the edge that is up on the screen counts.
- **One blind spot.** Lean an upright phone back about 21° past vertical and the answer flips by 180°. Some flip is unavoidable; it was put where nobody holds a phone.
- **iPhone.** The app takes iOS's own `webkitCompassHeading` and does no tilt maths of its own there. How that value behaves when the phone is upright has not been seen. A reading whose accuracy is negative is ignored (iOS's way of saying it has none yet).
- **Android.** No accuracy is reported, so poor calibration cannot be detected. Chrome sends nothing while the phone is still, so a silent sensor is not treated as a broken one.
- **Magnetic north.** The phone gives magnetic north and the bearings to people are true. In London the gap is about 1° (from prior knowledge, not re-checked), far below everything else here.
- **No compass.** A laptop, a refused permission or an in-app browser means turning by hand. The app never invents a heading.

### Privacy choices already in the code

- **Consent on first open.** A dialog (`public/consent.js`) blocks the page until the visitor agrees or declines; declining keeps the app closed, and withdrawing later removes the position. The privacy notice (`public/privacy.html`) is linked from the dialog, the sign-up form and *Demo tools*, and describes what this code stores, including LinkedIn sign-in, pictures and the state of the two extra Snowflake tables. It has had no legal review. When the notice changes in substance, bump `REVISION` in `consent.js` so that everyone is asked again (now 5).
- Another person's coordinates never leave the server. Clients get a bearing and a distance only.
- Only the latest position is stored, and it stops counting after 45 seconds. *Go invisible*, signing out, closing the page or losing your position removes it at once.
- Nobody is placed at a made-up position. Without a position a person is on no compass; the Bush House demo position is used only by someone who taps its button.
- Someone who was declined cannot invite the same person again.
- The app keeps a random session token on the device and the server stores only its hash. There are no passwords. Your email address is never shown to other users.
- **What other people receive about you** is: a random id, your name, what you do, your LinkedIn address, your tags (and how they match theirs), your picture, and your direction and distance. A test pins that list of fields. What LinkedIn told us (its id for you, your email, locale, picture link and the raw answer) stays on the server and is shown only to you.
- A LinkedIn email is kept in the LinkedIn record only, not in the app's user row.
- **One account per person.** Signing in again with the same method finds the same account (by its sign-in id, which Postgres keeps unique; two sign-ins racing for one id get the same account, not an error). A verified email address also joins methods: an emailed code finds an account whose LinkedIn record has that address marked verified by LinkedIn, and a LinkedIn sign-in with a verified address finds the account an emailed code made for it. Such an account then keeps the address the code proved, so deleting the LinkedIn data does not split it later. An unverified address never joins accounts, and demo bots never match. Tests: `test/one-record.test.mjs`.
- **Test accounts are not people.** Quick sign-ups (no sign-in behind them) and demo bots are test accounts. `npm run users` (read-only, needs `DATABASE_URL`) counts people as accounts with a real sign-in and lists the test accounts on a line of their own. On the live site, set `DEMO=0` once a real sign-in is switched on: that removes the quick sign-up and the demo bots, so no new test accounts are made there.
- **Delete my LinkedIn data** (People tab) deletes the LinkedIn record: LinkedIn's id, names, email, picture link, locale, the typed profile address and the raw answer held in it. It does not delete the account, the profile (name included), a picked photo, invitations, or the sign-in id `linkedin|<sub>` in the user row, which is what lets the person sign in again.
- **The picture route asks for no sign-in.** Anyone who has been shown a person's picture address (`/api/avatar?id=<their id>`) can load that person's current picture later, including after they go invisible. It gives a face or initials, never a position or an email.
- A picked photo is stored as it was sent (a 256 px JPEG made in the browser; the original file is not uploaded). The API can replace or remove it (`POST /api/profile` with `photo`), but the page shows the profile form only once, so there is no way in the page yet to change or remove a photo afterwards. There is no delete-account route, and none is planned.
- Text taken from an address is never displayed. A failed sign-in comes back as a short code and the page shows its own sentence for it.

## Deploy on Vercel

The same API runs as one Vercel Function: `api/index.mjs` builds it with `lib/setup.mjs`, exactly as `server.mjs` does locally. `vercel.json` sends every `/api/*` request to that function, serves `public/` as static files, rewrites `/callback` to the page and pins the function to London (`lhr1`). `.vercelignore` keeps `.env`, keys, tests and the Snowflake scripts out of the upload.

**Database.** Serverless functions do not share memory, so the deployed app needs a real database: Neon Postgres from the Vercel Marketplace. The integration sets `DATABASE_URL` on the project; `lib/store-postgres.mjs` then creates its three tables (`users`, `locations`, `requests`) on first use. Bearing and distance are computed in JS after a bounding-box query, so no PostGIS is needed. Store choice everywhere: `DATABASE_URL` → Postgres, else `SNOWFLAKE_ACCOUNT` → Snowflake, else memory.

Logto keeps its own accounts in its own database on the self-hosted server. This database holds the app's side: the profile linked to each Logto user id (`logto_sub`), session token hashes, positions and invitations.

Set up once, from `new-project/app` (a person has to accept Neon's terms):

```sh
vercel link --yes --scope chatgpt-6e55 --project career-compass   # already done on 21 Nov
vercel integration add neon --name career-compass-db --meta region=lhr1
vercel env pull .env.local        # DATABASE_URL for local checks; .env.local is git-ignored
npm install
npm run db:check                  # full flow in a throwaway schema, then drops it
npm run users                     # read-only: people with a real sign-in, and test accounts apart
vercel env add DEMO production    # value 1 keeps the demo button and quick sign-up
vercel deploy --prod
```

To switch on Logto sign-in on the live site, add `https://wayrise.app/callback` (redirect) and `https://wayrise.app` (post sign-out) to the Logto application, then `vercel env add LOGTO_APP_ID production` and deploy again.

**Domain.** `wayrise.app` is attached to the project. Its DNS is on Cloudflare: two `A` records for `@`, `216.198.79.1` and `64.29.17.1`, proxy off (DNS only) so Vercel can issue the certificate. Email records (MX) on the domain belong to the email sign-in and are not Vercel's. `vercel.json` redirects the generated addresses `career-compass-hazel-ten.vercel.app` and `career-compass-chatgpt-6e55.vercel.app` to `https://wayrise.app`, so register sign-in redirect addresses for `wayrise.app` only. Check with `vercel domains verify wayrise.app`.

Deployment URLs (`career-compass-<hash>-…vercel.app`) sit behind Vercel Authentication; `wayrise.app` is public. GitHub is not connected to the project, so a push does not deploy.

## Snowflake

The Snowflake store keeps users, positions and invitations in three tables and lets **Snowflake compute the compass**: `ST_DWITHIN` finds who is in range, `ST_DISTANCE` the distance and `ST_AZIMUTH` the bearing. The research in `../findings/snowflake-real-projects/` found no hackathon project doing bearings in Snowflake. The *Demo tools* panel shows the exact SQL, row count and latency of the last query, for the judges.

To switch it on:

1. Run [`snowflake/setup.sql`](snowflake/setup.sql) in Snowsight as ACCOUNTADMIN (role, XS warehouse, three tables, key-pair service user).
2. `cp .env.example .env` and fill in the `SNOWFLAKE_*` values. Keep the private key outside the repo.
3. `npm run snowflake:check`. It logs in as the app role and compares Snowflake's bearing and distance with our own maths for Bush House → Big Ben.
4. `npm start`. The first line printed says `store: snowflake`.

Each compass tick is four to six statements: the session lookup, the position MERGE, the nearby query and the invitations query side by side, then one or two profile lookups once you have invitations. Measured on 21 Nov: about 1.2 s per tick with the warehouse awake (the nearby query itself about 0.3 s), against a 3 s polling interval. The first call after the warehouse has slept takes longer. If it feels slow on the day, demo on the in-memory store: stop the server and run `SNOWFLAKE_ACCOUNT= npm start` (the empty value wins over `.env`; the first line then says `store: memory`). Everyone signs up again, because that store starts empty. Show the Snowflake query separately.

The app role cannot delete users, so the two check accounts from that run ("Check Run A" and "Check Run B") and one invitation between them remain in the tables. They have no position, so they never appear on a compass.

### Two more tables for LinkedIn records and photos (written, not run)

LinkedIn records and picked photos go in two new tables, `LINKEDIN_PROFILES` and `USER_PHOTOS`. The three tables above are not altered and none of the existing queries changed. **Nothing has been run against the team's account for this**, and the app role cannot create tables, so until an admin runs the migration the tables do not exist there. The app is built to keep working in that state: the first time the store reaches for a missing table it logs one line and from then on skips LinkedIn records and picked photos and serves generated initials. Sign-up, LinkedIn sign-in, sync, invite and accept are not affected (a test runs them against a stand-in for the account as it is today; it checks our code, not Snowflake's SQL).

To migrate, when the owner decides: in Snowsight, run the block marked "Added 21 Nov 2026" in [`snowflake/setup.sql`](snowflake/setup.sql), from its `USE ROLE SYSADMIN` to the end of section 2. Every statement is `CREATE ... IF NOT EXISTS` or a `GRANT`, so running it twice changes nothing. Then run `npm run snowflake:check`: it says whether the two tables exist (their absence is a note, not a failure) and, once they do, writes, reads and deletes one throwaway row in each through the app's own store code. That check is the first real run of these statements; treat a failure there as a bug in the new SQL. Restart the server afterwards.

`LINKEDIN_PROFILES` columns: `USER_ID`, `LINKEDIN_SUB`, `NAME`, `GIVEN_NAME`, `FAMILY_NAME`, `EMAIL`, `EMAIL_VERIFIED`, `PICTURE_URL`, `LOCALE`, `PROFILE_URL`, `RAW_CLAIMS` (VARIANT), `FIRST_SEEN_MS`, `LAST_REFRESHED_MS`. `USER_PHOTOS` columns: `USER_ID`, `PHOTO`, `UPDATED_MS`. A LinkedIn sign-in is marked in `USERS.LOGTO_SUB` as `linkedin|<sub>`.

## Files

| Path | What it is |
|---|---|
| `server.mjs` | Local server: static files plus the API |
| `api/index.mjs`, `vercel.json`, `.vercelignore` | Vercel entry point and config |
| `lib/setup.mjs` | Picks the store and sign-in from environment variables; shared by both entry points |
| `lib/store-postgres.mjs`, `postgres/check.mjs`, `postgres/users.mjs` | Postgres store (Neon on Vercel), its one-command check, and the read-only count of people (test accounts apart) |
| `lib/api.mjs` | All API routes as one `(Request) => Response` function |
| `lib/email-code.mjs`, `lib/email-code-postgres.mjs`, `lib/mailer.mjs`, `public/email-code.js` | Sign-in with an emailed code: codes and limits, sending through Resend, the email and code form |
| `lib/logto.mjs`, `public/auth.js` | Email sign-in: server-side ID token check, browser-side OpenID Connect flow |
| `dev/mock-oidc.mjs` | Local stand-in for Logto, for tests and offline tries |
| `lib/linkedin.mjs` | Sign in with LinkedIn, server side: the redirect to LinkedIn, the code exchange with the client secret, the userinfo call, and what is kept from the answer |
| `dev/mock-linkedin.mjs` | Local stand-in for LinkedIn's sign-in, for tests and tries without a LinkedIn app |
| `lib/avatar.mjs` | Pictures: the `picture` URL, the generated initials tile, the check on a picked photo |
| `dev/phones.mjs`, `dev/qr.mjs` | `npm run phones`: server plus https tunnel; the QR code writer it prints the address with |
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
| `public/consent.js`, `consent.css`, `privacy.html`, `public/vendor/cookieconsent/` | The first-open consent dialog (CookieConsent 3.3.0, MIT, vendored) and the privacy notice |
| `public/style.css` | The look: Apple-style liquid glass, Apple system colours (light and dark), fade transitions for every view, sheet and button state |
| `public/motion.js` | Presentation only: adds the in-between animation stages (busy shimmer while a request runs, rows sliding and fading in the People lists, card cross-fade). Deleting it leaves the app working |
| `test/*.test.mjs` | Tests |

## Next

1. Create the Logto application, set `LOGTO_APP_ID` and sign in once with a real email to confirm the code arrives.
1. Create the LinkedIn developer app, set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`, sign in once with a real account, and do the checks listed at the end of `../findings/linkedin-integration/RESULT.md`.
1. Run the [two-phone check](#two-phone-check): `npm run phones`, one iPhone and one Android phone, outdoors, following *What to check on a phone*. Record what the heading does.
1. Decide when to run the Snowflake migration for the two new tables, then `npm run snowflake:check`.
3. Drop in the designed dial from the front-end session.
4. Pick the real name.
