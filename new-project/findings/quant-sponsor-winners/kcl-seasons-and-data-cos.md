# KCL Tech past seasons and data-company sponsor winners

Checked: 2026-11-21. Read-only: Devpost pages fetched with curl, repos read through `gh api` (contents and trees). Nothing was cloned or run, and no logins were used.
Labels:
- **verified-on-page**: seen on the Devpost or event page.
- **verified-in-source (path:line)**: seen in the repo at that line, on the default branch as of today.
- **inferred**: my reasoning.
- **lead-only**: found but not confirmed.

This file does not repeat the rules answers in `../retro-compass-prior-art/rules-snowflake.md` §1: one track per team, stacking sponsor prizes, and the video/submission format.

---

## Part A: KCL Tech's previous seasons

### A.1 Sponsors and challenges by event

| Event | Devpost | Sponsors / prize givers | Data or quant company? |
|---|---|---|---|
| CultureHack 2024 (20 Nov 2024, KCL Tech members, 29 participants) | https://culturehack2024.devpost.com | KCL Enactus, the CMCI department (no corporate sponsor); £100 of Amazon cards | None |
| FirstYearHack 2025 (26 Feb 2025, KCL first-years, 26 participants) | https://fyh2025.devpost.com | KCL Tech, King's Labs (judges); £80 + £80 gift cards | None |
| HackLondon 2025 (1–2 Mar 2025, IOE/UCL, UCL TechSoc + KCL Tech + UCL CSS + UCL DSS) | https://hacklondon-2025.devpost.com returns **403** (private) | Bending Spoons (sponsor), "GenAI support from OpenAI", "over £4000" in prizes (Huzzle page https://www.huzzle.com/e4iejmca) | None found (lead-only: no prize list is public) |
| First Year Hack 2025/26 (15 Nov 2025, Bush House, 70 participants) | https://firstyearhack-2025-2026.devpost.com | No sponsor logos; judges Kevin Xu, Stella Song; 4×100Hz monitors (Track 1), 4×mechanical keyboards (Track 2) | None |
| HackLondon 2026 (21–22 Feb 2026, Bush House, KCL + UCL, 230 participants) | https://hacklondon-2026.devpost.com | Logos: Hackathons UK, MLH, **Serac Group**, Knowunity, Qualcomm (+eesoc). MLH prizes: Gemini, ElevenLabs, Solana, Presage, Vultr, **MongoDB Atlas**. Hackathons UK prizes: Arm AI agents, Hackiest Hack | **Serac Group / IBex** (UK planning and property data). **MongoDB Atlas** (data platform, via MLH). **No quant firm.** |

All sponsor rows are verified-on-page, except HackLondon 2025, which comes from Huzzle.

**Challenge texts quoted (verified-on-page):**

- **FYH 2025:** "Your challenge: gamify everyday student life at KCL." The technical route had to "incorporate at least two gamification elements (e.g., leaderboards, badges, progress tracking)". Rules: "You are **not** allowed to use any paid resources or trials of resources (e.g. you're not allowed to use the OpenAI API but you can use a free huggingface LLM model)". AI chatbots were allowed. Judging: Creativity & Innovation; Gamification Elements; Usability/Design Quality; Feasibility; Demo/Pitch Quality.
- **CultureHack 2024:** CMCI students pitched cultural-sector problems, and teams built "a compelling proof of concept" in 7 hours (Figma, prototype or slides). Scoring: Creativity & Social Innovation 20, Feasibility & Sustainability 20, **Social Impact & Relevance 25**, UX & Inclusivity 15, Pitch 20.
- **FYH 2025/26:**
  - Track 1 EdHealth: "Web Apps That Teach & Heal".
  - Track 2 Daily: "Build the Tool That Should Exist". One challenge area is "**Personal Data Wrangling**: Browser extensions or web apps that clean up subscriptions, track warranties, or organize digital receipts".
  - Track 3: Nourish Box (non-tech business model).
