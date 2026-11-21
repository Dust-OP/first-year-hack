# Live check on the team's Snowflake trial account

Checked: 2026-11-21, about 12:40–13:10 GMT. Label for everything below: **verified-live**, unless marked otherwise.

- **How:** queries were run with Snowflake CLI 3.34.0 and key-pair auth, as ACCOUNTADMIN on the default `COMPUTE_WH` (X-Small).
- **Withheld:** the account identifier, user name and e-mail are kept out of this repo on purpose. Ask the account owner for them.
- **Changes made to the account:**
  - A public key was added to the owner's own user, so the CLI can log in without a password.
  - The free **Overture Maps – Places** listing was installed. The owner accepted the CC BY 4.0 terms in Snowsight.
  - Later the same day, `app/snowflake/setup.sql` was run, plus `GRANT IMPORTED PRIVILEGES ON DATABASE OVERTURE_MAPS_PLACES TO ROLE COMPASS_APP_ROLE`. See RESULT.md.

## Account facts

| Item | Value |
|---|---|
| Account type | Self-service trial, $400 credit, 120-day term (119 days left on 2026-11-21). This matches the student trial, not the 30-day standard trial. |
| Region | `AZURE_UKSOUTH` (London) |
| Warehouses | `COMPUTE_WH` and `SNOWFLAKE_LEARNING_WH` (both X-Small, auto-suspend 300 s); `SYSTEM$STREAMLIT_NOTEBOOK_WH` (auto-suspend 60 s) |
| Databases before our changes | `SNOWFLAKE`, `SNOWFLAKE_SAMPLE_DATA` (TPC-H), `SNOWFLAKE_LEARNING_DB`, and the owner's personal `USER$<name>` database |

## Roles that actually exist

`SHOW ROLES` returned these roles:

| Role | Notes |
|---|---|
| ACCOUNTADMIN | The owner's default role. Granted to the one user. |
| ORGADMIN | Also granted to the owner, because a trial is its own organisation. |
| SECURITYADMIN, USERADMIN, SYSADMIN | System roles. The hierarchy matches the docs: SYSADMIN is granted to ACCOUNTADMIN. |
| PUBLIC | Every user has it. |
| SNOWFLAKE_LEARNING_ROLE | Created automatically by Snowflake "during account provisioning". It is not ours. |

**PUBLIC already holds `SNOWFLAKE.CORTEX_USER`** and the account privilege **`USE AI FUNCTIONS`**. Its other grants include `ML_USER`, `COPILOT_USER`, the `SNOWFLAKE_SAMPLE_DATA` database and the system compute pools. So any role, including a future `COMPASS_APP_ROLE`, can call AI functions without an extra grant. To restrict AI to one role, an ACCOUNTADMIN would have to revoke these grants from PUBLIC.

## Cortex AI works on this trial

- `SHOW PARAMETERS LIKE 'CORTEX%' IN ACCOUNT` returns `CORTEX_ENABLED_CROSS_REGION = ANY_REGION`, set at account level. We did not set it ourselves; the account had it on our first check. `CORTEX_MODELS_ALLOWLIST = ALL`.
- `SELECT AI_COMPLETE('claude-sonnet-4-6', 'Reply with just the word ok')` returned `"ok"`. So did `llama3.1-8b`.
- **This contradicts the earlier docs-based finding** that AI is off on trials until a card is added (see `../retro-compass-prior-art/rules-snowflake.md` §2). On this account it works with no card added. The likely reason is that this is the 120-day student trial rather than a standard trial (inferred).

## ST_AZIMUTH: verified, with one important detail

`ST_AZIMUTH` on GEOGRAPHY points returns angles **from −180° to +180°** after `DEGREES()`, **not 0–360°**. The docs describe a 0–2π range, but the live account does not behave that way.

| From Bush House (−0.1174, 51.5131) to | Raw `DEGREES(ST_AZIMUTH)` | Normalised | Distance | Map sense-check |
|---|---|---|---|---|
| British Museum (−0.1269, 51.5194) | −43.2 | 316.8° | 961 m | north-west ✔ |
| Trafalgar Square (−0.1281, 51.5080) | −127.4 | 232.6° | 933 m | south-west ✔ |

**Always normalise:** use `MOD(DEGREES(ST_AZIMUTH(a, b)) + 360, 360)`. `app/lib/store-snowflake.mjs:36` already does this (verified-in-source).

## Overture Maps – Places on this account

