# Snowflake in real projects: what it does, which roles they used, what broke

Inspected: 2026-11-21. Source and docs were read (no cloned code was executed). A **live check on the team's trial account** followed the same day: [`live-account-check.md`](live-account-check.md).
Adoption state: **partly adopted (2026-11-21)**. In `app/`: the least-privilege role, XS warehouse, key-pair service user, bearing and distance computed in Snowflake, and the panel showing the SQL. Not adopted: Overture Places queries and `AI_COMPLETE`.

## Live-account update (2026-11-21, verified-live)

- **AI works on our trial.** `CORTEX_ENABLED_CROSS_REGION` is already `ANY_REGION`, and `AI_COMPLETE` answered with `claude-sonnet-4-6` and `llama3.1-8b`. PUBLIC already holds `SNOWFLAKE.CORTEX_USER`. This replaces the docs-based "AI is off until a card is added" for this account.
- **`ST_AZIMUTH` returns −180..180°.** Normalise with `MOD(DEGREES(ST_AZIMUTH(a,b)) + 360, 360)`. The app already does (`app/lib/store-snowflake.mjs:36`).
- **Overture is installed** as `OVERTURE_MAPS_PLACES` (one underscore), table `CARTO.PLACE`, with columns `NAMES`, `BASIC_CATEGORY`, `TAXONOMY` and `CONFIDENCE` (no `CATEGORIES`). Terms must be accepted with **Get** in Snowsight; SQL alone fails with error `092779`.
- **The live compass query works.** Bearings from Bush House match a map: British Museum 316.7° at 964 m, National Gallery 237.9°, Somerset House 175.6°. Warm runs take 2–4 s end to end through the CLI, so query from the backend and cache.
- **The app is connected (2026-11-21, later the same day).**
  - `app/snowflake/setup.sql` was run, creating `COMPASS_APP_ROLE`, `COMPASS_WH`, `COMPASS_DB.APP` with 3 tables, and the `COMPASS_SVC` service user (key pair).
  - `COMPASS_APP_ROLE` was also granted `IMPORTED PRIVILEGES` on `OVERTURE_MAPS_PLACES`.
  - `npm run snowflake:check` passed all 6 checks: login, bearing, distance and the 3 tables.
  - The server reports `store: snowflake`.
  - The private key and `app/.env` stay outside Git.
  - The app does not query Overture places yet.
  - Run end to end on the Snowflake store the same day (about 13:00): sign-up, position, nearby, invite and accept. See `app/README.md`.

## Question

How does Snowflake actually work, and what can it do? What did real hackathon projects use it for (from their source, not their Devpost blurbs), and how did they set up Snowflake roles?

## Answer in brief

1. **Snowflake = storage + rented compute + roles.** Data sits in databases. A query runs only while a virtual warehouse is on, and that costs credits per second, with a 60-second minimum each time it starts. Everything is permitted through **roles**: grant a privilege to a role, then grant the role to a user. Details: [`roles-and-setup.md`](roles-and-setup.md) §1–2.
2. **The jobs Snowflake did in 19 real projects:**

   | Job | Examples | How deep |
   |---|---|---|
   | LLM inference via Cortex (`COMPLETE`/`AI_COMPLETE`, OpenAI-compatible endpoint) | We'll Figure Out (3-model jury), Sim4Food, ReplicaVire, Agent City | Usually one visible feature; Sim4Food is one REST call and still won |
   | Search / RAG (Cortex Search, embeddings) | Vigil, Invasive Species Lookout, Hurricane Week (claimed) | Medium |
   | ML and analytics in SQL (ANOMALY_DETECTION, FORECAST, big analytic SQL) | Vigil, Agent City | Deep |
   | Governed data store (custom roles, row access and masking policies, service user) | WayForward (no Cortex at all), Silicon Shoppers | Deep, and it won without AI |
   | Reference data from Marketplace / Snowflake Public Data | Hurricane Week (FEMA/NOAA, cached to JSON) | Thin |
   | Geospatial (`ST_DWITHIN`, H3 hexes, Streamlit map) | Smoke or Fire (not a Snowflake-prize winner, offline only) | Medium |

   Sources: [`winners-a.md`](winners-a.md) (4 winners), [`winners-b-geo.md`](winners-b-geo.md) (15 projects, geospatial focus).
3. **No project used `ST_AZIMUTH`, and no Snowflake-prize winner ran a spatial query in Snowflake.** Winners with a map did the geography elsewhere (PostGIS, Nominatim + haversine). A compass whose bearings come from Snowflake would be new among everything checked. The flip side is that nobody has shown it works, so test it first (verified-in-source for the absence across the repos read; GitHub code search found no Snowflake hits).
4. **Roles in practice:** most teams ran everything as ACCOUNTADMIN. The better projects (Vigil, WayForward, Silicon Shoppers) used ACCOUNTADMIN only for one-time setup. Their app ran as one custom role under SYSADMIN, logged in as a `TYPE = SERVICE` user with a key pair or PAT. WayForward goes further: Snowflake itself refuses data to the wrong role, and judges rewarded that.

## Roles in plain words

