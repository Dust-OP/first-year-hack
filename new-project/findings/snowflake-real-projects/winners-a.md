# Past "Best Use of Snowflake API" winners: what the source code actually does (batch A)

Inspection date: 2026-11-21. Method: read-only `gh repo clone` into a scratch directory; code read, never run. No sign-ups or logins.
All four Devpost pages show the badge "Winner [MLH] Best Use of Snowflake API" (verified-in-spec, Devpost HTML).

Labels: **[src]** verified-in-source (path:line given) · **[spec]** verified-in-spec (README/Devpost/docs only) · **[inf]** inferred · **[unv]** unverified (+ next check).

Secrets: a scan for private-key blocks and filled-in password/PAT values found none in any of the four working trees, and no `.env`/`.p8`/`.pem` file in any history **[src]**. All four use empty `.env.example` templates.

License: **none of the four repos has a LICENSE file** and the GitHub API returns `license: null` for all four **[src]**. So all four are **reference-only**. Read them for patterns and rewrite; do not copy code.

---

## 1. Vigil (Cal Hacks 13.0): nursing-home night-shift triage

- Repo: `snr2753423/Vigil_calhacks`, commit `4c3b9cd66593cfd77772743982306aa87ccc5df0` (2026-10-24), 15 commits, solo build.
- Snowflake's job: the whole "deep tier" (ML anomaly detection, forecasting, Cortex LLM, Cortex Search RAG, Cortex Analyst, AI_EXTRACT/AI_TRANSCRIBE/AI_AGG). Tiger Data (Timescale) is the fast live tier. This is the heaviest Snowflake use of the four.

### Architecture and connection
- Two clients, both **key-pair JWT** auth **[src]**:
  - Python connector, `authenticator="SNOWFLAKE_JWT"`, `private_key_file=...`, `role=settings.snowflake_role`: `backend/app/db/snowflake_sql.py:116-124`. Used for `write_pandas` sync, ML training/inference and `PUT` to stages (README:82 **[spec]**).
  - Hand-rolled REST client with httpx that mints its own RS256 JWT: `backend/app/db/snowflake_rest.py:76-87` (claims `iss = ACCOUNT.USER.SHA256:<fingerprint>`), header `X-Snowflake-Authorization-Token-Type: KEYPAIR_JWT` at `:211`.
- REST surfaces used **[src]**:
  - `POST /api/v2/cortex/inference:complete`: `snowflake_rest.py:245`
  - SQL API `POST /api/v2/statements` with bindings, 202 polling and cancel: `:302-336`
  - Cortex Search `.../cortex-search-services/CARE_PLAN_SEARCH:query` with `"filter": {"@eq": {"resident_id": ...}}`: `:375-382`
  - Cortex Analyst `POST /api/v2/cortex/analyst/message` with `semantic_model_file: @VIGIL.CORE.SEMANTIC/vigil.yaml`: `:47`, `:396-397`
- Key registration: `make keygen` prints `ALTER USER IDENTIFIER($vigil_user) SET RSA_PUBLIC_KEY = '...'` to paste into Snowsight: `backend/scripts/gen_snowflake_keypair.py:55` **[src]**.

