# Snowflake hackathon projects, read from source: set B (geospatial focus)

Inspection date: 2026-11-21. Worker: research subagent, read-only. The code was cloned shallow into a scratch folder and never run.
Labels: **verified-in-source** (the file was read; `path:line` given), **verified-in-spec** (README or Devpost only), **inferred**, **unverified** (with the next check).
Licences: "none" means GitHub reports no licence, so the code is **for reference only**. Do not copy it.

> **Written before the live check (2026-11-21).** On the team's account the database is `OVERTURE_MAPS_PLACES` (one underscore), AI functions work with no card, and bearings need `MOD(DEGREES(ST_AZIMUTH(a, b)) + 360, 360)`. The script that was actually run is `app/snowflake/setup.sql` (unencrypted key, `-nocrypt`), not the draft in [`roles-and-setup.md` §6](roles-and-setup.md). Current facts: [`live-account-check.md`](live-account-check.md).

## Headline findings

1. **None of the 15 projects calls `ST_AZIMUTH`.** A GitHub code search for `ST_AZIMUTH` returns only PostGIS, H2GIS, Sedona and GoogleSQL docs. There are no Snowflake hackathon hits. A compass app built on `ST_AZIMUTH` would still be new among the projects checked.
2. **No Snowflake-prize winner in this set ran a spatial query in Snowflake.** The geo work happened elsewhere:
   - Python haversine plus Nominatim (Drivn).
   - PostGIS on TigerData (Invasive Species Lookout).
   - OpenRouteService (NavigAble).
   The projects that did run spatial SQL in Snowflake did not win a Snowflake prize: Smoke or Fire (ST_DWITHIN, H3), Hazard Hunters (H3, ST_ASGEOJSON) and ThreeOneOne (GEOGRAPHY, ST_POINT).
3. **Snowflake prizes went to Cortex use (LLM, Agent or Search) behind a normal web backend.** Data-warehouse depth also counted (AgentCity, Silicon Shoppers). Being geo did not matter.
4. **Overture `PLACE` schema warning.** An official Snowflake-Labs repo says that as of 2026-10-23 the `CATEGORIES` column is gone and the `list[0].element` nesting no longer exists, so older quickstarts break. See §C.
5. **Trial-account failures found in source:**
   - The Cortex REST chat endpoint returned **403** on a trial account, while `SNOWFLAKE.CORTEX.COMPLETE` through SQL worked (ISL).
   - A programmatic access token (PAT) needs a network policy, or an authentication policy with `NETWORK_POLICY_EVALUATION = ENFORCED_NOT_REQUIRED` (ISL, Rescue Drone).
   - Streamlit in Snowflake's container runtime needs an external access integration, which trial accounts cannot create (Smoke or Fire).
   - `CREATE SCHEMA` failed with insufficient privileges for a non-admin role (AgentCity).

---

## A. Projects named in the brief

### A1. Sim4Food: Hack Atlantic (Sep 2026), won **Best Use of Snowflake**
Repo `TonyDeDev/Sim4Food` @ `9a1d4014fe730fd16934f3285b5c50f624c312bd` (2026-09-29). Licence: none (reference only).
- **What Snowflake does:** only an optional AI chat assistant and forecast summary. The forecasts themselves come from XGBoost and Monte Carlo in FastAPI on Postgres (Neon). verified-in-source: `backend/app/insights.py:1`, ":20 The forecast itself never depends on the LLM".
- **How it connects:** raw `httpx` POST to the Cortex REST chat API, which uses the OpenAI request shape. `backend/app/cortex.py:3`: `POST https://<account>.snowflakecomputing.com/api/v2/cortex/v1/chat/completions`.
- **Auth:** PAT. `cortex.py:72-73` sends `Authorization: Bearer …` and `X-Snowflake-Authorization-Token-Type: PROGRAMMATIC_ACCESS_TOKEN`. The default model is `claude-sonnet-4-5` (`backend/app/config.py:25`).
- **Roles:** no SQL in the repo. The error explainer encodes the setup they needed (verified-in-source, `cortex.py:34-45`):
  - 401: the PAT expired, or no network policy allows the server's IP.
  - 403: "Grant it SNOWFLAKE.CORTEX_USER".
  - 400 on a model: `ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION'`.
- The setup doc `docs/snowflake-cortex.md`, referenced at `cortex.py:5`, **is not in the repo** (verified: no `docs/` folder).
- **Guardrails:** per-user rate limiting so "one account cannot run up the Snowflake bill" (`backend/app/guardrails.py:7-8`).
- **Depth:** thin. It is one REST call with server-built context and no tables in Snowflake. It still won.