- **Listing:** `GZT0Z4CM1E9KR`. Free, not monetized, "Unlimited Access", licence CC BY 4.0, refreshed monthly.
- **Region:** available in `AZURE_UKSOUTH`.
- **Install:** `CREATE DATABASE ... FROM LISTING` failed with `092779 ... terms ... have not been accepted`, so the terms must first be accepted with **Get** in Snowsight.
- **Database name:** after Get, the database is named **`OVERTURE_MAPS_PLACES`**, with one underscore. It is not `OVERTURE_MAPS__PLACES` as in older guides. The table is `CARTO.PLACE`.
- **Live columns:** `ID, GEOMETRY (GEOGRAPHY), CONFIDENCE, WEBSITES, EMAILS, SOCIALS, PHONES, BRAND, ADDRESSES, NAMES, SOURCES, OPERATING_STATUS, BASIC_CATEGORY, TAXONOMY, VERSION, BBOX`.
  - There is **no `CATEGORIES` column**, which confirms the schema change noted in `winners-b-geo.md`.
  - The name is in `NAMES:primary::STRING`.
- **Density:** a 0.06° × 0.04° box around Bush House (about 4 × 4.5 km) holds tens of thousands of places. The top `BASIC_CATEGORY` values are `professional_service` (15,096), `corporate_or_business_office` (11,160), `financial_service` (7,029), `restaurant` (4,877) and `bar` (1,915). 5,278 places have no category.

### The compass query, run live

```sql
SET (lon, lat) = (-0.1174, 51.5131);   -- Bush House
SELECT p.NAMES:primary::STRING AS name, p.BASIC_CATEGORY AS cat,
       ROUND(ST_DISTANCE(p.GEOMETRY, ST_MAKEPOINT($lon, $lat))) AS metres,
       ROUND(MOD(DEGREES(ST_AZIMUTH(ST_MAKEPOINT($lon, $lat), p.GEOMETRY)) + 360, 360), 1) AS bearing_deg
FROM OVERTURE_MAPS_PLACES.CARTO.PLACE p
WHERE ST_X(p.GEOMETRY) BETWEEN $lon - 0.03 AND $lon + 0.03      -- cheap bounding-box prefilter
  AND ST_Y(p.GEOMETRY) BETWEEN $lat - 0.02 AND $lat + 0.02
  AND ST_DWITHIN(p.GEOMETRY, ST_MAKEPOINT($lon, $lat), 1500)
  AND p.BASIC_CATEGORY IN ('museum','art_gallery','theatre','historic_site','landmark_and_historical_building')
  AND p.CONFIDENCE > 0.6
ORDER BY metres LIMIT 12;
```

Sample results:

| Name | Category | Metres | Bearing |
|---|---|---|---|
| Kingsway Gallery | art_gallery | 74 | 325.2° |
| Aldwych tramway station | historic_site | 83 | 326.6° |
| The Courtauld | museum | 175 | 183.6° |
| Somerset House | historic_site | 228 | 175.6° |
| National Gallery* | museum | 889 | 237.9° |
| The British Museum* | museum | 964 | 316.7° |

\*From a name lookup in the same area. The landmark bearings agree with a map: Somerset House and the Courtauld are just south across the Strand, the National Gallery is south-west and the British Museum is north-west.

**Data-quality warnings:**
- There are duplicates: "Roman Bath" appears twice.
- One record is mislabelled: "WC postcode area" is tagged `historic_site`.
- One record is in the wrong place: a second "Somerset House" sits 1,071 m away at 276°.
- `OPERATING_STATUS` was empty on every row sampled.

**What to do about it:** de-duplicate by name, raise the `CONFIDENCE` threshold, and don't promise "open now" from this column.

**Latency:**
- The first run, including the warehouse resuming from suspended plus three queries, took about 21 s end to end.
- Warm runs of the main query took **2.3–3.9 s end to end through the CLI**. That includes CLI start-up and the key-pair login, so the server-side time is lower (not measured separately).

**What this means for the app:** call Snowflake from the backend, not once per heading change, and cache results per area.

## What this changes in RESULT.md

1. AI is available now on this trial, so one `AI_COMPLETE` feature is cheap to add. It still needs a fallback.
2. Use `OVERTURE_MAPS_PLACES` (one underscore) and the `BASIC_CATEGORY`/`TAXONOMY` columns.
3. Keep the `MOD(... + 360, 360)` bearing normalisation.
4. **Done later the same day:** `app/snowflake/setup.sql` was run, `COMPASS_APP_ROLE` got Overture read access, and `app/.env` was created locally (not in Git). `npm run snowflake:check` passed, and the server reports `store: snowflake`. The app does not query Overture places yet.
