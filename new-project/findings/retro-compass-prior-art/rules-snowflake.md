# Worker: event rules + Snowflake fit (FirstYearHack 2026, compass project)

Seen: 2026-11-21 (all URLs below fetched on this date unless noted). Read-only research: no sign-ups, logins or contact.
Labels: **[OFFICIAL-THIS-EVENT]** = this year's organiser page; **[PRECEDENT]** = same organiser (KCL Tech), earlier event; **[DOCS]** = vendor documentation; **[COMMUNITY]** = participant reports; **[INFERENCE]** = my reasoning.

## 0. Key fact: the event is today

- The event is **FirstYearHack 2026**, run by **KCL Tech** (King's College London student tech society). Luma: https://luma.com/firstyearhack (listed on the KCL Tech calendar https://luma.com/kcltech). **[OFFICIAL-THIS-EVENT]**
  - Date: **21 Nov 2026**, 10:00–19:45 (JSON-LD: startDate 2026-11-21T10:00Z, endDate 19:45Z), Bush House (N), 30 Aldwych.
  - "8 hours in Bush House"; "**Teams of 3** — come with a team, or join other hackers on the day."
  - "**TRACKS REVEALED ON THE DAY**"; "**PRIZES REVEALED ON THE DAY**"; "PROVISIONAL SCHEDULE, FULL SCHEDULE ON THE DAY".
  - Schedule: 9:30 registration, 10:15 "Opening, rules and team matching", 11:00 hacking, 13:00 lunch, **18:00 Submissions and judging**, 19:00 Finals, 19:30 winners.
  - "First-year university students only." "This event is not limited to KCL students." Hosts listed: KCL Tech Events, Haleema Mohammed, Waseef Khan (contact via Luma "Contact the Host").
- **No public Devpost page for the 2026 edition was found.** Devpost API search (`kcl`, `kcl tech`, `first year`, `FirstYearHack 2026`, `retro remix`, `code meets culture`) and ~25 guessed subdomains (firstyearhack-2026, fyh2026, …) all returned nothing/404. It is likely unlisted or created on the day. The rules shown in the opening talk / slides / Discord / Notion are the authoritative source. **[OFFICIAL absence; INFERENCE on reason]**
- Not an MLH member event: not on https://mlh.io/seasons/2027/events. So the Snowflake bonus is probably a direct sponsor prize, not the standard MLH "[MLH] Best Use of Snowflake API" prize. **[INFERENCE]**

## 1. Rules answers

### (a) Can one project compete in both main tracks?

**Answer: probably not — plan on one track (Track 2). Confidence: medium.** Not stated for 2026.

Evidence:
- HackLondon 2026 (KCL Tech / King's College London, Devpost https://hacklondon-2026.devpost.com/ and /rules): "You may only choose one track per team." / "Track Selection: Each team must choose exactly one track." / Rules §2: "Each team must select exactly one track." **[PRECEDENT]**
- First Year Hack 2025/26 (KCL Tech, 15 Nov 2025, https://firstyearhack-2025-2026.devpost.com/rules): "Each participant may only be part of one team and one project submission." Build "aligned with **one** of the hackathon themes." "one winner will be selected for each track." **[PRECEDENT]**
- FirstYearHack 2025 (Feb 2025, https://fyh2025.devpost.com/rules) and CultureHack 2024 (https://culturehack2024.devpost.com/rules): "participants may not switch teams or work on multiple projects." **[PRECEDENT]**
- Conclusion: every KCL Tech event checked either says one track per team or one project per person. **[INFERENCE]**

### (b) Can the Snowflake bonus be won alongside a main-track prize?

**Answer: probably yes. Confidence: medium.** Not stated for 2026.

Evidence:
- At HackLondon 2026 (same organiser), the "one track" rule applied to main tracks only. Sponsor prizes (MLH / Hackathons UK) were separate, and one project won both: **OrbitGuard** won "[MLH] Best Use of Vultr" **and** "(Societies Track) 4x 100 GBP Amazon Gift Card" — https://devpost.com/software/orbitguard . **[PRECEDENT, checked on the project page]**
- Elsewhere, sponsor prizes commonly stack with track prizes: e.g. "Car of the Future" won "[MLH] Best Use of Snowflake API" + "[Toyota Financial Services] Challenge" at HackTX 2026 — https://devpost.com/software/car-of-the-future . **[PRECEDENT, other organiser]**
- Devpost convention: organisers choose whether sponsor/special prizes are opt-in, and how many a team may opt into. Many events allow several (e.g. HackOR FAQ https://hackor.notion.site/HackOR-Categories-Sponsored-Prizes-a6dc8623dbd94042a3bde4e91e8f5d6e ). Some cap it at one (a Codechella FAQ in search results). There is no single Devpost-wide rule. **[INFERENCE from convention]**
- Risk: with only 8 hours and a small first-year event, organisers may cap prizes at one per team. Ask.

### Submission requirements (2026 not public; precedent below)

- 2025/26 edition (https://firstyearhack-2025-2026.devpost.com/ and /rules) **[PRECEDENT]**:
  - "Each team must submit: A **YouTube Video (2–3 minutes)**." It must show a live demo, the problem, the design rationale, pros/cons and trade-offs, and future improvements. "**Include clear voice narration**". "The video should demonstrate both the functionality and the thought process behind the design, not just the final product."
  - Judging criteria (rules page): Innovation & Creativity; Technical Implementation; Impact & Relevance; **Presentation & Clarity** ("How clearly is the solution communicated in the submission and video?"). The overview page lists the video sections (overview, core features, design explanation, benefits/limitations, future improvements) as the judging criteria.
  - Teams of 3–4 (2026 Luma says teams of 3). Prizes then: 4×100Hz monitors (Track 1), 4×mechanical keyboards (Track 2); the rules also said £85 per person.
  - Judging was by reviewing submissions (no live-demo requirement stated); in 2026 the schedule has "Submissions and judging" at 18:00 then "Finals" at 19:00, so expect a live finals pitch for shortlisted teams. **[INFERENCE]**
- FirstYearHack 2025 (Feb): 4-minute demo video + "Evidence of effective teamwork (e.g., Git history)". **[PRECEDENT]**
- HackLondon 2026 Devpost fields (KCL Tech's fuller template) **[PRECEDENT]**: Project Name; Description (including which track); How It Was Built; Challenges; Accomplishments; What's Next; Demo Video; **public GitHub repo**; all members listed; "built strictly during the event".
- Implication for a **cinematic** video **[INFERENCE]**: if the 2–3 min / narrated / live-demo / pros-cons pattern holds, a mostly cinematic trailer could lose marks on "Presentation & Clarity" and "Technical Implementation". Safer: keep the cinematic part short (about 20–40 s) and spend the rest on a narrated live demo, design rationale and limitations, all inside the time cap. A tight 18:00 deadline after 7 hours of hacking also limits editing time.

### Exact question to ask organisers (Discord or the help desk, now)

> "Hi! Three quick rule checks for FirstYearHack 2026: (1) Can one project be entered in both Track 1 and Track 2, or must we pick exactly one? (2) Can a project win the Snowflake 'Best Use of Snowflake' bonus as well as a main-track prize, and do we need to opt in or tag Snowflake on the submission? (3) What is the video requirement — maximum length, does it have to be a live demo with voice narration, and YouTube or another platform? Also, is the submission on Devpost, and what is the link?"

## 2. Snowflake fit for a compass project

### Accounts a first-year team can get for free

| Route | Terms | Cortex AI (AI_COMPLETE etc.) | Cortex Code (CoCo) CLI | Source / label |
|---|---|---|---|---|
| Standard self-service trial (trial.snowflake.com / signup.snowflake.com) | "The trial continues for **30 days** (from the sign-up date) or until you've depleted your free usage balance". Suspended at end. $400 credit is widely quoted; the docs page itself does not state the amount. | "**AI features are disabled by default on self-service trial accounts until you add a credit card** to the account. Adding a credit card doesn't upgrade the trial to a paid account or end the trial period." | "CoCo CLI is **not available on standard Snowflake trial accounts** (for example, accounts created at trial.snowflake.com)." | https://docs.snowflake.com/en/user-guide/admin-trial-account ; https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli **[DOCS]** |
| Student trial via MLH link `signup.snowflake.com/?trial=student&…` | MLH says "Start a **120-day** free Snowflake trial" / "special, student 120-day Snowflake trial". Credit amount and card rule are not stated on a Snowflake page. | Not documented. Mixed participant reports (see community section). | Not documented. Probably not included, since it is not the CoCo trial. **[INFERENCE]** | https://www.mlh.com/partners/snowflake (link mlh.link/snowflake-signup resolves to signup.snowflake.com/?trial=student…); HackMTY 2026 prize text https://mlh.com/events/hackmty-2026/prizes **[PARTNER, not Snowflake docs]** |
| Dedicated CoCo trial `signup.snowflake.com/cortex-code` | "free trial that includes a fixed amount of CoCo CLI usage. The trial is valid for **30 days** … After the trial period ends, the account **converts to a paid subscription unless canceled**." Search snippets of snowflake.com/en/snowflake-trial/ say **$40 in free inferences** (page 403 to the fetcher; not seen directly). | n/a (CLI usage quota) | Yes | https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code (CoCo CLI billing) **[DOCS]** |
| Snowflake for Academia | Free access for courses, through instructors at accredited institutions. Not a same-day individual route. | — | — | https://learn.snowflake.com/en/snowflake-for-academia **[VENDOR PAGE]** |
| Sponsor-provided accounts/credits at the event | Unknown. Ask the Snowflake reps or organisers. This could remove all the limits above. | ? | ? | **[INFERENCE]** |

Practical warnings **[INFERENCE]**:
- Without a credit card, a plain trial still gives **all geospatial SQL, H3, Marketplace data and Streamlit**. AI_COMPLETE probably does not work until a card is added. The CoCo trial auto-converts to paid unless cancelled. A first-year team should decide deliberately before entering card details.
- Cross-region inference: "For new accounts created in new organizations within commercial regions after March 9, 2026, `ANY_REGION` is the default." So a London-region (AWS eu-west-2) trial should reach models once AI is enabled. Otherwise run `ALTER ACCOUNT SET CORTEX_ENABLED_CROSS_REGION = 'ANY_REGION';` as ACCOUNTADMIN. https://docs.snowflake.com/en/user-guide/snowflake-cortex/cross-region-inference **[DOCS]**

### Cortex AI functions (exist; docs)

- Functions listed: AI_COMPLETE, AI_CLASSIFY, AI_FILTER, AI_AGG, AI_SUMMARIZE_AGG, AI_EMBED, AI_SIMILARITY, AI_EXTRACT, AI_SENTIMENT, AI_TRANSLATE, AI_TRANSCRIBE, AI_PARSE_DOCUMENT, AI_REDACT, AI_COUNT_TOKENS. Access needs the "USE AI FUNCTIONS account-level privilege and one of the CORTEX_USER or AI_FUNCTIONS_USER database roles." https://docs.snowflake.com/en/user-guide/snowflake-cortex/aisql **[DOCS]**
- AI_COMPLETE "Generates a response (completion) from text, images, documents, audio, or video using a supported language model". It has structured-output variants. https://docs.snowflake.com/en/sql-reference/functions/ai_complete **[DOCS]**
- Compass uses **[INFERENCE]**: AI_COMPLETE writes a "ship's log" / old-navigator narration for each bearing ("Bearing 047°, 1.2 km: the British Museum…"). AI_CLASSIFY/AI_FILTER filter POIs by mood ("somewhere quiet"). AI_TRANSLATE gives a multilingual log. AI_COMPLETE on an image could read a photographed paper map or old compass rose.

### Cortex Code (CoCo) CLI

- What it is: "a terminal assistant for Snowflake. It takes natural-language requests and tries to fulfill them by orchestrating Snowflake-native skills and any MCP tools you have configured." The product is now branded "Snowflake CoCo" (web, desktop IDE, CLI; Excel/Sheets add-ins in preview). https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code-cli ; https://docs.snowflake.com/en/user-guide/cortex-code/cortex-code **[DOCS]**
- Install (macOS/Linux/WSL): `curl -LsS https://ai.snowflake.com/static/cc-scripts/install.sh | sh`; Windows: `irm https://ai.snowflake.com/static/cc-scripts/install.ps1 | iex`. Prereqs: a user with SNOWFLAKE.CORTEX_USER or CORTEX_AGENT_USER, cross-region inference if needed, Snowflake CLI, and bash/zsh/fish. **[DOCS]**
- Status: GA/preview is not stated on the CLI page. Changelog at https://docs.snowflake.com/en/user-guide/cortex-code/changelog (1.2.35 is the latest version seen in a user report). Security: CVE-2026-6442 (sandbox bypass, fixed in 1.0.25), so install the current version. https://www.snowflake.com/en/why-snowflake/snowflake-security-hub/security-bulletins/CVE-2026-6442/ **[DOCS / vendor bulletin, via search snippet]**
- Compass use **[INFERENCE]**: use CoCo to explore the Overture Places share and generate the bearing/distance SQL and a Streamlit page. Show this in the video and README ("how CoCo helped"), as MLH's CoCo challenge asks: https://hacktoberfest-handbook.mlh.com/hack-days-partner-modules/partner-challenge-snowflake-coco

### Geospatial functions (confirmed in docs)

- **ST_AZIMUTH(origin_point, target_point)** — "returns the azimuth in radians". The observer faces north (GEOGRAPHY) / +Y (GEOMETRY); the "angle is positive in the clockwise direction". North=0, East=π/2, South=π, West=3π/2. "If the two Points are the same location, the function returns NULL." Non-points give an error. It uses a spherical-Earth formula. Example: `DEGREES(ST_AZIMUTH(TO_GEOGRAPHY('POINT(0 1)'), TO_GEOGRAPHY('POINT(1 2)')))` → 44.978…. https://docs.snowflake.com/en/sql-reference/functions/st_azimuth **[DOCS]** → This is a compass bearing: `DEGREES(ST_AZIMUTH(me, poi))` gives 0–360° true bearing. Magnetic declination is not included (~0–1° in London in 2026; add it in the app if wanted). **[INFERENCE]**
- **ST_DISTANCE** — GEOGRAPHY: "minimum great circle distance … in meters". GEOMETRY: Euclidean in input units. https://docs.snowflake.com/en/sql-reference/functions/st_distance **[DOCS]**
- **ST_DWITHIN** — TRUE if the great-circle distance is within N metres (radius search). https://docs.snowflake.com/en/sql-reference/functions/st_dwithin **[DOCS]**
- **ST_MAKEPOINT(lon, lat)**, ST_MAKELINE, ST_GEOHASH — exist. **H3_LATLNG_TO_CELL** ("Returns the INTEGER value of the H3 cell ID for a given latitude, longitude, and resolution") and **H3_GRID_DISK** (cells within k steps) exist. https://docs.snowflake.com/en/sql-reference/functions/h3_latlng_to_cell ; …/h3_grid_disk **[DOCS]**
- Sketch **[INFERENCE, untested]**:
  ```sql
  SELECT names['primary']::string AS name,
         ROUND(DEGREES(ST_AZIMUTH(ST_MAKEPOINT(-0.1174, 51.5131), geometry)),0) AS bearing_deg,
         ROUND(ST_DISTANCE(ST_MAKEPOINT(-0.1174, 51.5131), geometry)) AS metres
  FROM OVERTURE_MAPS__PLACES.CARTO.PLACE
  WHERE ST_DWITHIN(geometry, ST_MAKEPOINT(-0.1174, 51.5131), 2000)
  ORDER BY metres LIMIT 50;
  ```
  (Bush House coordinates from the Luma JSON-LD; check the column names in the share before relying on them.)

### Marketplace datasets that fit a compass

- **Overture Maps (CARTO) — Places, Addresses, Base, Buildings, Divisions, Transportation.** "published and maintained by" CARTO, kept "synced with the last release". Sample `FROM CARTO.PLACE WHERE taxonomy['primary']='restaurant'`. Provider page: https://app.snowflake.com/marketplace/providers/GZT0ZKUCHE3/CARTO . Docs: https://docs.overturemaps.org/getting-data/data-mirrors/snowflake/ **[DOCS]**. Overture's announcement calls it a free listing (https://overturemaps.org/announcements/2024/overture-map-data-now-available-in-bigquery-and-snowflake/, 2024). Default db name per Snowflake guide snippet: OVERTURE_MAPS__PLACES. → Global POIs for "point the needle at…" and Divisions for "which borough am I in". **Best fit.**
- **Sonra "OpenStreetMap New York"** — sample OSM listing used in Snowflake's geography quickstart (search "OpenStreetMap New York"). NYC only, so weaker for London. https://github.com/Snowflake-Labs/sfquickstarts/blob/main/site/sfguides/src/getting-started-with-geospatial-geography/getting-started-with-geospatial-geography.md **[DOCS/quickstart]**. No free global or UK OSM listing was confirmed.
- **Free data products filter** (MLH's "Free Snowflake Datasets" link): https://app.snowflake.com/marketplace/data-products?pricing=free . Includes "Snowflake Public Data (Free)" (NOAA weather among others) and Weather Source free samples (older sources: https://quickstarts.snowflake.com/guide/tasty_bytes_zero_to_snowflake_collaboration , Weather Source blog 2022). Current UK coverage was not verified. **[DOCS, partly dated]**
- CARTO Analytics Toolbox native app = 30-day trial, not needed. https://docs.carto.com/data-and-analysis/analytics-toolbox-for-snowflake/getting-access/native-app-from-snowflakes-marketplace

### Compass-project shapes that score on "Best Use of Snowflake" **[INFERENCE]**

1. "Heritage needle": the compass points to the nearest historic or cultural POI (Overture Places categories). Bearing and distance come from ST_AZIMUTH/ST_DISTANCE in Snowflake, and AI_COMPLETE narrates an 18th-century navigator log. This matches Track 2 and touches Track 1 themes, but enter only Track 2.
2. "Dead-reckoning journal": the phone heading plus steps are logged into Snowflake. H3 cells build a fog-of-war map of explored hexes, and AI_AGG summarises the day's voyage.
3. Keep the core compass working without Snowflake (device orientation API), with Snowflake as the intelligence layer. Past winners stress graceful degradation (Hurricane Week) and a visible "Under the hood: every Snowflake call" panel (Vigil).

## 3. Past "Best Use of Snowflake" winners (Devpost, verified on the project pages)

| Project | Event | Prize label | What Snowflake did |
|---|---|---|---|
| We'll Figure Out (Half Life) — https://devpost.com/software/we-ll-figure-out | **OxHack 2026** (UK) https://oxhack-2026.devpost.com/ | [MLH] Best Use of Snowflake API | "three-model jury through Snowflake Cortex" reviewing cited drug-repurposing evidence |
| Hurricane Week — https://devpost.com/software/hurricane-week | ShellHacks 2026 | [MLH] Best Use of Snowflake API | FEMA/NOAA facts loaded into Snowflake → embed → cosine retrieval → **AI_COMPLETE** grounded answers; Gemini fallback; "degrade gracefully" |
| Vigil — https://devpost.com/software/vigil-aewt3u | Cal Hacks 13.0 | [MLH] Best Use of Snowflake API | Deepest use: ML.ANOMALY_DETECTION, ML.FORECAST, AI_PARSE_DOCUMENT → Cortex Search, Cortex COMPLETE, AI_AGG, Cortex Analyst, plus an "Under the hood" page counting every Snowflake call |
| WayForward — https://devpost.com/software/wayforward | HackNC 2026 | [MLH] Best Use of Snowflake API | Snowflake as governed data store: six roles, masking policy, the DB enforces access. **No Cortex** ("our trial account did not have it") — won on governance features alone |
| Sim4Food — https://devpost.com/software/sim4food | Hack Atlantic https://hack-atlantic-sep27.devpost.com/ | **Best Use of Snowflake** (sponsor-named, Arduino kit) | Snowflake Cortex AI assistant over forecasts, waste and orders |
| Car of the Future — https://devpost.com/software/car-of-the-future | HackTX 2026 | [MLH] Best Use of Snowflake API **+ Toyota challenge** | Cortex Agent analyses cases against a policy and returns structured data (example of stacking) |

Others found: Invasive Species Lookout (Hack Knight Fall 2026, NYC geo/education), Agent City (SBUHacks 2026), Replicavire (PalmettoHacks 2026), Silicon Shoppers (LA Hacks AI 2026). **What judges rewarded [INFERENCE]**: Snowflake doing a real job (RAG/grounding, governance, ML), named functions shown explicitly, and an honest account of limits. Novelty alone was not enough. No past winner used ST_AZIMUTH or geospatial data, which leaves an opening.

## 4. Community feedback on limits / CoCo problems

- GitHub issue, 2026-11-07, Snowflake SE workshop repo: CoCo CLI v1.2.35 on a trial (created 6 Nov 2026) gives "Cortex Code is not enabled or the usage limit has been reached. Please upgrade your account…". `AI_COMPLETE('claude-sonnet-4-6', …)` gives "**AI function _COMPLETE_WITH_PROMPT_HISTORY_LLM is not available for trial accounts.**" even after setting ANY_REGION. https://github.com/sfc-gh-rbachala/building-ai-agents-with-coco-workshop/issues/12 **[COMMUNITY]**
- GitHub issue, 2026-05-27, Snowflake-Labs guide: "entitlements are currently not permitted on trial accounts: Cortex Search, Cortex Complete, Cortex Agent, Parse Document". https://github.com/Snowflake-Labs/sfguide-supply-chain-assistant-with-snowflake-intelligence/issues/1 **[COMMUNITY]**
- Devpost write-ups: WayForward: "We planned to use Cortex … but our trial account did not have it." Vigil: "Trial-account limits: Cortex's inference:complete REST endpoint returned 403, so Claude runs through the SQL REST API instead. Parallel anomaly detection also saturated the warehouse". **[COMMUNITY]**
- Quickstart gap: "Cortex Code Foundations" guide uses COCO_WORKSHOP_ROLE/WH/DB without a setup step (2026-11-21). https://github.com/Snowflake-Labs/sfguides/issues/12 **[COMMUNITY]**
- DeepLearning.AI forum: a trial learner fixed Cortex by setting cross-region to AWS_US. https://community.deeplearning.ai/t/snowflake-snowsight-setup-data-module-2/885384 **[COMMUNITY, via search snippet]**
- Search snippets cite an older docs version saying trial accounts without payment get "roughly ten credits … per day of Cortex AI Functions". The **current** docs page instead says AI features are disabled until a card is added. Treat the 10-credit cap as superseded. **[DOCS conflict, current page wins]**
- Reddit: r/snowflake JSON search and mirrors were blocked or unreachable from this machine; no Reddit threads were reviewed. **[GAP]**

## 5. Bottom line for the team today [INFERENCE]

- Enter **Track 2 only**. Ask (question above) whether the Snowflake bonus stacks and whether you must opt in or tag it.
- Make Snowflake's core contribution **SQL geospatial + Overture Places** (works on any trial, no card). Add AI_COMPLETE narration only if the sponsor gives you an AI-enabled account or you accept adding a card. Ask the Snowflake reps first for event accounts or credits.
- Skip CoCo CLI unless the sponsor provides access: it needs a separate trial that auto-converts to paid. If used, show it briefly in the video as the tool that wrote the SQL.
- Video: stay inside the likely 2–3 min cap with narration and a live demo. Put cinematic shots in the opening only.

## Search scope

Devpost API (hackathons + software search), Devpost pages for KCL Tech events 2024–2026, Luma (KCL Tech calendar, FirstYearHack 2025.2 + 2026), kcltech.co.uk, MLH events/partner/prize pages, Snowflake docs (trial, CoCo, AI functions, geospatial, cross-region), Overture docs, Snowflake-Labs quickstarts (GitHub), GitHub issue search (`gh`), web search. Not reachable: snowflake.com marketing trial page (403), Reddit (blocked), Instagram/Discord (not attempted, needs a login).