### A2. Car of the Future, renamed "Drivn": HackTX 2026, won **[MLH] Best Use of Snowflake API** and the Toyota challenge
Repo `buildingBuild/HackTX-Project` @ `d3719b8a3a7dacd19abf7ad07d05277fcd68f215` (2026-10-25). Licence: none.
- **What Snowflake does:** a Cortex Agent analyses high-severity car faults against an insurance policy and returns structured JSON with safety, coverage and cost.
- **How it connects:** REST `agents/{agent}:run`. `agent-backend/helper.py:71`: `f"{base_url}/api/v2/databases/{database}/schemas/{schema}/agents/{agent}:run"`.
  - Headers (`helper.py:73-77`): Bearer PAT, `X-Snowflake-Authorization-Token-Type: PROGRAMMATIC_ACCESS_TOKEN`, `X-Snowflake-Role`.
  - The client timeout is 310 s (`:69`).
  - The JSON is pulled out of the reply's text block, including fenced code (`:96-118`).
- Names from `.env.example:4-7`: database `VEHICLE_ASSISTANT`, schema `AGENTS`, agent `VEHICLE_DIAGNOSTIC_AGENT`, role `VEHICLE_AGENT_ROLE`.
- **The agent was built in the Snowsight UI.** There is no `CREATE AGENT` or `GRANT` SQL in the repo (verified by grep). The whole policy and customer context goes into the prompt (`helper.py:62-67`). There is no Cortex Search tool.
- **Location (geo):** not in Snowflake. `agent-backend/service_locations.py`:
  - Nominatim geocodes the city (`:35`).
  - A Nominatim POI search for "Toyota" runs inside a ±25 km viewbox (`:46-65`).
  - A **Python haversine** ranks the results (`:12-27`).
- **Latency:** the Devpost page says "Agent latency. Serious cases can take a while". They loaded the 3D model in parallel to hide it (verified-in-spec).

### A3. Invasive Species Lookout (ISL): Hack Knight Fall 2026, won **[MLH] Best Use of Snowflake API**
Devpost slug `invasive-species-lookout-isl`. The slug in the brief returns 404. Repo `musfiratpx/invasive-species-lookout` @ `474bf50e23f39499eefb8c9e0b1258372ca33775` (2026-10-12). Licence: none.
- **What Snowflake does:** RAG over species fact sheets. Cortex Search finds the passages and Cortex COMPLETE rewrites them.
- **Geo is in TigerData/PostGIS, not Snowflake:**
  - `backend/scripts/load_tiger.py:46`: `UPDATE sightings SET geom = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)`.
  - `:74`: `ST_DWithin(p.geom, s.geom, 0.005)`.
- **Setup** (`backend/snowflake/setup.sql:12-36`):
  ```sql
  CREATE TABLE IF NOT EXISTS KNOWLEDGE_CHUNKS (CHUNK_ID STRING, TEXT STRING, SCIENTIFIC_NAME STRING, SECTION STRING, SOURCES STRING, FILE STRING, TOUCH_SAFE STRING);
  CREATE OR REPLACE CORTEX SEARCH SERVICE KNOWLEDGE_SEARCH ON TEXT ATTRIBUTES SCIENTIFIC_NAME, SECTION
    WAREHOUSE = COMPUTE_WH TARGET_LAG = '1 hour' AS (SELECT CHUNK_ID, TEXT, ... FROM KNOWLEDGE_CHUNKS);
  ```
- **Search** goes through REST `…/cortex-search-services/{svc}:query` with a body of `{query, columns, limit, filter:{"@eq":{"SECTION":…}}}` (`backend/app/rag/retriever.py:69-87`).
- **COMPLETE** goes through the SQL connector, with the PAT passed as the password (`backend/app/snowflake_api.py:34-41`). The call is `select snowflake.cortex.complete(%s, parse_json(%s), parse_json(%s))` (`backend/app/rag/generator.py:86`).
- **Trial failure:** verified-in-source at `snowflake_api.py:4-5` and `generator.py:61-62`:
  > "On our trial account the REST chat endpoint returns 403, but COMPLETE through SQL works."

  Sim4Food's explainer maps a 403 to a missing `SNOWFLAKE.CORTEX_USER` grant. Either way, plan a SQL-COMPLETE fallback (inferred).
- **PAT note** (`setup.sql:8-10`): "Snowflake requires your user to be covered by a network policy."
- **Roles:** the default role and `COMPUTE_WH` are used. No CREATE ROLE.

### A4. Agent City: SBUHacks 2026, won **[MLH] Best Use of Snowflake API**
Repo `TheAndyPi/AgentCity` @ `6f587a07860ff190e1418f79b9cab5019bfbf992` (2026-10-25). Licence: none.
- **What Snowflake does:** a warehouse read model of simulation snapshots (VARIANT payloads), large analytic SQL, and Cortex `AI_COMPLETE` with structured output to pick which "fact IDs" explain a comparison. The 3D city is three.js, and Snowflake has no geo role here.
- **How it connects:** raw SQL REST API with **key-pair JWT** signed on the server.
  - `backend/app/snowflake/transport.py:41-63` builds an RS256 JWT with `iss = ACCOUNT.USER.SHA256:<fp>` and `exp = 5 min`.
  - `:103` POSTs to `…/api/v2/statements` with `X-Snowflake-Authorization-Token-Type: KEYPAIR_JWT` (`:108`).
  - Only fixed SQL files are allowed: `:91` "Unapproved SQL shape".
  - `requestId` plus `retry=true` make writes idempotent (`:115-121`).