- **HackLondon 2025:** The tracks are not public. Repos name "Category 1: A World Without X" (verified-in-source: `Heiley-W/HackLondon2025/README.md:2`; `m31-galaxy/TermOS/README.md:5`).
- **HackLondon 2026, Serac Group & IBex "Autonomous Planning Intelligence Challenge"** (the one data-company track):
  - Brief: "Build solutions that shape the future of cities by: Predicting risk, Optimising land use, Automating compliance, Building digital twins".
  - Resources: "Live UK geospatial datasets (EPC, Flood Risk, Green Belt, etc.)" and "Exclusive hackathon access to the IBex API for planning data".
  - Judging:
    - Real-World Relevance **30%**
    - "Effective Use of IBex API and datasets" **20%** ("Is IBex central to the system's logic? Are its historical records, classifications, or polygon data meaningfully leveraged?")
    - Technical Sophistication **35%** ("strong architecture, multi-step reasoning, structured workflows, or intelligent automation")
    - UX **15%** ("Is the core task clear within the first 30 seconds?" "Are outputs presented in a clear, structured format")
  - Compliance: "Open datasets must have appropriate licences and be referenced." "IBex data must not be copied, exported, or published in public repositories." The repo "Must not include restricted or proprietary data".
- **HackLondon 2026, other tracks:**
  - Knowunity: "Build a daily learning companion … Go beyond tools like ChatGPT or Gemini". Judged on Idea, Execution (UX and flow) and Technical ambition.
  - Hardware "Unicorns Den" (Qualcomm/eesoc): five criteria at 20% each, including a BOM-based "Financial Viability".
  - Societies: "Build for 2036." Judged on Feasibility, Creativity, Clarity and Sustainability.
  - Format: "3-minute live demo" plus "2 minutes of Q&A".
- **[MLH] Best Use of MongoDB Atlas** (HL26 text): "MongoDB Atlas takes the leading modern database and makes it accessible in the cloud! … $50 credit for students or … free forever tier (no credit card required) … Build a hack using MongoDB Atlas for a chance to win a M5Stack IoT Kit".

### A.2 Winners (all prize labels verified-on-page from each project page)

**CultureHack 2024**

| Prize | Project | What / data |
|---|---|---|
| Winning Project + Wildcard | STAY App https://devpost.com/software/stay-app | ADHD study-session planner. A dataset of participant age, education stage, ADHD severity and preferred study/break lengths went into **scikit-learn linear regression** that predicts session and break durations. It is the only data-model winner at a small KCL event. |
| Wildcard | Multitranslator https://devpost.com/software/cultureback | Text/speech/sign translator (Python, scikit-learn image model); no dataset described |
| Wildcard | ElderConnect https://devpost.com/software/elderconnect-b1wpi2 | Description empty ("-") |

**FirstYearHack 2025**

| Prize | Project | What / data |
|---|---|---|
| Technical Route | World of Quiz https://devpost.com/software/world-of-quiz | 2D quiz RPG (Next.js/TSX); static question data |
| Non-Technical Route | KCL GO https://devpost.com/software/kcl-go | Pokémon-Go-style lecture-attendance collectables; Canva mockups plus a partial Java prototype; no data |

