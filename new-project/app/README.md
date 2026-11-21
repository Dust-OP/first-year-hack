# Career Compass (demo v1)

Working title. A phone web app for **Track 2: Retro Remix**: the compass no longer points north, it points at the person nearby you should be working with.

Built 21 Nov 2026. No dependencies: Node 20+ only.

## The flow

1. **Sign in with LinkedIn** (your name and photo come from LinkedIn) or **with email** (a one-time code sent by Logto), then fill in your profile: name, what you do, your LinkedIn profile address, an optional photo, what you offer and what you are looking for. With neither sign-in configured, a quick sign-up with no check takes their place.
2. **Start compass.** The phone asks for location and motion access. Without a position you are not on anyone's compass, and the page says why and what to do.
3. The dial shows everyone within 500 m who has the app open. The **red needle** points at your best match (tap anyone else to follow them instead).
4. **Turn until the needle points up.** When you face someone (within 15°), their card pops up: who they are, why they match, their LinkedIn link.
5. **Send invitation.** They get it under *People*, read your profile, and **accept or decline**.
6. Once accepted, both sides get **Connect on LinkedIn**, which opens the other person's real LinkedIn profile.

## Run it

```sh
cd new-project/app
npm start          # http://localhost:3000
npm run phones     # the same server behind an https address, with a QR code, for real phones
npm test           # 20 tests: bearings, invite/accept/decline, demo bots, email sign-in, LinkedIn sign-in and its
                   #           error messages, pictures, the privacy boundary, bad requests to the server,
                   #           Snowflake store without the new tables, QR code
```

On a laptop there is no compass sensor, so the app switches to **drag the dial to turn** (or the left/right arrow keys). Open *Demo tools* and tap **Add demo people** to place five bots around you; one of them invites you, and any bot you invite accepts after a few seconds. That shows the whole flow on one device.

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
| Compass heading from the phone sensor | Written, **not yet run on a phone**. The headless test browser has no sensor, so only the drag-to-turn path was exercised |
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
- Demo mode is on unless `DEMO=0`, and it keeps a "Try the demo without an account" button next to LinkedIn and email sign-in. Set `DEMO=0` to require a real sign-in for everyone.
- To try the flow with no Logto access: `npm run mock-signin` in one terminal, then `LOGTO_ENDPOINT=http://localhost:3299 LOGTO_APP_ID=mock-app npm start`. The stand-in accepts any email and sends nothing. It is for local testing only.

### LinkedIn

What LinkedIn allows was checked against its documentation on 21 Nov 2026: [`../findings/linkedin-integration/RESULT.md`](../findings/linkedin-integration/RESULT.md). In short:

- **Sign In with LinkedIn (OpenID Connect)** is self-service and returns a member id, name, picture link, locale and, optionally, email. It does **not** return the person's profile address or headline, so users still paste their own `linkedin.com/in/...` link, and nothing checks that the link is really theirs.
- **Sending connection requests is not possible for us**: LinkedIn's Invitations API is "restricted to approved partners". So the request and the accept/decline happen **inside our app**, and the last step hands over to LinkedIn: the button opens the person's profile, and on a phone that opens the LinkedIn app, where they tap Connect.
- The app does not scrape linkedin.com and uses no unofficial API.

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

### Privacy choices already in the code

- **Consent on first open.** A dialog (`public/consent.js`) blocks the page until the visitor agrees or declines; declining keeps the app closed, and withdrawing later removes the position. The privacy notice (`public/privacy.html`) is linked from the dialog, the sign-up form and *Demo tools*, and describes what this code stores, including LinkedIn sign-in, pictures and the state of the two extra Snowflake tables. It has had no legal review. When the notice changes in substance, bump `REVISION` in `consent.js` so that everyone is asked again (now 2).
- Another person's coordinates never leave the server. Clients get a bearing and a distance only.
- Only the latest position is stored, and it stops counting after 45 seconds. *Go invisible*, signing out, closing the page or losing your position removes it at once.
- Nobody is placed at a made-up position. Without a position a person is on no compass; the Bush House demo position is used only by someone who taps its button.
- Someone who was declined cannot invite the same person again.
- The app keeps a random session token on the device and the server stores only its hash. There are no passwords. Your email address is never shown to other users.
- **What other people receive about you** is: a random id, your name, what you do, your LinkedIn address, your tags (and how they match theirs), your picture, and your direction and distance. A test pins that list of fields. What LinkedIn told us (its id for you, your email, locale, picture link and the raw answer) stays on the server and is shown only to you.
- A LinkedIn email is kept in the LinkedIn record only, not in the app's user row.
- **Delete my LinkedIn data** (People tab) deletes the LinkedIn record: LinkedIn's id, names, email, picture link, locale, the typed profile address and the raw answer held in it. It does not delete the account, the profile (name included), a picked photo, invitations, or the sign-in id `linkedin|<sub>` in the user row, which is what lets the person sign in again.
- **The picture route asks for no sign-in.** Anyone who has been shown a person's picture address (`/api/avatar?id=<their id>`) can load that person's current picture later, including after they go invisible. It gives a face or initials, never a position or an email.
- A picked photo is stored as it was sent (a 256 px JPEG made in the browser; the original file is not uploaded). The API can replace or remove it (`POST /api/profile` with `photo`), but the page shows the profile form only once, so there is no way in the page yet to change or remove a photo afterwards. There is no delete-account route, and none is planned.
- Text taken from an address is never displayed. A failed sign-in comes back as a short code and the page shows its own sentence for it.

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
| `lib/api.mjs` | All API routes as one `(Request) => Response` function |
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
| `public/compass.js` | **The dial.** Restyle or replace this file; keep `createCompass`, `setPeople` and `render` and nothing else needs to change |
| `public/heading.js` | Phone heading: iOS permission, Android absolute orientation, manual fallback |
| `public/app.js`, `index.html` | Screens, location, polling, the card and the inbox |
| `public/consent.js`, `consent.css`, `privacy.html`, `public/vendor/cookieconsent/` | The first-open consent dialog (CookieConsent 3.3.0, MIT, vendored) and the privacy notice |
| `public/style.css` | The look: Apple-style liquid glass, Apple system colours (light and dark), fade transitions for every view, sheet and button state |
| `public/motion.js` | Presentation only: adds the in-between animation stages (busy shimmer while a request runs, rows sliding and fading in the People lists, card cross-fade). Deleting it leaves the app working |
| `test/*.test.mjs` | Tests |

## Next

1. Create the Logto application, set `LOGTO_APP_ID` and sign in once with a real email to confirm the code arrives.
1. Create the LinkedIn developer app, set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET`, sign in once with a real account, and do the checks listed at the end of `../findings/linkedin-integration/RESULT.md`.
1. Run the [two-phone check](#two-phone-check): `npm run phones`, one iPhone and one Android phone, outdoors. Record what the heading does.
1. Decide when to run the Snowflake migration for the two new tables, then `npm run snowflake:check`.
3. Drop in the designed dial from the front-end session.
4. Pick the real name.