- **SQL:**
  - `sql/explain.sql:1-6`: `SELECT AI_COMPLETE(model => ?, prompt => ?, model_parameters => {'temperature': 0, 'max_tokens': 256}, response_format => TYPE OBJECT(fact_ids ARRAY(VARCHAR)), show_details => FALSE)`.
  - `sql/ingest.sql`: MERGE with `PARSE_JSON(?)`.
  - `sql/obs_trends.sql` is a 140-line CTE using `QUALIFY ROW_NUMBER()`, `LEAD`, `OBJECT_CONSTRUCT_KEEP_NULL` and `ARRAY_AGG`.
  - The default model is `llama3.1-8b` (`backend/.env.example:56`).
- **Roles** (verified-in-source, `docs/release/snowflake-handoff.md:66-68`): grant the service role USAGE on the database, schema and warehouse, INSERT and SELECT on the table, "and appropriate Cortex/model access".
- **Failure** (`snowflake-handoff.md:202-207`): the first live smoke test got "HTTP **422**, classified as insufficient privileges, while creating a unique `AGENTCITY_SMOKE_<uuid>` schema". The workaround was an `--existing-schema` mode (`:186-188`).
- **Latency:** a 30 s deadline, up to 20 polls 0.2 s apart, no Cortex retry, and at most 20 model calls (`:129-133`).
- **Depth:** deep and heavily engineered. Most of the code is likely AI-generated (Devpost mentions 18k words of prompts).

### A5. ReplicaVire: PalmettoHacks 2026, won **[MLH] Best Use of Snowflake API**
The Devpost page has no repo link. Found via `gh search repos "replica vire"`: `jackandrin/replica-vire` @ `587e4c53c1f6cd92a0f43f673b9223e1afd26d7e` (2026-10-12). Its description says "MLH Best Use of the Snowflake API winner". Licence: none.
- **What Snowflake does:** batch Cortex LLM sentiment and embeddings over news, plus a copy of the trading tables for analysis. The primary store is TigerData.
- **How it connects:** Python connector with **password** auth (`hackathon-trader/src/llm_backends.py:49-52`). Tables are copied with `write_pandas` (`src/sync_snowflake.py:5,20-23`).
- **SQL pattern worth reusing** (batch inference in one statement, `llm_backends.py:83`):
  - Prompts are loaded into a temp table, then `SELECT id, SNOWFLAKE.CORTEX.COMPLETE(%s, [{'role': 'user', 'content': txt}], {opts}) FROM sa_prompts ORDER BY id`.
  - `opts` includes `response_format: {type: json, schema}`. If the model or account rejects that, the code falls back to plain output (`:89-92`).
  - Embeddings use `SNOWFLAKE.CORTEX.EMBED_TEXT_768(%s, txt)` (`:106`).
  - Models: `llama3.1-8b` and `snowflake-arctic-embed-m-v1.5` (`config.yaml:24,26`).
- **Setup** (`sql/snowflake_schema.sql:2-4`): `CREATE WAREHOUSE IF NOT EXISTS HACK_WH WITH WAREHOUSE_SIZE='XSMALL' AUTO_SUSPEND=60 AUTO_RESUME=TRUE INITIALLY_SUSPENDED=TRUE`. The script comment says it "needs a role that can create warehouse/database".
- **Plan notes** (verified-in-source, `PLAN.md:63,91,126,143`):
  - "Snowflake trial account (can wait until hour 6)".
  - "Timebox to hour 10."
  - Fallback: "you can still say it is in the stack".
  - "Snowflake time sink."

### A6. Silicon Shoppers: LA Hacks AI 2026, won **[MLH] Best Use of Snowflake API**
Repo `AnselZeng/silicon-shoppers` @ `395c509fc51f289d04769fc1bdaeb2d90606daa7` (2026-10-18). Licence: none.
- **What Snowflake does:** the system of record for events, layouts, catalogue, model runs and personas. The model refresh loop reads and writes it, and the Next.js routes read layouts and write events. The LLM is DeepSeek or Gemini, not Cortex.
- **How it connects:**
  - Next.js server routes use the **Node `snowflake-sdk`** with `authenticator: "SNOWFLAKE_JWT"` and a private key from an env var (`frontend/lib/server/snowflake.ts:25-35`). This needs `serverExternalPackages: ["snowflake-sdk"]` (`:2`).
  - The backend uses the Python connector with key-pair, PAT or password auth (`backend/server/sf.py:4-9, 219-238`).
  - A DuckDB local fallback mirrors the same tables (`sf.py:1, 117-122`).