### Snowflake features with anchors **[src]**
- `CREATE OR REPLACE SNOWFLAKE.ML.ANOMALY_DETECTION ML.AD_HR(INPUT_DATA => TABLE(ML.AD_TRAIN_HR), SERIES_COLNAME => 'RESIDENT_ID', ...)`: 5 multi-series models, `backend/sql/snowflake/004_models.sql:56-80`. Inference `CALL ML.{model}!DETECT_ANOMALIES(`: `backend/app/deep/anomaly.py:189`.
- `SNOWFLAKE.ML.FORECAST`, `CALL {model}!FORECAST(FORECASTING_PERIODS => ...`: `backend/app/deep/forecast.py:100`.
- `AI_PARSE_DOCUMENT(TO_FILE('@DOCS.CARE_PLANS', relative_path), {'mode': 'LAYOUT'})`: `backend/sql/snowflake/003_docs.sql:22` (comment at `:7`: the internal stage needs server-side encryption for AI_PARSE_DOCUMENT).
- `SNOWFLAKE.CORTEX.SPLIT_TEXT_RECURSIVE_CHARACTER(s.section_text, 'markdown', 1000, 150)`: `003_docs.sql:52`.
- `CREATE OR REPLACE CORTEX SEARCH SERVICE DOCS.CARE_PLAN_SEARCH ON chunk ATTRIBUTES resident_id, section WAREHOUSE = VIGIL_WH TARGET_LAG = '1 day'`: `003_docs.sql:56-65`.
- `SELECT SNOWFLAKE.CORTEX.COMPLETE(?, PARSE_JSON(?), PARSE_JSON(?))` (fallback path): `snowflake_rest.py:259`.
- `SELECT AI_EXTRACT(text => ?, responseFormat => PARSE_JSON(?))`: `backend/app/deep/notes.py:171`. `AI_TRANSCRIBE(TO_FILE(...))`: `notes.py:214`. `SNOWFLAKE.CORTEX.AI_AGG` for SBAR shift handoff: `backend/app/deep/handoff.py:45`.
- Warehouses: `VIGIL_WH` XSMALL with auto-suspend 60, plus `VIGIL_ML_WH` MEDIUM used only for training: `backend/sql/snowflake/001_setup.sql:15-29`.
- `SYSTEM$CANCEL_ALL_QUERIES` on shutdown so reloads do not leave queries burning the warehouse: `snowflake_rest.py:344`.

### Roles **[src]** `backend/sql/snowflake/001_setup.sql`
- `:4` `USE ROLE ACCOUNTADMIN;` for a one-time bootstrap pasted into Snowsight.
- `:9` `CREATE ROLE IF NOT EXISTS VIGIL_ROLE;`
- `:10` `GRANT ROLE VIGIL_ROLE TO ROLE SYSADMIN;` (the custom role hangs under SYSADMIN, which is best practice).
- `:11` `GRANT ROLE VIGIL_ROLE TO USER IDENTIFIER($vigil_user);`
- `:12` `GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE VIGIL_ROLE;`
- `:13` `GRANT CREATE DATABASE ON ACCOUNT TO ROLE VIGIL_ROLE;`
- `:20,29` `GRANT USAGE, OPERATE, MONITOR ON WAREHOUSE ...`
- `:32` `ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION';` (needs ACCOUNTADMIN).
- `:35` `ALTER USER ... SET DEFAULT_ROLE = VIGIL_ROLE` because REST calls run as the default role.
- `:38-42` `USE ROLE VIGIL_ROLE; CREATE DATABASE VIGIL` so the app role owns every object.
- The runtime always uses `VIGIL_ROLE` (`backend/app/config.py:26`, connector `snowflake_sql.py:122`, SQL API body `snowflake_rest.py:308`). ACCOUNTADMIN is used only for setup.
- `make check` verifies the session role equals `VIGIL_ROLE`: `backend/scripts/check_connections.py:142-143`.
- Not used: SECURITYADMIN, USERADMIN, masking or row policies.

### What broke on the trial account, and the workarounds
- `inference:complete` REST returns **403 `003001`** "This account is not allowed to access this endpoint" on every model. The workaround sends the same messages through `SNOWFLAKE.CORTEX.COMPLETE` on the SQL API and retries the endpoint every 30 minutes: `snowflake_rest.py:10-16, 249-266` **[src]**; README:81, :595 **[spec]**. Cortex Search REST and Cortex Analyst REST **did** work on the same trial (README:391, :595 **[spec]**).
- With COMPLETE's structured `response_format`, a call took more than 45 s and went async. They put the JSON schema in the prompt instead (about 10 s): `snowflake_rest.py:13-15, 137-145` **[src]**.
- Newer Claude models reject `temperature` ("malformed request"), so it is not sent: `snowflake_rest.py:16` **[src]**.
- Key-pair login matches `LOGIN_NAME`, not `NAME`, and on trial accounts the login name is often the email. Lowercase user names are case-sensitive, so the JWT uses the upper-cased login name: `snowflake_rest.py:3-5, 60-64` **[src]**; README:132 **[spec]**.
- `AI_EXTRACT` schema fields accept strings only (an enum, integer or boolean is refused): `notes.py:14` **[src]**.
- ML training is slow: about 67 min for 9 days of data on MEDIUM (README:674 **[spec]**). Cortex card latency is about 10-15 s, so the UI shows a template first and swaps in the Cortex card when it arrives (README:596 **[spec]**).

