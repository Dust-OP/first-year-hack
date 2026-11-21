# Career Compass (demo v1)

Working title. A phone web app for **Track 2: Retro Remix**: the compass no longer points north, it points at the person nearby you should be working with.

Built 21 Nov 2026. No dependencies: Node 20+ only.

## The flow

1. **Sign in with email** (a one-time code sent by Logto), then fill in your profile: name, what you do, your LinkedIn profile, what you offer and what you are looking for. Without Logto configured, a quick sign-up with no email check takes its place.
2. **Start compass.** The phone asks for location and motion access.
3. The dial shows everyone within 500 m who has the app open. The **red needle** points at your best match (tap anyone else to follow them instead).
4. **Turn until the needle points up.** When you face someone (within 15°), their card pops up: who they are, why they match, their LinkedIn link.
5. **Send invitation.** They get it under *People*, read your profile, and **accept or decline**.
6. Once accepted, both sides get **Connect on LinkedIn**, which opens the other person's real LinkedIn profile.

## Run it

```sh
cd new-project/app
npm start          # http://localhost:3000
npm test           # 8 tests: bearings, LinkedIn URL check, invite/accept/decline, demo bots, email sign-in
```

On a laptop there is no compass sensor, so the app switches to **drag the dial to turn** (or the left/right arrow keys). Open *Demo tools* and tap **Add demo people** to place five bots around you; one of them invites you, and any bot you invite accepts after a few seconds. That shows the whole flow on one device.

### On real phones

Browsers only give location and compass access to **HTTPS** pages, so `http://192.168.x.x:3000` will not work on a phone. Put the laptop behind an HTTPS tunnel and open the tunnel URL on both phones, for example:

```sh
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

(Not tried on this machine yet.) On iPhone use Safari itself, not a browser inside another app: in-app browsers can refuse motion access.

## What is real and what is not

| Part | State on 21 Nov |
|---|---|
| Sign-up, nearby people, bearing and distance, invite, accept, decline, LinkedIn link | Works. Checked in a real browser with two simulated phones 120 m apart, and by `npm test` |
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
- `DEMO=1` keeps a "Try the demo without an account" button next to email sign-in. Set `DEMO=0` to require email for everyone.
- To try the flow with no Logto access: `npm run mock-signin` in one terminal, then `LOGTO_ENDPOINT=http://localhost:3299 LOGTO_APP_ID=mock-app npm start`. The stand-in accepts any email and sends nothing. It is for local testing only.

### LinkedIn

LinkedIn does not let ordinary third-party apps send connection requests or read someone's profile: its invitation API is limited to approved partners, and "Sign in with LinkedIn" only returns name, email and photo. (From prior knowledge; not re-checked against LinkedIn's docs today.)

So the request and the accept/decline happen **inside our app**, and the last step hands over to LinkedIn: the button opens the person's profile, and on a phone that opens the LinkedIn app, where they tap Connect. Users paste their own profile link at sign-up; nothing checks that the link is really theirs.

### Location limits

- Phone GPS is good to about 5–10 m outdoors and often 20–50 m indoors. Two people in the same room cannot be told apart by direction. The server reports how unsure each bearing is, and the dial draws a wide red wedge and says "direction uncertain" instead of pretending.
- For the film or a live demo, stand outdoors at least 50 m apart, or use demo people and *Turn by hand*.
- Indoor phone compasses can be off by a lot (see `../findings/compass-frontend-design/RESULT.md`). *Turn by hand* is the fallback.

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
| `public/compass.js` | **The dial.** Restyle or replace this file; keep `createCompass`, `setPeople` and `render` and nothing else needs to change |
| `public/heading.js` | Phone heading: iOS permission, Android absolute orientation, manual fallback |
| `public/app.js`, `index.html` | Screens, location, polling, the card and the inbox |
| `public/style.css` | The look: Apple-style liquid glass, Apple system colours (light and dark), fade transitions for every view, sheet and button state |
| `public/motion.js` | Presentation only: adds the in-between animation stages (busy shimmer while a request runs, rows sliding and fading in the People lists, card cross-fade). Deleting it leaves the app working |
| `test/*.test.mjs` | Tests |

## Next

1. Create the Logto application, set `LOGTO_APP_ID` and sign in once with a real email to confirm the code arrives.
1. Try it on one iPhone and one Android phone over HTTPS, outdoors. Record what the heading does.
3. Drop in the designed dial from the front-end session.
4. Pick the real name.