| Role | What it is for | Use it for the app? |
|---|---|---|
| ACCOUNTADMIN | Top of the account; above SYSADMIN and SECURITYADMIN | Setup only: mounting the Marketplace listing, Cortex grants, resource monitor |
| SECURITYADMIN | Grants and revokes any privilege; contains USERADMIN | Optional: network or auth policies |
| USERADMIN | Creates users and roles | Create `COMPASS_APP_ROLE` and the service user |
| SYSADMIN | Creates warehouses and databases; custom roles should be granted up to it | Create the warehouse and app database |
| PUBLIC | Every user has it; by default it holds Cortex access | Don't grant data to it |
| GLOBALORGADMIN (replaces ORGADMIN) | Organisation-wide admin | Not needed |
| Database roles, e.g. `SNOWFLAKE.CORTEX_USER` | Privileges packaged inside a database; grant them to an account role | Grant to the app role if AI is used |

Source: [`roles-and-setup.md`](roles-and-setup.md) §2, verified-in-spec against docs.snowflake.com.

## Recommendation for our compass app (inferred)

- **Snowflake's job:** the compass "brain". Snowflake turns (my position, intent) into a bearing and distance to real places, using Overture Places with `ST_DWITHIN` + `ST_DISTANCE` + `DEGREES(ST_AZIMUTH(...))`. The phone dial must keep working without Snowflake (demo mode).
- **Visible to judges:** an "Under the hood" panel showing the exact SQL, row counts and latency (Vigil's idea), plus a clean role setup (WayForward/Silicon Shoppers' idea). Use governance as the fallback "Snowflake story" if AI is unavailable.
- **AI is optional:** add at most one `AI_COMPLETE` call (for example navigator-log narration), with a fallback. Call it through SQL, not the Cortex REST chat endpoint, which returned 403 on trials in two projects. `CORTEX_ENABLED_CROSS_REGION` is already `ANY_REGION` on our account: the two teams that set it got Cortex working, and the two that didn't were blocked. Don't send `temperature` to Claude models.
- **Setup:** the draft [`roles-and-setup.md` §6](roles-and-setup.md) uses:
  - one `COMPASS_APP_ROLE` under SYSADMIN
  - an XS warehouse with `AUTO_SUSPEND = 60`
  - the app's own database
  - `IMPORTED PRIVILEGES` on the Overture listing (`GZT0Z4CM1E9KR`)
  - optionally `CORTEX_USER`
  - a `TYPE = SERVICE` user with key-pair auth (simpler than a PAT on Vercel, which has no fixed IP)

  The draft itself was not run. The app's `app/snowflake/setup.sql`, built from it, was run on 2026-11-21 (see the live-account update above). The draft still says `OVERTURE_MAPS__PLACES`; on our account the name is `OVERTURE_MAPS_PLACES`.
- **Time box:** ReplicaVire's own notes call Snowflake a "time sink". Get one working query from the backend before building on it.

## Gotchas that can block us

| Gotcha | Status |
|---|---|
| AI functions are off on self-service trials until a card is added | **Not true on our account** (verified-live: AI_COMPLETE works on the 120-day student trial); may still apply to 30-day standard trials |
| Only ACCOUNTADMIN (or a role with IMPORT SHARE) can mount the Overture listing; without `GRANT IMPORTED PRIVILEGES` the app role sees nothing | verified-in-spec |
| Overture columns changed: `CATEGORIES` was replaced by `TAXONOMY`/`BASIC_CATEGORY`, and the `list[0].element` nesting is gone (Snowflake-Labs note, 2026-10-23). Older quickstarts break | verified-in-source (vendor repo note) |
| On non-trial accounts, password logins are being phased out and service users can't use passwords. Use a key pair | verified-in-spec |
| A PAT for a service user needs a network policy or an auth policy | verified-in-spec + seen in source |
| The container runtime for Streamlit in Snowflake is blocked on trials; use the warehouse runtime | seen in one project (verified-in-source) |
| A warehouse that never idles can burn about 24 credits a demo day | one project's estimate (inferred) |

## Licence

Of all the project repos read, only Temple Twin and ThreeOneOne have licences. All the others, including every Snowflake-prize winner, are **reference only**. The Snowflake-Labs samples are Apache-2.0 and can be copied with attribution.

## Next checks

1. ~~Check the Overture listing and its columns~~ (done, verified-live).
2. ~~Run the compass query from Bush House and check bearings against a map~~ (done, verified-live; normalise to 0–360).
3. ~~Run `app/snowflake/setup.sql` and grant Overture read access~~ (done; `snowflake:check` passes and the full flow ran on the Snowflake store). Next: add a resource monitor (`app/snowflake/setup.sql` §4) to cap credits.
4. ~~Ask whether AI is enabled~~ (it is on our trial).
5. ~~Read the Node driver's key-pair options~~ (not needed: the app uses the SQL API with a key-pair JWT and no driver; see `app/lib/snowflake.mjs`).

## Files

- [`winners-a.md`](winners-a.md): Vigil, Hurricane Week, WayForward, We'll Figure Out. Source read, with commit SHAs and path:line.
- [`winners-b-geo.md`](winners-b-geo.md): 15 more projects, the geospatial query patterns, the Overture schema and the draft compass query.
- [`live-account-check.md`](live-account-check.md): live results on the team's trial (roles, AI, ST_AZIMUTH range, Overture columns, compass query, latency).
- [`roles-and-setup.md`](roles-and-setup.md): how Snowflake works, roles and auth from the docs, official sample setup scripts, and the draft `setup.sql`.
- [`TASK.md`](TASK.md): task brief.