### Dependence and judge visibility
- The dependence is deep. Every AI card, anomaly band, forecast line, handoff and "Ask the facility" answer comes from Snowflake. The app still degrades gracefully: when Snowflake is unreachable it shows a templated card (README:591 **[spec]**).
- Judges see an **Under the hood page** with a live "Snowflake · intelligence layer" panel that polls `/api/stats/snowflake` and shows row counts and per-feature API call counts with latency: `frontend/src/components/under-the-hood/under-the-hood.tsx:50-66, 253-322` **[src]**. Each REST call is timed under `rest.<feature>`: `snowflake_rest.py:217` **[src]**.

---

## 2. Hurricane Week (ShellHacks 2026): hurricane-preparedness simulation game

- Repo: `varshith-k/hurricaneweek`, commit `029c9e0ba4f620edd014844dd6bf27abd15ecd72` (2026-09-27), 43 commits; only `origin/main` exists.
- Snowflake's job: a source of **real FEMA/NOAA facts from the free Snowflake Public Data share**, pulled through the SQL API and cached to a JSON file. It was also planned as a Cortex RAG backend for a side-panel "Readiness Assistant", but **Cortex was blocked on their trial**, so Gemini answered in practice (see below). The game simulation never calls Snowflake: `backend/app/services/snowflake_service.py:3-5` **[src]**.

### Architecture and connection **[src]**
- Hand-rolled httpx client for `POST /api/v2/statements` only, with 202 polling and partition fetch: `snowflake_service.py:117-210`. It has no connector dependency.
- Auth: **Programmatic Access Token (PAT)**, header `X-Snowflake-Authorization-Token-Type: PROGRAMMATIC_ACCESS_TOKEN`: `snowflake_service.py:140-141`. `role` and `warehouse` go in each request body: `:169-173`.
- Two PATs: `SNOWFLAKE_SETUP_PAT` defaults to role ACCOUNTADMIN and `SNOWFLAKE_PAT` defaults to role HW_APP: `backend/snowflake/run_sql.py:28-29`. `--capture-token` stores the `token_secret` returned by `ALTER USER ... ADD PROGRAMMATIC ACCESS TOKEN` in `.env`: `run_sql.py:140-144`.

### Snowflake features with anchors **[src]**
- Public Data queries, e.g. `FROM SNOWFLAKE_PUBLIC_DATA_FREE.PUBLIC_DATA_FREE.FEMA_DISASTER_DECLARATION_INDEX`, NFIP claims and `NOAA_WEATHER_METRICS_TIMESERIES` station USW00012839: `backend/snowflake/setup_final.sql:6-8, 29-70`. The results land in `HURRICANE_WEEK.APP.FACTS`, which has 4 rows.
- Facts cache written to disk for offline use: `snowflake_service.py:217-250`; `backend/app/data/snowflake_facts.json`.
- Planned RAG in the template only: `KNOWLEDGE` table with `EMBEDDING VECTOR(FLOAT, 768)`, `SNOWFLAKE.CORTEX.EMBED_TEXT_768`, `VECTOR_COSINE_SIMILARITY`: `backend/snowflake/setup.sql:89-114`. Runtime retrieval SQL: `snowflake_service.py:30-35` (`SELECT AI_COMPLETE(?, ?)`). Model defaults are `llama3.1-70b` and `snowflake-arctic-embed-m-v1.5`: `:66-67`.
- Warehouse `HW_WH` XSMALL with auto-suspend 60: `setup_final.sql:11-12`.

### Roles
- Template `backend/snowflake/setup.sql:118-129` **[src]**: `CREATE ROLE IF NOT EXISTS HW_APP`, then `GRANT USAGE` on the warehouse, database and schema, `GRANT SELECT` on FACTS and KNOWLEDGE, `GRANT DATABASE ROLE SNOWFLAKE.CORTEX_USER TO ROLE HW_APP`, `GRANT ROLE HW_APP TO USER`. A commented-out PAT line uses `ROLE_RESTRICTION = 'HW_APP' DAYS_TO_EXPIRY = 7`. The section heading reads "Least-privilege role for the backend".
- However, **`setup_final.sql` (the file actually run) contains no role section, KNOWLEDGE table or embeddings**, only the warehouse, database and FACTS **[src]** (`setup_final.sql:1-72`). It contains no `USE ROLE` either, so it ran as the setup PAT's ACCOUNTADMIN default (`run_sql.py:29`) **[inf]**.
- [unv] Whether HW_APP and the restricted PAT were ever created on the live account. Next check: none possible from the repo. The only remaining sources are the demo video or asking the team.
- Not used: SYSADMIN hierarchy, SECURITYADMIN or USERADMIN, policies.