- **Role pattern, the cleanest one found** (verified-in-source, `backend/server/__main__.py:172-184`, generated SQL):
  ```sql
  -- Run in Snowsight as ACCOUNTADMIN (or SECURITYADMIN + SYSADMIN)
  CREATE ROLE IF NOT EXISTS ATELIER_APP_ROLE;
  GRANT USAGE ON WAREHOUSE <wh> TO ROLE ATELIER_APP_ROLE;
  GRANT USAGE ON DATABASE <db> TO ROLE ATELIER_APP_ROLE;
  GRANT USAGE ON SCHEMA <db>.<schema> TO ROLE ATELIER_APP_ROLE;
  GRANT INSERT, SELECT ON TABLE <db>.<schema>.EVENTS TO ROLE ATELIER_APP_ROLE;
  GRANT SELECT ON TABLE ... USER_LAYOUTS / TRENDING / CATALOG / MODEL_RUNS ...;
  CREATE USER IF NOT EXISTS ATELIER_APP TYPE = SERVICE DEFAULT_ROLE = ATELIER_APP_ROLE
    DEFAULT_WAREHOUSE = <wh> RSA_PUBLIC_KEY = '<pub>';
  GRANT ROLE ATELIER_APP_ROLE TO USER ATELIER_APP;
  ```
  The developer laptop uses `SNOWFLAKE_ROLE=ACCOUNTADMIN` (`sf.py:9`).
- **Cost** (verified-in-source, `README.md:154`): "XSMALL (1 credit per hour while running) and suspends after 60 seconds idle. With the loop and the store both active it runs most of the time, so about 24 credits per day of demo."

---

## B. Additional geo or map Snowflake projects (from a Devpost search)

### B1. Smoke or Fire? / Fumée ou feu ?: Hack Atlantic 2026. Won Organizers Choice and Dual Use 2nd. **Not** a Snowflake prize.
Repo `SoufianeAmr/smoke-or-fire` @ `ae5927fd197e59fda7622ce5f80f69db5afe0935` (2026-10-05). Licence: none (reference only).

**This is the richest Snowflake geo SQL found.** Snowflake is an **offline** validation "data room": "the app never calls it at runtime" (`README.md:91`).
- **Loading:** a stage, then `COPY INTO` (`analytics/sql/02_raw.sql:9`, `03_copy.sql:8-29`).
- **Points:** `ST_MAKEPOINT(lon, lat) AS geog` (`analytics/sql/04_tables.sql:123`).
- **A SQL UDF** (`04_tables.sql:8-16`):
  ```sql
  CREATE OR REPLACE FUNCTION HAVERSINE_KM(LAT1 FLOAT, LON1 FLOAT, LAT2 FLOAT, LON2 FLOAT) RETURNS FLOAT AS
  $$ 2 * 6371.0 * ASIN(SQRT(SQUARE(SIN((RADIANS(LAT2) - RADIANS(LAT1)) / 2))
     + COS(RADIANS(LAT1)) * COS(RADIANS(LAT2)) * SQUARE(SIN(RADIANS(LON2 - LON1) / 2)))) $$;
  ```
  Snowflake also has a built-in `HAVERSINE(lat1, lon1, lat2, lon2)`, so the UDF only pins R = 6371.0 to match their engine (inferred).
- **Spatial join with a radius in metres, then nearest-first** (`analytics/sql/05_views.sql:52-67`):
  ```sql
  SELECT c.list_index, f.list_index, HAVERSINE_KM(c.lat, c.lon, f.lat, f.lon) AS distance_km
  FROM cwfis c JOIN firms f ON ST_DWITHIN(c.geog, f.geog, 100)   -- metres
  ...
  QUALIFY ROW_NUMBER() OVER (PARTITION BY cwfis_index ORDER BY distance_km, firms_index) = 1
  ```
- **Within-radius filter of a fixed point** (`05_views.sql:269-282`):
  ```sql
  WITH fire AS (SELECT ST_MAKEPOINT(<lon>, <lat>) AS point FROM ENGINE_REFERENCE)
  SELECT ... FROM DETECTIONS d CROSS JOIN fire f
  WHERE ... AND ST_DWITHIN(d.geog, f.point, 15000)
  ```
- **H3 binning for a hex map** (`05_views.sql:208, 236-238`):
  - `H3_LATLNG_TO_CELL_STRING(lat, lon, 7)`
  - `ST_Y(H3_CELL_TO_POINT(h3_cell))` and `ST_X(...)`
  - `TO_JSON(ST_ASGEOJSON(H3_CELL_TO_BOUNDARY(h3_cell)))`