**HackLondon 2025** (no public Devpost; all lead-only, from the teams' own READMEs)
- TermOS, "won first place for its category of _A World Without X_" (verified-in-source `m31-galaxy/TermOS/README.md:5`). A terminal OS with no GUI.
- LLM (Long Lasting Matches), "HackLondon 2025 Winner" (`NARNIX0/NARNIX0/README.md:63`). An LLM dating twin; Groq Llama 3 70B + SQLite (`NARNIX0/LLM/HackLondon Final submission/dating-app/README.md`).
- A "3rd Place @ UCL HackLondon 2025" claim with no project named (`ADI-0519/ADI-0519/README.md:19`).

**First Year Hack 2025/26**

| Prize | Project | What / data |
|---|---|---|
| Technical Track 1 (EdHealth) | DermaAid https://devpost.com/software/dermaaid | Melanoma screening: a TensorFlow model converted to **TF.js and run client-side**, an OpenAI ingredient analyser, a dermatologist locator and a skin-conditions DB |
| Technical Track 2 (Daily) | Flatfam.space https://devpost.com/software/flatfam-space | Flat-share chores/costs/mood app; Next.js + **Supabase** (auth + SQL); a "Working Model" simulator; no external data |

**HackLondon 2026** (21 winners; the data-heavy ones are described in most detail)

| Prize | Project | Data and how it was used |
|---|---|---|
| Serac 1st (Steam Deck) | Slaoo / "Green Brick" https://devpost.com/software/slao , repo https://github.com/alexsukhin/slaoo-hacklondon26 | Address + budget gives a retrofit ROI roadmap. **IBex** planning applications within 500 m for local approval trends, the **EPC API** (Open Data Communities), **HM Land Registry** sale averages and **Nominatim** geocoding, all through async FastAPI/httpx. On the page: "Matching a user's address across the EPC database, Land Registry, and planning records was difficult due to varying formats", solved with a regex-based `EPCClient`. Code check: default `radius: int = 500` (`backend/helpers/ibex_service.py:10`); EPC band premiums `{'A': 0.14, … 'C': 0.05, 'D': 0.00 …}` (`backend/helpers/value_calculator.py:7`). |
| Serac 2nd (Sony XM5) | CityZenith https://devpost.com/software/cityzenith | 3D urban-intelligence map. Parallel calls to IBex, the Land Registry SPARQL endpoint and Environment Agency WFS layers. **Local Plan PDFs chunked into MongoDB Atlas Vector Search** for RAG with Gemini 2.5 Pro. A "custom normalisation layer to filter out 'noise' (like minor domestic extensions)". "streaming data progressively, so the UI updates as each 'layer' of evidence arrives". Footprints and heights come from vector tiles. No repo on the page. |
| Serac 2nd (Sony XM5) | Aurea https://devpost.com/software/aurea-ai-powered-residential-insurance-underwriting , repo https://github.com/krishnagopika/Aurea | Insurance underwriting with LangGraph. **Parallel data agents**: IBex `/search` at 500 m, `/stats` by council and `/applications-by-id`, plus flood, environmental and crime data. It falls back to postcodes.io for the council. A PolicyAgent does RAG over MongoDB Atlas Vector Search, and Claude on Bedrock writes the decision and explanation. |
| Serac 3rd | Zonary https://devpost.com/software/zonary , repo https://github.com/FeZZus/brandonjohnson | SME site selection. IBex residential planning data is split into **micro-regions, shown as a heatmap and scored** on build momentum, council approval behaviour and income resilience (external median income). It ranks postcodes and Gemini explains them. Stated limit: "available planning data focused on residential project types, which required us to pivot". |
| [MLH] MongoDB Atlas | Veryfi https://devpost.com/software/veryfi | See B.6 |
| [MLH] Vultr + Societies 3rd | OrbitGuard https://devpost.com/software/orbitguard | **CelesTrak TLEs "on a six-hour cadence"**. SGP4 screening, then Cowell propagation with J₂–J₆ and drag. Collision probability by Foster/Chan plus Monte Carlo. SQLite store. |
| Societies 1st (Quest 3) | GRID https://devpost.com/software/grid-38zo0l | National Grid substation data: "processes 7-day grid data, computes performance metrics", with a CesiumJS what-if simulation and a PDF report. "matching substation names/locations, handling inconsistent time-series data" |
| Societies 2nd (iPads) | Hack & Seek https://devpost.com/software/hack-seek | Real-time hide-and-seek across Tube stations. Go websockets, OSM/Leaflet, S3 + CloudFront images. Live location is the data. |
| [MLH] Gemini | PanikBot https://devpost.com/software/panikbot | Discord chat scraping goes to Gemini; community-upvoted answers go into ChromaDB RAG |
| [MLH] Presage | ReelTrust | Presage vitals, Solana and MongoDB results store |
| [MLH] Solana | CarbonTrade | Kaggle data, OpenAI, Supabase, Solana |
| [MLH] ElevenLabs | My Stardust | Voice-cloned study agent |
| Knowunity 1st / 2nd / 2nd / 3rd | Epsilon Delta; StudyQuest; StudyArena; FriendUnity | AI tutors with gamification. Data is user notes and quizzes (Firebase, SQLite, Supabase). |
| Hardware 1st / 2nd / 3rd | SharkByte (ESP32 NFC → Flask + **MongoDB** attendance and XP); FocusField; UniBin (vision sort + Streamlit fill-level dashboard) | Sensor events |
| Hackathons UK Arm / Hackiest | MAK-G; Pocket Desktop UniBuddy | Hardware |

### A.3 What this says about KCL judges (inferred)

- At the small first-year events (CultureHack and both FYH editions), **no winner relied on an external dataset**. They won on a clear student problem, a working UI and the video or pitch. Data depth was not rewarded or required.
- The one **data-company track** KCL ran (Serac/IBex) put **20% on "effective use of the API and datasets"** and **35% on architecture and multi-step workflows**. All four winners:
  - fused IBex with **other UK open data** (EPC, Land Registry, EA flood, postcodes.io, Nominatim)
  - used **radius queries around a point** (500 m was the usual default)
  - turned raw records into a **score, heatmap or decision**
  - had an LLM explain the result
- Winners openly named their data problems: messy address matching, noisy records, schema pivots and API latency. That matches the "Benefits and limitations" section KCL asks for in the FYH 2025/26 video.
- **No quant firm has sponsored any KCL Tech event checked.** The quant sponsors in London student hackathons are at other organisers' events (see Search scope).

---

## Part B: Data-company sponsor winners

### B.1 Surg+F: MadHacks 2026, "Databricks Prize Track"
- **Event and prize:**
  - MadHacks 2026 (UW–Madison, 14–15 Nov 2026), https://madhacks-fall-2026.devpost.com . The prize is "Databricks Prize Track", worth "Databricks Backpack + Databricks Owala Water Bottle (1 each per team-member)". No challenge text is on Devpost.
  - Judging: "There are multiple criteria including creativity and execution." (verified-on-page)
- **Project:** https://devpost.com/software/surg-f ; repo https://github.com/shlokrj/surg-f
- **Data and processing (verified-on-page):**
  - **CholecT50**: 50 real cholecystectomy videos. "The dataset shipped as still frames, so we rebuilt and time-aligned the full-quality videos ourselves."
  - SurgVLP features were extracted per second, then a multilabel network predicts 29 labels. It was evaluated on unseen surgeries.
  - "Extraction and training ran as **serverless jobs**, with every run tracked in **MLflow** and all data stored in **Unity Catalog Volumes**." A **Lakeflow job loads nearly 13,000 clips into a Delta table**.
  - Search runs on **Databricks SQL**, a **Genie space** answers free-form questions, and Llama 3.3 on Model Serving routes chat. It is hosted on **Databricks Apps**.
  - It is a **batch** pipeline. "GPUs weren't available, so we re-engineered feature extraction to run on serverless CPU"; "We ran out of free-tier Databricks compute the night before the demo."
- **Code check (verified-in-source):**
  - `databricks/import_clips.sql:3-25`: an idempotent `MERGE INTO surgf_clips … WHEN NOT MATCHED THEN INSERT` with `try_cast` and validity filters.
  - `ml/train_multilabel_databricks.py:14,24,30`: `import mlflow`, `/Volumes/workspace/default/surgf/labels/labels_v1.json`, `mlflow.start_run(...)`.
  - `backend/app/repository.py:1`: "Databricks SQL for real data, local fixtures for offline development". `:59-65`: a parameterised `WHERE lower(label) = :label` query.
  - `backend/app/genie.py:3-5`: "Genie writes and runs the SQL itself; this service never executes SQL that Genie wrote."
- **Why it won (inferred):** It used the most Databricks surface (Jobs, MLflow, UC Volumes, Delta, SQL, Genie, Model Serving, Apps) end to end on real public data. It had a held-out evaluation and an offline fixture fallback.

### B.2 Solarify: DataHacks 2026 (UCSD), "Challenge: Best Use of Databricks" (1 of 2 winners)
- **Event and prize:**
  - DataHacks 2026, 18–19 Apr 2026, https://datahacks-2026.devpost.com . The prize is "Challenge: Best Use of Databricks", worth $1,300, 2 winners; 1st was "JBL Speaker + Air Tag …".
  - Event rules: "A 3-minute demo video is required, showcasing the project in action and **highlighting the use of sponsor-products** for their respective challenges." Code tracks need "a public GitHub repository … along with an online deployed demo".
  - Rubrics: "Each track and challenge has its own judging critera! The rubrics will not be released". The page lists "Judging Criteria: TBD". (verified-on-page)
  - Databricks' community post names Solarify as its DataHacks track winner (search snippet, lead-only: https://community.databricks.com/t5/community-articles/datahacks-2026-university-alliance-in-action-at-ucsd/m-p/155727 ).
- **Project:** https://devpost.com/software/name-yqj3mw ; demo https://datahacks-2026-iota.vercel.app/ ; repo https://github.com/rcwoshimao/datahacks-2026 (linked through the same demo URL in its README).
- **Data and processing (verified-on-page):**
  - Four sources: **SDG&E** consumption by ZIP, **EIA** prices and CO₂ intensity, **NREL** irradiance by ZIP, and **ZenPower** permit data (a sponsor dataset).
  - "52 quarterly CSV files to wrangle, four completely different data schemas".
  - Two models: an opportunity score, and Prophet forecasts of the status quo vs. solar.
  - Delta Tables, Spark DataFrames and Mosaic AI feed a FastAPI backend and a Leaflet ZIP map. Batch processing.
- **Code check (verified-in-source):**
  - `backend/app/databricks.py:69`: `w.statement_execution.execute_statement(… warehouse_id …)`, meaning the backend queries a Databricks SQL Warehouse live.
  - `backend/app/main.py:44-46`: "only allow SELECT statements via this endpoint".
  - `backend/app/main.py:375`: `ST_AsGeoJSON({geom_col})` runs geospatial SQL inside Databricks.
  - `data/solar_opportunity/solar_opportunity_scores_2025.csv`: 13,104 data rows (zip × quarter × sector).
- **Why it won (inferred):** It joined several messy real datasets, including the sponsor ZenPower's, into one geographic score, and the warehouse is visibly queried live.

### B.3 TidalGate: DataHacks 2026, "Challenge: Best Use of Databricks" + Hardware/IoT track
- **Project:** https://devpost.com/software/tidalgate ; repo https://github.com/EkagraAgarwal/UCPU
- **Data and processing (verified-on-page):**
  - The provided **sea-mooring dataset** (Scripps), plus live buoy sensors (IMU, temperature, depth) on an Arduino Uno Q.
  - "We cleaned the data and trained an AI model with Databricks". Rolling features fixed inaccurate predictions: "adding … the mean value of the past three hours".
  - CesiumJS dashboard. Batch training, real-time inference.
- **Code check (verified-in-source):**
  - `python/feature_cols.json:1` holds lag and rolling features (`current_speed_lag1..3`, `current_speed_mean_3h`, `current_speed_std_3h`, `hour_sin/cos`).
  - `python/main.py:25-27,55` loads 1h/2h/3h `joblib` models.
  - **No Databricks code is in the repo.** The notebooks were not committed, so the Databricks claim is page-only.
- **Why it won (inferred):** It used the sponsor-provided dataset, clear feature engineering, and hardware that closes the loop. It shows the Databricks judges accepted "trained there" without committed notebooks.

### B.4 RippleEffect: HopHacks Fall 2025 (JHU), "Social Good Track: Best Application to Support Philanthropic Goals by **Bloomberg**"
- **Event and prize:**
  - https://hophacks-fall-2025.devpost.com (12–14 Sep 2025). Challenge text: "This will be awarded to the best application to support philanthropic goals. **Criteria will include how much the application aims to help people and improve lives, technical difficulty, and technical polish.**"
  - Prize: "1st Place - up to 4 pairs of Beats Solo headphones". The other winner was DOM (hands-free web accessibility). (verified-on-page)
- **Project:** https://devpost.com/software/rippleeffect-k5i2vd ; repos https://github.com/msavya/hophacks2025 , https://github.com/eshavignesh123/hophacks25-extension
- **Data and processing (verified-on-page):** A Chrome extension offers round-up donations at checkout. Stripe handles payments and Firebase holds user data. "the Gemini API was heavily used to filter our data, including making sure legitimate nonprofit names were used and finding nearby nonprofits based on user location". It also has gamified badges.
- **Code check (verified-in-source):**
  - `backend/routes/charities.js:13` posts to `https://api.gemini.com/v1/verify_charity`, which is not a Google Gemini endpoint (inferred: that path probably never worked).
  - `src/MapTab.tsx:115-137` hard-codes charity coordinates for NYC, LA and Chicago.
  - `api/add-charity.ts:1-10` does call `gemini-1.5-flash` through `@google/generative-ai`.
- **Why it won (inferred):** Bloomberg's philanthropy prize judged impact and polish, not data rigour. This is the counter-example: a data-company brand does not always mean a data-handling rubric.

### B.5 Aorta: AI Partner Catalyst (Google Cloud), "Confluent Challenge: First Place" ($12,500)
- **Event and prize:**
  - https://ai-partner-catalyst.devpost.com (17 Nov–31 Dec 2025, online, open to all, not student-only). Confluent Challenge: "**Unleash the power of AI on data in motion!** Your challenge is to build a next-generation AI application using Confluent and Google Cloud. Apply advanced AI/ML models to **any real-time data stream** to generate predictions, create dynamic experiences, or solve a compelling problem in a novel way. Demonstrate how real-time data unlocks real-world challenges with AI."
  - Judging: Technological Implementation ("Does the interaction with Google Cloud and Partner services demonstrate quality software development?"), Design, Potential Impact, Quality of the Idea. It needs a public repo with an OSI licence and a 3-minute video. (verified-on-page)
- **Project:** https://devpost.com/software/aorta-real-time-hospital-admission-sepsis-monitoring ; repo https://github.com/hhtzuhh/Aorta (MIT)
- **Data and processing (verified-on-page):**
  - The **MIMIC-IV** clinical database is replayed in chronological order by "a time-coordinated simulation engine" into **7 Kafka topics on Confluent Cloud** (Schema Registry, Flink pool).
  - A stateful consumer computes SOFA scores. **XGBoost on 23 features** predicts sepsis 6 h ahead.
  - Gemini RAG runs over sepsis guidelines in MongoDB Atlas Vector Search. SSE pushes to a D3 dashboard.
  - Terraform provisions the infrastructure. **Simulated real-time** from historical data.
- **Code check (verified-in-source):**
  - `terraform/main.tf:181-191` declares `confluent_kafka_topic "admissions"` with `topic_name = "hospital-admissions"`, `partitions_count = 3` and `"retention.ms" = "604800000"  # 7 days`, repeated for alerts, labs and vitals (`:202-254`).
  - `ml/training/train_local.py:4` "Trains XGBoost model on **MIMIC-IV demo** SQLite database". The demo subset is small (inferred: about 100 patients in the public demo).
- **Why it won (inferred):** Streaming is the actual core here, not a label. It uses a real public dataset replayed as a stream, Confluent features beyond producing messages (Terraform, Schema Registry, Flink), stateful features, and a clear latency story.

### B.6 Veryfi: HackLondon 2026 (KCL/UCL), "[MLH] Best Use of MongoDB Atlas" (UK, student)
- **Event and prize:**
  - https://hacklondon-2026.devpost.com . Challenge text is quoted in A.1. MLH judging points to https://www.mlh.com/events/hacklondon-16/prizes . Prize: M5Stack IoT Kit. (verified-on-page)
- **Project:** https://devpost.com/software/veryfi ; repo https://github.com/fid098/HackLondon2026
- **Data and processing (verified-on-page):**
  - URLs, text and media are scraped and analysed by Gemini "agent debates" plus CNN/RoBERTa models.
  - "MongoDB Atlas — stores users, reports, embeddings; supports **vector search, geospatial queries, aggregation pipelines, and change streams**." It has a misinformation **heatmap** dashboard.
  - They hit Gemini rate limits and "implemented throttling and caching".
- **Code check (verified-in-source):**
  - `apps/backend/app/routes/heatmap.py:206-215` runs a `$match` on a 24 h timestamp window, then `$group` by label with `$arrayElemAt` on GeoJSON `location.coordinates`, `$sum` count and `$avg` confidence. `:250-266` compares the current and previous windows for trends.
  - `:195` "All helpers return [] / None on any error so the route falls back to seed data"; `apps/backend/scripts/seed_heatmap_events.py` exists. So the heatmap data is **seeded (synthetic)**, not collected.
  - Commits: 26 on 21 Feb, 52 on 22 Feb, 2 later in June 2026 (the repo was touched after the event).
- **Why it won (inferred):** It used many Atlas features (GeoJSON, aggregation, vectors) visibly in one dashboard, with graceful fallback. MLH judges reward breadth of the sponsor tech more than data provenance.

### B.7 GeoStar: HackPrinceton Fall '26, "[MLH] Best Use of MongoDB Atlas"
- **Event and prize:** https://hackprinceton-fall-26.devpost.com (13–15 Nov 2026). It used the same MLH Atlas text ("for you and each member of your group"). (verified-on-page)
- **Project:** https://devpost.com/software/geostar-5engd7 ; repo https://github.com/sudarshan-krishnan/GeoStar_PtonHacks_2026
- **Data and processing (verified-on-page):**
  - Site intelligence for data centres and housing. It screens "158 real CoStar p[arcels]" against FEMA NFHL, WRI Aqueduct, OSM and ERCOT prices, plus live ESP32 hardware telemetry.
  - Rule: "**models explain, code computes**". "every number is labelled Measured, Sourced, Estimated, Simulated or Unknown".
- **Code check (verified-in-source):**
  - `services/api/app/sponsors/mongodb/atlas.py:185-186` creates a **time-series collection** `grid_telemetry` (`timeField "ts"`, `granularity "seconds"`, `expireAfterSeconds=7 * 86400`).
  - `:189` creates a `2dsphere` index on `sites.loc`. `:442-444` runs Atlas `$search` + `$searchMeta` facets. `:454` runs `$vectorSearch` over Gemini embeddings.
  - `services/api/app/sponsors/mongodb/store.py:155` runs a `$near` geo query.
  - `docs/sponsors/mongodb.md:9-14`: "Atlas holds app state and derived facts keyed by CoStar ids, never CoStar's descriptive payloads", which is data governance for a licensed dataset.
- **Why it won (inferred):** It showed the deepest Atlas use found (schemas, time-series with TTL, geo, search, vector) and explicit licensing discipline. Provenance labels on every number make the data handling auditable.

### B.8 THE GATE: Agentic Cinema (Google Cloud), "Clickhouse - 1st Place" ($7,500)
- **Event and prize:**
  - https://agentic-cinema.devpost.com (27 Jul–9 Sep 2026, online, open). Brief: "Build a functional agent—powered by Gemini and Google Cloud Agent Builder—that integrates a Partner Entity's product or MCP to power a real media & entertainment workflow." "Dominate Your Track: Show off a **deterministic, multi-step agent** that solves enterprise friction."
  - The repo "must demonstrate actual runtime use of Google Cloud and your chosen Partner's service (**imported and called in code, not just named in the README**)".
  - Judging: Technological Implementation ("how effectively does it use Google Cloud and the Partner services"), Design ("a complete, coherent product experience not just a technical proof of concept"), Potential Impact, Quality of the Idea ("a creative, non-obvious use"). The judges included ClickHouse's Director of Engineering AI/ML. (verified-on-page)
- **Project:** https://devpost.com/software/the-gate-yx5z2b ; repo https://github.com/javaonboard/the-gate (Apache-2.0)
- **Data and processing (verified-on-page):**
  - A day's camera footage is cut into takes by Gemini agents, which log and group them. ClickHouse holds takes, coverage and "four years of this crew's data". Casting uses ClickHouse vector search over face embeddings.
  - A numpy Monte Carlo runs the day 10,000 times. "computation for facts, agents for judgment"; the final agent "never invents a number".
- **Code check (verified-in-source):**
  - `data/marts.sql:1-6`: "expose curated marts, not raw tables, so the model works from stable canonical definitions".
  - `agents/historian.py:63-64`: `SELECT quantilesTDigestMerge(...)(durations), countMerge(n) FROM {DB}.setup_duration_stats`, using aggregate-state tables.
  - `agents/casting.py:444-447`: `SELECT character_id, cosineDistance(embedding, %(e)s) AS d … ORDER BY d ASC LIMIT`.
  - Historical data is seeded (`data/seed_demo.py`, "built from eighteen productions" per `agents/historian.py:4`). Inferred: synthetic history.
- **Why it won (inferred):** It used ClickHouse-native analytics (aggregate states, quantiles, vector distance), followed the vendor's own "marts for agents" guidance, and kept numbers deterministic.

### Leads not completed (lead-only)
- **Palantir:** Projects at Los Altos Hacks X (a high-school event) tag `palantir-aip`/`palantir-foundry` (e.g. LegalOS, Runic 1st place), but none won a Palantir-named prize. Gallatin AI won the Cerebral Valley National Security Hackathon on Palantir Maven (not a student event). No student Palantir prize was found.
- **Elastic:** No Elastic-named prize winner was found. Fire Drill (Cal Hacks 13.0) used `elastic-agent-builder` but won Apify's prize.
- Other ClickHouse winners: Agentic Cinema 2nd Retention Room and 3rd Locaish. Other Confluent winners: AI Partner Catalyst 2nd VitalFlow Radar and 3rd Woodpecker. Not read.

### Patterns across data-company winners (inferred, from B.1–B.8)
1. **Real, named, public datasets, and the messy part is stated.** CholecT50, MIMIC-IV, SDG&E/EIA/NREL and the sponsor's own data all appear. Winners quantify size: 50 surgeries, 13,000 clips, 52 CSVs, 23 features, 158 parcels.
2. **The sponsor product does a job the app depends on**, using vendor-specific features rather than generic CRUD:
   - Databricks: MERGE, MLflow, Genie
   - Confluent: topics with retention via Terraform
   - ClickHouse: aggregate states, cosineDistance
   - Atlas: 2dsphere, time-series TTL, `$vectorSearch`
3. **Deterministic numbers, LLM only for explanation.** GeoStar ("models explain, code computes"), THE GATE ("never invents a number") and the Serac winners all do this.
4. **Geospatial is common**: radius queries, ZIP or postcode scoring, heatmaps (Serac winners, Solarify, Veryfi, GeoStar).
5. **Fallbacks and provenance**: fixture or seed fallback (Surg+F, Veryfi), provenance labels (GeoStar) and licence discipline (GeoStar; Serac's IBex rule).
6. **Weak spots judges tolerated**: seeded or synthetic data (Veryfi heatmap, THE GATE history), notebooks not committed (TidalGate), a possibly broken API path (RippleEffect). Judges mostly see the demo, not the repo.

---

## Search scope
- **KCL Devpost pages fetched:** fyh2025, firstyearhack-2025-2026, culturehack2024, hacklondon-2026 (overview + 4 gallery pages), and hacklondon-24 (UCL, Mar 2024, no winners flagged). hacklondon-2025 returned 403 (private).
- **Searches:**
  - Devpost hackathon API: "hacklondon", "hack london", "kcl", "hacklondon 2025".
  - Huzzle HackLondon 2025 page.
  - GitHub code search "HackLondon 2025".
  - Web search for HackLondon 2025 winners (none published).
- **Not covered:** KCL Tech's other events, Tech4Good (Feb 2025) and HackSprint '25 (Mar 2025).
- **Winner pages parsed:** all 28 KCL winner project pages.
- **Part B:**
  - Devpost software search (8 pages each) for databricks, palantir, bloomberg, confluent, kafka, clickhouse, elastic, elasticsearch, "mongodb atlas".
  - Prize lists of madhacks-fall-2026, datahacks-2026, datahacks-25, hophacks-fall-2025, ai-partner-catalyst, agentic-cinema, ic-hack-25/26, durhack-2024/2025/26, hackprinceton-fall-2025/fall-26/spring-26.
  - All winner pages of 5 events were fetched to match prize labels.
  - Web searches for Databricks, Bloomberg, Palantir, Confluent and ClickHouse prizes.
- **Repos:** read with `gh api` contents and trees only, nothing cloned. The scratchpad `qrepos-data/` dir was not needed.
- **Quant leads for the quant worker (lead-only, not analysed):**
  - IC Hack 26: "HRT - Best Use of Data for Predictions & Decision-Making", "IMC Trading - Best Use of Technology to Create Positive Social Impact", "Marshall Wace - Emergent Behaviour".
  - IC Hack 25: "Marshall Wace - Exploring a Chain of Events".
  - DurHack X (2025): G-Research "Create a crystal ball that can predict something unique…", Marshall Wace "Bridging Worlds" (with OAG flight data), plus MLH Snowflake.
  - DurHack 2024: Marshall Wace "Chain of events" ("Create a high-throughput data processing pipeline").
  - HopHacks 2025: Marshall Wace "Best Data Visualization" (winners Daily InDigest, Syne, Green Web Current).
- **Not verified:** MLH's own Atlas judging page, ClickHouse track-specific text (the resources page only lists partners), and whether the Veryfi June 2026 commits changed the judged code.