### What broke on the trial account
- Commit `c25a51f` message **[src]**: "Cortex AI is confirmed blocked on this trial account (verified directly: **422 on every model and syntax combination**). The existing cortex-then-Gemini fallback chain handles this automatically."
- Their setup never sets `CORTEX_ENABLED_CROSS_REGION` and defaults to the legacy `llama3.1-70b` **[src]**. The 422 may come from that region and legacy-model combination rather than from trial gating **[inf]**. Vigil and half-life both set ANY_REGION and got Cortex to work.
- `SNOWFLAKE_RAG` defaults to `off` (`snowflake_service.py:68`) **[src]**. When RAG is off, retrieval uses local keyword chunks and only the completion is sent to Cortex (`assistant_service.py:344-350`) **[src]**.
- Workaround: the fallback chain goes Cortex, then Gemini, then a verified canned answer (`assistant_service.py:340-380`) **[src]**. A number-check rejects any AI answer that contains a number missing from the sources (`:300-307`) **[src]**. A follow-up commit `ca29ba5` labels ungrounded Gemini answers honestly **[src]**.

### Dependence and judge visibility
- The Snowflake layer is **thin**: 4 fact rows from Public Data plus the assistant's attempted Cortex call. Devpost still claims "a Snowflake Cortex RAG pipeline" **[spec]**, while the code and commit history show Cortex blocked and RAG off by default **[src]**. This discrepancy is worth noting: the prize was won mainly on the Public Data and SQL API integration and its presentation.
- What judges see: an "AI transparency" dialog listing "Snowflake Cortex (Gemini fallback)" (`frontend/src/components/AiTransparency.tsx:8`) **[src]**, a "Snowflake Public Data · FEMA & NOAA" data credit (`assistant_service.py:164`; `ReadinessAssistant.tsx:136-137`) **[src]**, and per-answer `ai_meta` that includes the SQL statements run (`display_sql`, `snowflake_service.py:274-284`) **[src]**.

---

## 3. WayForward (HackNC 2026): iMessage workplace-request agent ("Wayfinder")

- Repo: `samarthdshah/HackNC26`, commit `fa880fe9c17972929455c07a96055d4dbeb3e77b` (2026-10-12), 71 commits. Built in TypeScript/Node.
- Snowflake's job: the **governed data warehouse and access-control layer**. It holds the company directory, budgets, vendors, policies, rooms and request history. Each user question runs under that person's Snowflake role, so Snowflake (not app code) decides what they can see. **There is no Cortex**; Gemini is the LLM.

### Architecture and connection **[src]**
- Raw `fetch` to `POST /api/v2/statements` with 202 polling: `apps/agent/src/data/snowflake.ts:33-54` and `data/snowflake/client.ts:61-81`. No SDK is used.
- Auth: **PAT** with header `PROGRAMMATIC_ACCESS_TOKEN`: `snowflake.ts:14-19`. Two PATs: the owner `SNOWFLAKE_PAT` for setup scripts and `SNOWFLAKE_AGENT_PAT` for a service user (`client.ts:28-32`; `.env.example:42,50`).
- Data is loaded as JSON fixtures with `INSERT INTO t SELECT ... FROM TABLE(FLATTEN(input => PARSE_JSON(?)))`: `data/snowflake/load.ts:182-192`.
- Per-person role: `roleFor(personId)` looks up `person_roles`, falling back to `PHOTON_EMPLOYEE`: `apps/agent/src/data/insights.ts:9`. Snowflake refusals (`002003`/`003001`) are passed back to the user as "refused by Snowflake": `snowflake.ts:64`, `insights.ts:11-16`.