- **Streamlit in Snowflake:**
  - `analytics/streamlit/streamlit_app.py:13,41-45` uses `get_active_session()` inside Snowflake and falls back to a Snowpark `Session` locally.
  - The map is pydeck `H3HexagonLayer` with a CARTO basemap (`:34, 265, 361`).
  - Deploy: `PUT` to a stage, then `CREATE OR REPLACE STREAMLIT … FROM '@stage' MAIN_FILE=…`. The older `ROOT_LOCATION` form is the fallback (`analytics/scripts/deploy_streamlit.py:35-57`).
- **Trial failure** (verified-in-source, `analytics/README.md:78-80`): the container runtime "installs from PyPI, which needs an external access integration, and trial accounts cannot create one." They use `RUNTIME_NAME = 'SYSTEM$WAREHOUSE_RUNTIME'` with Anaconda packages (`deploy_streamlit.py:21-26`).
- **Auth:** Python connector with key pair from `SNOWFLAKE_PRIVATE_KEY_B64` (`analytics/scripts/snow.py:3-4, 34-63`). The role is "a role that can create a warehouse and a database" (`analytics/README.md:52`).
- **Warehouse:** XSMALL, `AUTO_SUSPEND = 60`, `INITIALLY_SUSPENDED = TRUE` (`analytics/sql/01_setup.sql:4-11`).

### B2. Hazard Hunters: ShellHacks 2026, not a winner
Repo `RayhanM17/hazard-hunters` @ `e70741604d3f955608a479f7fd6b1dd1aa572857` (2026-09-26). Licence: none.
- **What Snowflake does:** the full backend for a dashcam pothole game: users, submissions, a stage of images, a multimodal Cortex classifier, an H3 exploration map and leaderboards.
- **How it connects:** Node `snowflake-sdk` from Next.js API routes. It uses `SNOWFLAKE_JWT` with a key file, or a password (`lib/snowflake.ts:16-31`).
- **Multimodal Cortex inside a stored procedure** (`snowflake/06_procedures.sql:15-27`):
  ```sql
  UPDATE SUBMISSIONS SET HAZARD_TYPE = UPPER(TRIM(AI_COMPLETE('gemini-3.1-pro',
      PROMPT('Analyze this image {0}. Reply with EXACTLY ONE WORD ...',
             TO_FILE('@DASHROUTE_DB.MVP_SCHEMA.dashcam_media', FILE_NAME)))))
  ```
  The stage has `ENCRYPTION = (TYPE='SNOWFLAKE_SSE')` and `DIRECTORY = (ENABLE = TRUE)` (`snowflake/03_stage.sql:4-8`).
- **Geo reads** (`app/api/map/heatmap/route.ts:11-14`): `SELECT HEX_ID, ST_ASGEOJSON(HEX_BOUNDARY) AS HEX_GEOJSON, ST_ASGEOJSON(HEX_CENTER) … FROM HAZARD_HEATMAP`. The result goes straight to Leaflet GeoJSON.
- **The H3 view SQL is not in the repo.** `docs/handoff.md:72` says the backend was "upgraded independently (Snowflake side)" with `H3_CELL_RES8`, `H3_CELL_RES6`, five views, a `SUBMISSIONS_STREAM` and a one-minute `PROCESS_SUBMISSIONS_TASK`. That part is only verified-in-spec.
- **Roles:** `USE ROLE ACCOUNTADMIN` for everything (`snowflake/00_warehouse_role.sql:1-3`). `05_external_access.sql:2-3` says AI_COMPLETE needs "no external network rules".

### B3. ThreeOneOne: ConHacks 2026, not a winner. Devpost tags it "geospatial" and "cortex-ai".
Repo `Jisara/ThreeOneOne-ConHacks2026` @ `5b5257fe829e0c204208b769ee1bb677ea30f848` (2026-05-11 commit date, as shown). Licence: **MIT** (copyable).
- **What Snowflake does:** a store for scraped hazard reports (VARIANT JSON) and Gemini-verified hazards with a GEOGRAPHY point.
- `app/main.py:52-59, 133-139`:
  ```sql
  CREATE TABLE IF NOT EXISTS VERIFIED_HAZARDS (..., LAT FLOAT, LON FLOAT, GEOG_POINT GEOGRAPHY, ..., RAW_JSON VARIANT);
  INSERT INTO VERIFIED_HAZARDS (...) SELECT %s, %s, %s, %s, ST_POINT(%s, %s), ..., PARSE_JSON(%s)
  ```
  The comment at `:2` notes that `PARSE_JSON` in `VALUES` raises an error, so INSERT…SELECT is used instead. This is a real Snowflake gotcha.