### Roles **[src]** `data/snowflake/roles.sql`
This is the most complete RBAC of the four.
- `:12-18` seven custom roles: `PHOTON_EMPLOYEE, PHOTON_MANAGER, PHOTON_FINANCE, PHOTON_HR, PHOTON_HR_HEAD, PHOTON_VP` (six tiers) and the service role `PHOTON_APP`.
- `:20-33` hierarchy: EMPLOYEE grants into MANAGER, FINANCE and HR; MANAGER and HR into HR_HEAD; MANAGER and FINANCE into VP. All six roll up to PHOTON_APP, which rolls up to **SYSADMIN** (`GRANT ROLE PHOTON_APP TO ROLE SYSADMIN`).
- `:36-52` table-level `GRANT SELECT`. EMPLOYEE has no grant on `requests`, so "Snowflake refuses an employee's history questions outright" (`:45`).
- `:55-62` **row access policy** `hr_rows`, using `IS_ROLE_IN_SESSION('PHOTON_MANAGER') OR (IS_ROLE_IN_SESSION('PHOTON_HR') AND task_type IN (...))`.
- `:66-74` **masking policy** `hr_text` with a conditional column: `CASE WHEN hr_sensitive AND NOT IS_ROLE_IN_SESSION('PHOTON_HR') THEN '[visible to HR only]' ELSE val END`, applied with `... SET MASKING POLICY hr_text USING (title, hr_sensitive) FORCE`. A comment at `:65` explains that a column cannot appear in both a masking signature and a row-access-policy signature.
- `:96, :173` `CREATE OR REPLACE SECURE VIEW` for VP metrics and aggregate metrics, each granted to a single role.
- `:191-205` `CREATE USER WAYFINDER_AGENT TYPE = SERVICE` (no password) with `DEFAULT_ROLE = PHOTON_APP` and `NETWORK_POLICY = hacknc_open`, and every tier role granted to it directly so the agent can name any of them per statement.
- Setup runs as **ACCOUNTADMIN**, pinned in code: `data/snowflake/roles.ts:33-35`, "Creating roles, users, and policies needs ACCOUNTADMIN". They used ACCOUNTADMIN for everything administrative and never touched SECURITYADMIN or USERADMIN.
- `hacknc_open` (allows `0.0.0.0/0`) is created outside `roles.sql`: `data/snowflake/SCHEMA.md:329` **[spec]**. A network policy is what lets a service-user PAT work from anywhere **[inf]**.
- There is a role test suite: `data/snowflake/test-roles.ts` reports "34 pass and 2 KNOWN RISK" (`SCHEMA.md:304`) **[spec]**.
- The warehouse is the trial default `SNOWFLAKE_LEARNING_WH` (`SCHEMA.md:327`) **[spec]**.

### What broke on the trial account
- **Cortex unavailable**: "REST 003001, SQL 399258" (`data/snowflake/verify.ts:2`) **[src]**; README:47 "our trial account did not have it. So Gemini answers from data the agent pulls from Snowflake" **[spec]**. The repo contains no cross-region setting **[src]** (a grep for `cortex` finds only those two lines).
- **The PAT role restriction overrides DEFAULT_ROLE.** The PAT is restricted to PHOTON_APP, so a statement that sends no `role` runs as PHOTON_APP and sees HR text unmasked. Setting `DEFAULT_ROLE = PHOTON_EMPLOYEE` and `DEFAULT_SECONDARY_ROLES = ()` did not help. The workaround: "Lane A must always send a role" on every statement (`roles.sql:186-190` **[src]**; `SCHEMA.md:337, 346` **[spec]**; README:48 **[spec]**).
- `snowflake:load` replaces tables, which drops grants and policy attachments, so `roles.sql` must be rerun after every load (`roles.sql:3`) **[src]**.
- A pasted PAT that wrapped onto two lines was cut off and caused 401 invalid token (`docs/learnings/setup-gotchas.md:9`) **[spec]**.

### Dependence and judge visibility
- The core data layer is real and governance-centric. The money-approval check (`apps/agent/src/tools/permission.ts:1-3`) is still app code over fixtures, with "Lane C will back this with Snowflake roles" **[src]**, and the website reads Tiger/fixtures, not Snowflake (`apps/web/lib/wf/source.ts:23`) **[src]**.
- Demo moment (judge-visible): `/iam dana` asks "Why do new hires take so long?" and gets 4.01 days and 6 hops; `/iam leo` asks the same question and is refused by Snowflake (`docs/demo-day.md:86`) **[spec]**.

---

## 4. We'll Figure Out / Half-Life (OxHack 2026): drug-repurposing shortlist with a "model jury"

- Repo: `Abudidayo/half-life` (linked from the Devpost page), commit `3d5d7488623b4a97722820b1938eab838a348e5a` (2026-10-29), 248 commits. The README says "Winner of MLH's Best Use of Snowflake API at OxHack '26" (README:7 **[spec]**).
- Snowflake's job: **LLM inference only**. A blinded "jury" of three models from different providers runs on Cortex (bake-off picks: GPT-5.4, GLM-5.3, Kimi K3/Grok) and ranks a drug shortlist. Votes are combined by Borda count. Data lives in Tiger Data Postgres and the app is hosted on Vercel (README:18, :23 **[spec]**). Snowflake stores no data.

### Architecture and connection **[src]**
- Uses the **OpenAI Python SDK pointed at Cortex**: `OpenAI(api_key=token, base_url=f"https://{account}.snowflakecomputing.com/api/v2/cortex/v1")`: `core/jury/client.py:555-556`. Calls `chat.completions.create(... response_format=RESPONSE_FORMAT ...)`: `:589-590`.
- Claude models go through the Anthropic-compatible `POST /messages` with `output_config.format = json_schema` and the header `anthropic-version: 2023-06-01`: `client.py:564-576`.
- Auth: **PAT** passed as the API key (`SNOWFLAKE_PAT`): `client.py:547-549`.
- Cost and abuse guard: app-level quotas `cortex:minute` = 12 and `cortex:day` = 180 (`app/api/oxhack_api/settings.py:44-45`, `app/api/oxhack_api/app.py:164-165`). A jury mode switch offers `fixture | mock | cortex`, so tests and demos run without an account (`settings.py:72-77`).
- Every reply is validated (strict JSON, cites real evidence IDs only, numbers quoted exactly), and failed ballots are recorded, never filled in (README:85-95 **[spec]**; `client.py` module docstring `:1` **[src]**).

### Roles
- **No CREATE ROLE, GRANT, USE ROLE or database-role grant anywhere in code** (repo-wide grep) **[src]**. The PAT runs as whatever role it was created with **[inf]**, most likely the trial owner's ACCOUNTADMIN, following the MLH tutorial. [unv] Next check: there is nothing more in the repo; ask the team or watch the demo.
- The only admin SQL is in setup docs: `SHOW PARAMETERS LIKE 'CORTEX_ENABLED_CROSS_REGION'`, then `ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION'` "(needs the ACCOUNTADMIN role)" (`docs/engineering/build-reference.md:21-23`) **[spec]**. The PAT is created with the MLH tutorial's **network-policy step** (`build-reference.md:27`) **[spec]**.

### What broke on the trial account
- No blocking failure is recorded: Cortex worked on their MLH student trial **[spec]**. The juror bake-off logged "no transport/API errors or provider refusals" (`results/juror_bakeoff/summary.md`) **[spec]**.
- Claude via Cortex returned **HTTP 400 with `temperature=0`**, so later Claude calls omit temperature: `core/jury/pilot.py:358` **[src]**. This matches Vigil's finding.
- A 15-candidate run exhausted 4096 tokens mid-JSON, so max_tokens scales at 1024 per candidate: `client.py:565-569` **[src]**.
- Grok's median latency was 249 s per attempt (`summary.md`) **[spec]**. A commit raised the Cortex call timeout to 120 s on Vercel (`31d99f1`) **[src]**.
- Their pre-event research flagged that self-service trials may disable AI until a card is added, that Gemini is not on the Cortex REST list, and that legacy models (llama3.1-70b, mistral) cannot be started on new accounts (`docs/research/planning/sponsor_stack.md:46, 53`) **[spec]**. That last point could explain Hurricane Week's 422 **[inf]**.

### Dependence and judge visibility
- Snowflake is one narrow but central feature: the jury is the headline of the product. It used Cortex's "many models, one account, one REST API" angle, which is exactly the prize text (`sponsor_stack.md:22, 46`) **[spec]**.
- Judge-visible: the jury is shown as a "ballot board with a reading pane" with per-juror status and validity (commits `eea56ef`, `2c04642`, `e9901bd`) **[src]**, and the workflow diagram names the jury models (`f90ac97`) **[src]**.