- **The README claims "ST_GEOHASH" and "Cortex AI summarizes" (`README.md:31,53`). The code does neither.** A grep found no `CORTEX`, `GEOHASH` or other `ST_` calls beyond `ST_POINT`. The map query reads plain LAT and LON (`report_api.py:365-390`). The README claim is **contradicted by source**.
- **Auth:** password through the Python connector (`app/main.py:41-46`). The warehouse is `HACKATHON_WH`.

### B4. Rescue Drone Swarm: StormHacks 2026, not a winner
Repo `PutridThunder/Rescue_Drone_Swarm` @ `4cc9cc80de673d78c6bcbf533dd7498ded2a4403` (2026-10-05). Licence: none.
- **What Snowflake does:** stores mission and game results (VARIANT timeline) from a browser simulation. No spatial SQL.
- **The Vercel-ready PAT pattern is the one most relevant to us.** verified-in-source, `snowflake/setup.sql:53-70`:
  ```sql
  CREATE ROLE IF NOT EXISTS RESCUE_APP;
  GRANT USAGE ON WAREHOUSE RESCUE_WH TO ROLE RESCUE_APP;  -- + DATABASE, SCHEMA
  GRANT SELECT, INSERT ON TABLE RESCUE_DRONES.APP.MISSIONS TO ROLE RESCUE_APP;
  CREATE USER IF NOT EXISTS RESCUE_APP_USER TYPE = SERVICE DEFAULT_ROLE = RESCUE_APP DEFAULT_WAREHOUSE = RESCUE_WH;
  GRANT ROLE RESCUE_APP TO USER RESCUE_APP_USER;
  -- Vercel has no fixed IP address, so allow access tokens without a network policy.
  CREATE AUTHENTICATION POLICY IF NOT EXISTS RESCUE_DRONES.APP.RESCUE_TOKEN_POLICY
    AUTHENTICATION_METHODS = ('PROGRAMMATIC_ACCESS_TOKEN')
    PAT_POLICY = (NETWORK_POLICY_EVALUATION = ENFORCED_NOT_REQUIRED);
  ALTER USER RESCUE_APP_USER SET AUTHENTICATION POLICY RESCUE_DRONES.APP.RESCUE_TOKEN_POLICY FORCE;
  ```
- **Token creation** (`snowflake/token.sql:13-14`): `ALTER USER RESCUE_APP_USER ADD PROGRAMMATIC ACCESS TOKEN RESCUE_VERCEL ROLE_RESTRICTION = 'RESCUE_APP' DAYS_TO_EXPIRY = 90;`. The file warns that "Run all" only shows the last result, so run the token statement on its own and copy the secret immediately.
- **Client:** fetch to `/api/v2/statements` with the PAT header (`api/snowflake.ts:168,185`). It polls on HTTP 202 while the warehouse wakes up, up to 20 tries 1 s apart (`:193-196`).

### B5. NavigAble: IKU Womxn in STEM, won **[MLH] Best Use of Snowflake API**. London accessible navigation.
Repo `Prarthana-sudeesh/IKU-Hackathon` @ `ae6437deff205f6e12d07ce2725b34c745b70494` (2026-10-18). Licence: none.
- **What Snowflake does:** only the store for a Selenium scrape of university-building accessibility flags. `complete_scrape_unis.py:70-76` runs `CREATE WAREHOUSE … AUTO_SUSPEND = 60` with the comment "to protect trial credits". `:237` uses `write_pandas`. Auth is a password.
- **The routing is not in Snowflake:** OpenRouteService `…/v2/directions/wheelchair` (`get_directions.py:22`). No code reads the Snowflake table back (inferred from grep: only the two scrape scripts mention Snowflake).
- **The thinnest winner found.** The Devpost text says "Creating snowflake python integration for the first time".

### B6. Brief notes (source read for the Snowflake parts only)
- **Unlisted** (HackTX 2026, not a winner; `aditya-khambekar/hacktx` @ `9a2ea3fcda0e9f70f5b6b050881fc4a029a43273`; licence none). The map is MapLibre, and Snowflake is a research cache.
  - Role SQL (`scripts/setup-snowflake.sql:4-14`): `USE ROLE ACCOUNTADMIN; CREATE ROLE UNLISTED_APP`, grants on `COMPUTE_WH`, the database and the schema, `GRANT CREATE TABLE ON SCHEMA`, and `GRANT SELECT, INSERT, UPDATE ON FUTURE TABLES IN SCHEMA`. The role is granted to a named human user.
  - The file notes: "Token creation and any required network-policy change are separate actions."