---

## Cross-project patterns (for a compass app)

| | Vigil | Hurricane Week | WayForward | Half-Life |
|---|---|---|---|---|
| Snowflake role in app | ML + Cortex AI + Search + Analyst | Public Data facts (+ attempted Cortex) | Governed data + RBAC | Multi-model Cortex inference |
| Client | Python connector + httpx REST | httpx SQL API | fetch SQL API (Node) | OpenAI SDK at `/api/v2/cortex/v1` |
| Auth | Key-pair JWT | PAT | PAT (service user) | PAT |
| Custom roles | 1 (`VIGIL_ROLE` under SYSADMIN) | 1 in template, not in the final run | 7 + row access + masking + secure views | none |
| ACCOUNTADMIN | setup only | setup (default of the setup PAT) | setup only, pinned | probably everything [inf] |
| `CORTEX_USER` grant | yes | template only | n/a | no |
| Cross-region set | yes | no | no | yes (docs) |
| Cortex worked? | SQL/Search/Analyst yes; `inference:complete` REST 403 | no (422) | no (003001 / 399258) | yes |

- Trial failure pattern: **Cortex works only when `CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION'` is set and a current model is chosen.** Both teams that set ANY_REGION got Cortex working; both that did not were blocked **[inf]**: this is a correlation across 4 projects, not proof. Even then, `/api/v2/cortex/inference:complete` can be 403 `003001` on a trial, so keep a SQL API `AI_COMPLETE` fallback. Do not send `temperature` to Claude models.
- Roles that read well to judges: a custom app role granted to SYSADMIN, `SNOWFLAKE.CORTEX_USER` granted to that role, ACCOUNTADMIN only in a one-time bootstrap script, and the runtime pinned to the app role. WayForward won without Cortex at all, purely on RBAC, masking, row access and a "Snowflake says no" demo.
- PAT gotchas: the PAT's role restriction overrides DEFAULT_ROLE, so send `role` in every SQL API body. A service-user PAT needs a network policy. A wrapped paste truncates the token.
- Visibility: every winner surfaced Snowflake in the UI (an Under the hood panel with live counts, a transparency dialog with the SQL shown, a refusal message credited to Snowflake, a jury ballot board).

Most reusable idea for a compass web app (8 hours, first-years): Hurricane Week's pattern plus Vigil's proof panel. Pull real reference facts from **Snowflake Public Data via the SQL REST API with a PAT** and cache them to JSON so the demo works offline. Add one `AI_COMPLETE` call with a fallback. Show an "Under the hood" drawer listing the exact SQL and latency. If time allows, add one `VIGIL_ROLE`-style app role with `CORTEX_USER` so it is not "all ACCOUNTADMIN" **[inf]**.

## Search scope
- Devpost pages fetched with curl (4); GitHub links extracted from the HTML. Each page linked exactly one project repo: `snr2753423/Vigil_calhacks`, `varshith-k/hurricaneweek`, `samarthdshah/HackNC26`, `Abudidayo/half-life`. Other GitHub links on those pages were the New Relic browser agent and AutoDock-Vina, both irrelevant.
- Full clones (default branch; Hurricane Week has only `main`). Grepped `snowflake|cortex` repo-wide and roles/grants (`CREATE ROLE|GRANT|USE ROLE|ACCOUNTADMIN|SYSADMIN|SECURITYADMIN|CORTEX_USER|CROSS_REGION`). Read the Snowflake client modules, setup SQL, role scripts, the relevant README/SCHEMA/learnings sections and the Snowflake-related commit messages.
- Not read: every application module in full (for example Vigil's 940-line `assess.py` beyond its anchors), frontends beyond the Snowflake-visible components, demo videos, and non-default branches of other repos.
- Not done: running any code, logging into Snowflake, confirming deployed env values (for example whether `SNOWFLAKE_RAG=on` was set live for Hurricane Week).
- Scratch clones: `/private/tmp/claude-501/-Users-dust-Projects-first-year-hack-new-project/4ebaf192-5440-4dc8-9335-94f7adcd7ba0/scratchpad/repos/` (untrusted, never executed).