- **Klane** (HackNC 2026, 2nd overall, not the Snowflake prize; `am7t/klane` @ `5d11fe654c6b51e4a8b07ee051564629f40e9870`; licence none). `server/sql/snowflake-setup.sql:3-38` creates `KLANE_APP` with table-level grants. It grants the role to `CURRENT_USER()` via `EXECUTE IMMEDIATE`. Its comments read "Generate your PAT with role restriction KLANE_APP" and "Apply a user-level network policy allowing your API server's public egress IP". No geo SQL.
- **Temple Twin** (OwlHacks 2026, won the Vultr prize only; `ritwiksi/TempleTwin` @ `86ca912abadce03af92364510f51b00978b9547c`; licence **MIT**). The campus map is CesiumJS and the data is TimescaleDB. Snowflake is only `SELECT SNOWFLAKE.CORTEX.COMPLETE(%s, %s)` through the password connector with `llama3.1-8b` (`backend/app/services/snowflake_service.py:24, 98-114`).
- **Day Out** (OxHack 2026, Best Handmade; it uses OSM, Geofabrik and TravelTime) and **6-minutes** (OxHack 2026; it uses shapely, pyproj and deck.gl). Both GitHub repos return 404: `charlienabarro/Oxhack` and `bcn07/six-minutes`, and neither appears in the users' public repo lists. **unverified:** how they used Snowflake. Next check: ask the authors, or look again later in case the repos are made public.

---

## C. Overture Maps `PLACE`: table and column names (official reference, not a hackathon project)

Source: `Snowflake-Labs/sfguide-create-a-route-optimisation-and-vehicle-route-plan-simulator` @ `07006fdcaf3e59fc1a427ff0a5274248e86aad6a`, file `.cortex/skills/routing-agent/references/overture-schema.md`. Licence: NOASSERTION, so treat it as reference.
- **Listings** (`:13-23`): database `OVERTURE_MAPS__PLACES`, table `CARTO.PLACE`, listing `GZT0Z4CM1E9KR`, about 66M POIs.
  ```sql
  CALL SYSTEM$ACCEPT_LEGAL_TERMS('DATA_EXCHANGE_LISTING', 'GZT0Z4CM1E9KR');
  CREATE DATABASE IF NOT EXISTS OVERTURE_MAPS__PLACES FROM LISTING GZT0Z4CM1E9KR;
  ```
  (Addresses: `OVERTURE_MAPS__ADDRESSES.CARTO.ADDRESS`, listing `GZT0Z4CM1E9NQ`.)
- **Columns** (`:33-42`):

  | Column | Type | How to read it |
  |---|---|---|
  | `ID` | VARCHAR | `ID` |
  | `NAMES` | VARIANT | `NAMES:primary::STRING` |
  | `TAXONOMY` | VARIANT | `TAXONOMY:primary::STRING` (replaces the removed `CATEGORIES`) |
  | `BASIC_CATEGORY` | VARCHAR | Preferred for filtering, e.g. `coffee_shop`, `restaurant`, `pharmacy`, `hospital` |
  | `GEOMETRY` | GEOGRAPHY | Longitude = `ST_X(GEOMETRY)`, latitude = `ST_Y(GEOMETRY)` |
  | `ADDRESSES` | VARIANT | `ADDRESSES[0]:locality::STRING`, plus `:region`, `:postcode`, `:freeform` |
  | `CONFIDENCE` | FLOAT | `CONFIDENCE` |
  | `BBOX` | VARIANT | `BBOX` |
- **Required query discipline** (`:53-63`):
  1. Prefilter with a bbox, `ST_X(geom) BETWEEN ? AND ? AND ST_Y(geom) BETWEEN ? AND ?`, so partitions are pruned.
  2. Refine with `ST_WITHIN` or a distance test.
  3. Add a hard `LIMIT`.
- **Schema drift warning** (`:92-100`): the vendor's `OVERTUREMAPS_PLACES_SEMANTIC_VIEW` "no longer matches its own table (checked live, October 23, 2026)". Its category dimensions read the removed `CATEGORIES`, and address/phone dimensions read a `list[0].element` nesting "the arrays no longer have".
- **Older examples now likely broken** (inferred from the above):
  - `Snowflake-Labs/sfguide-using-snowflake-cortex-and-streamlit-with-geospatial-data/sis002.py` @ `46e5bc86` (Apache-2.0), lines 93-96: `col('CATEGORIES')['primary']`, `['alternate']['list'][0]['element']`.
  - `Snowflake-Labs/snowflake-demo-streamlit` "H3 Filtering of Local Attributes/README.md" @ `0329a2b3` (Apache-2.0), line 25: `"ADDRESSES"['list'][0]['element']['country']`.
  - The working idioms in those examples are still valid: `ST_WITHIN(places.GEOMETRY, boundary)`, `ST_X` and `ST_Y`, and `H3_POINT_TO_CELL_STRING(point, 5)` with a pydeck `H3HexagonLayer` (sis002.py:103-105, 127, 188-195).
  - The same README notes that you cannot add search optimisation to a shared table: copy it with `CREATE TABLE … AS SELECT` first (`:17-25`).
- **unverified:** whether a trial account in our region can mount listing `GZT0Z4CM1E9KR` today, and the live column list. Next check: in Snowsight, open Marketplace "Overture Maps – Places" and run `DESCRIBE TABLE OVERTURE_MAPS__PLACES.CARTO.PLACE;`.

**Compass query shape (inferred, assembled from the verified idioms above; not seen in any project):**
```sql
SELECT p.NAMES:primary::STRING AS name, p.BASIC_CATEGORY,
       ST_DISTANCE(p.GEOMETRY, ST_MAKEPOINT(:lon, :lat)) AS metres,
       DEGREES(ST_AZIMUTH(ST_MAKEPOINT(:lon, :lat), p.GEOMETRY)) AS bearing_deg
FROM OVERTURE_MAPS__PLACES.CARTO.PLACE p
WHERE ST_X(p.GEOMETRY) BETWEEN :lon - 0.05 AND :lon + 0.05
  AND ST_Y(p.GEOMETRY) BETWEEN :lat - 0.03 AND :lat + 0.03
  AND ST_DWITHIN(p.GEOMETRY, ST_MAKEPOINT(:lon, :lat), 3000)
  AND p.BASIC_CATEGORY = :category
ORDER BY metres LIMIT 20;
```
`ST_AZIMUTH` returns radians, hence the `DEGREES(...)` wrapper (verified-in-spec from Snowflake docs in earlier research; re-check on the live account). `ST_MAKEPOINT` takes longitude first, as `04_tables.sql:123` and `main.py:137` show in source.

---

## D. Cross-project patterns

| Pattern | Seen in | Use for us |
|---|---|---|
| Server → SQL REST `/api/v2/statements` with a PAT and role in the body, polling on 202 | Rescue Drone (Vercel), Klane, Unlisted | The simplest option from a serverless backend with no driver |
| Server → SQL REST with a key-pair JWT | AgentCity | More setup work |
| Node `snowflake-sdk` with `SNOWFLAKE_JWT` | Silicon Shoppers, Hazard Hunters | Works in Next.js server routes (mark the package external) |
| Python connector with password auth | ReplicaVire, ThreeOneOne, NavigAble, Temple Twin | Fails if MFA is enforced. Silicon Shoppers' comment says password works "only if your account still allows password sign-in" (`sf.py:8`) |
| Cortex REST chat / Agent `:run` with a PAT | Sim4Food, Drivn | The ISL trial got a 403 on REST chat, so keep a SQL `COMPLETE` fallback |
| Least-privilege app role + `TYPE = SERVICE` user | Silicon Shoppers, Rescue Drone, Klane, Unlisted | The setup script outline |
| Everything as ACCOUNTADMIN | Hazard Hunters, most laptops (`SNOWFLAKE_ROLE=ACCOUNTADMIN`) | Acceptable for an 8-hour event, but judges notice the least-privilege version |
| XSMALL warehouse with `AUTO_SUSPEND = 60` | Every project with setup SQL | Copy this |

**How deep the Snowflake prize winners went:** from thin (NavigAble's scraped table, Sim4Food's single REST call) to deep (AgentCity, Silicon Shoppers). Depth was not required to win. Every winner used Snowflake for something visible in the demo: an AI answer, or a warehouse table shown on screen.

---

## Search scope

- **Devpost pages** (fetched with curl; WebFetch got a 403): sim4food, car-of-the-future, agent-city, replicavire, silicon-shoppers, invasive-species-lookout (404), invasive-species-lookout-isl, smoke-or-fire-fumee-ou-feu, temple-twin, threeoneone-nrfyic, day-out-o3hmas, 6-minutes, search-and-rescue-drone-swarm, hazard-hunters, unlisted-cni6t3, klane, tamu-energize (no repo link), navigable-j1qstk.
- **Devpost software search JSON** for these queries: invasive species lookout; snowflake + geospatial / map (2 pages) / location / navigation / overture (0 results) / h3 / nearby / compass / openstreetmap / streamlit map. Leads not opened: Map of Diagnoses in Healthcare_DW, A Vehicle Story, FoodFindr, SquadUp, Care Compass, BlindSpot (Postgres H3, not Snowflake).
- **GitHub code search:** `ST_AZIMUTH` (no Snowflake projects), `OVERTURE_MAPS__PLACES` (only Snowflake-Labs tutorials, a dekart doc and one dbt demo), `ST_DWITHIN TO_GEOGRAPHY snowflake` (0), `ST_MAKEPOINT snowflake hackathon` (0), `H3_LATLNG_TO_CELL` (mostly PostGIS and h3-pg). The query `gh search repos snowflake hackathon geospatial` was not run separately; the Devpost search covered that need.
- **Repos cloned** (depth 1): the 15 listed above with their SHAs, plus three files fetched by API from the Snowflake-Labs references.
- **Not found:** `charlienabarro/Oxhack`, `bcn07/six-minutes` (404, private or deleted). Nothing was run, no accounts were created, and no secret values were copied.
