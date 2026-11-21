# HRT (Hudson River Trading) sponsor-prize winners, with Jump Trading / DRW coverage notes

Research date: 2026-11-21. Read-only. Evidence labels: **verified-on-page** (Devpost or firm page read on this date), **verified-in-source** (repo file `path:line`, read on GitHub via `gh`/raw, not executed), **inferred**, **lead-only**.

Result: **9 HRT prize winners** (7 first-place, 2 runner-up/honourable mention) at 6 events from 2023 to 2026, 4 of them in the UK. Jump/DRW were not needed to reach 7. None of the 496 2023–2026 Devpost event pages I scanned mentioned Jump Trading or DRW (see Search scope).

## Per-project table

| # | Event (dates) | Exact prize name (Devpost) | Project | Devpost | Repo | Data used | Core technique | Code check |
|---|---|---|---|---|---|---|---|---|
| 1 | IC Hack 26, Imperial, London (31 Jan–1 Feb 2026) | HRT - Best Use of Data for Predictions & Decision-Making | WildFire | https://devpost.com/software/wildfire-rcz2xb | https://github.com/ltanak/ICHack26 | Historical California fire snapshots (GeoPackage, batch), USDA vegetation density, weather/wind, CalFire API, satellite imagery | Stochastic percolation cellular automaton + Monte Carlo burn-probability maps; mitigation what-ifs; Temporal Fusion Transformer pipeline | verified-in-source |
| 2 | IC Hack 26 | HRT - Best Use of Data for Predictions & Decision-Making (Honourable Mention) | SafeStep | https://devpost.com/software/safestep-6ci719 | https://github.com/albertding19/SafeStep | UK Police crime API, Google Places/Yelp reviews, news, user incident reports (near-real-time) | Gaussian-kernel spatial scoring in PostGIS, time-of-day multipliers, DistilBERT text-to-signal, route ranking | verified-in-source |
| 3 | OxHack 2026, Oxford (24–25 Oct 2026) | [HRT] Best Use of Data for Predictions and Decision Making | Live London | https://devpost.com/software/live-london-f9krhx | https://github.com/t-strachota/livelondon | Live TfL bus GPS (SIRI-VM, polled every 15 s), TfL trains, TomTom traffic-flow tiles, OSM road graph, traffic cameras | Real-time feed ingestion + seeded agent-based car simulation with A* rerouting on closures; congestion/economic-cost estimates; tests | verified-in-source |
| 4 | OxHack 2026 | [HRT] Runner Up: Best Use of Data for Predictions and Decision Making | wAIsted | https://devpost.com/software/waisted-m0ylrd | https://github.com/yctianr/OxHack-26 | Thames Water discharge/flow data, EA hydrology API, Open-Meteo historical weather (batch, hourly) | Physical water-balance model fitted to treated flow (not to spills), rolling-origin back-test, Brier/AUC + bootstrap vs. GBM baseline, 7-day forecast | verified-in-source |
| 5 | TreeHacks 2025, Stanford (15–16 Feb 2025) | Hudson River Trading: Best Use of Data Hack (HRT-branded JBL earbuds per team member) | STIK_GUI (Spheroid Tumor Invasion Kinetics) | https://devpost.com/software/tumor-invasion-kinetics-gui | https://github.com/sonnyloweus/STIK_GUI | Lab microscopy images of tumour spheroids (well plates, batch), CVAT annotations | YOLOv8 instance segmentation; PyQt GUI with inference on a QThread; kinetics plots | verified-in-source |
| 6 | TreeHacks 2024 (17–18 Feb 2024) | HRT: Best Use of Data (4x HRT Keyboard + Mouse) | BinoSoRAs (Devpost slug "watchdog") | https://devpost.com/software/watchdog-onxyge | https://github.com/Willy-Chan/Bino-SoRAs (404 today) | Real vs. AI-generated video clips (batch) | FLAVR frame interpolation + Fréchet Inception Distance threshold (Binoculars idea moved to video); reported 91.67% accuracy | repo not accessible (404); page only |
| 7 | TreeHacks 2023 (18–19 Feb 2023) | Best Use of Data Hack by HRT: 4 x Access to online HRT VIP Swag Store & $150 Amazon Gift Card | ShipSense.ai | https://devpost.com/software/shipsense-ai-novel-data-augmentation-protocol | https://github.com/SohamGovande/treehacks-2023 | 68 satellite ship images + synthetic images; 55,000+ AIS vessel records | Stable Diffusion/GAN data augmentation for class imbalance, CNN/R-CNN ship detector (96% claimed), AIS dark-vessel hotspot analysis, React globe dashboard | verified-in-source (README + preprocessing) |
| 8 | HackBelfast (NI), Belfast (25–26 Apr 2026) | Best Use Of Data - Hudson River Trading (£1,000 cash) | Belciti / BIMS-5 | https://devpost.com/software/bims | https://github.com/M-Masood4/Bims-5 | ~10 years (2016–2026) of Belfast open data: planning stats, census, bikes, air quality (42 MB CSV), NDVI/NDBI rasters (~40–48 MB each), OSM, NIE electricity assets (batch) | ETL into a 308-cell grid, provenance manifests, weighted linear-trend forecasts per cell, scenario "what-if" planners on Mapbox, smoke tests | verified-in-source |
| 9 | Columbia Data Science Society Datathon Fall 2023, NYC (7–8 Oct 2023) | HRT Track Prize | Dynamic Pricing for New York Subway Fares | https://devpost.com/software/dynamic-pricing-for-new-york-subway-fares | none (Colab notebooks + slides linked) | NYC subway ridership datasets ("enormous sizes", batch) | ARIMA ridership forecast → demand-based price factor; station clustering; simulated revenue/fare outcome | no repo; Colab not checked |

## Prize text and judging criteria (verified-on-page, event Devpost homepages)

- **TreeHacks 2023 / 2024 / 2025** (https://treehacks-2023.devpost.com/, https://treehacks-2024.devpost.com/, https://treehacks-2025.devpost.com/), and **HackCMU 2023** (https://hackcmu-2023.devpost.com/), use the same HRT text: "Effective use of data is important to the decisions we make at Hudson River Trading, and we're always looking for innovative new ways to strategize with data. This prize will be awarded to the hack that best integrates the use of data into their project." TreeHacks general criteria: Creativity ("makes you say 'wow'"), Technical Complexity ("really running some beautiful code or hardware under the hood"), Social Impact.
- **OxHack 2026** (https://oxhack-2026.devpost.com/): "[HRT] Best Use of Data for Predictions and Decision Making — Use your creativity to make the best use of data." Runner-up: "Runner Up to the HRT prize". General criteria: Creativity, Technicality, Completeness, Presentation/Hackathon Spirit.
- **IC Hack 26** (https://ic-hack-26.devpost.com/): only the title "HRT - Best Use of Data for Predictions & Decision-Making" plus an Honourable Mention. No challenge body on Devpost, and ichack.org did not expose one. General criteria: Creativity, Utility, Technical Achievement.
- **HackBelfast NI 2026** (https://hackbelfastni.devpost.com/): "Best Use Of Data - Hudson River Trading £1,000 in cash, 1 winner". No challenge body. Criteria: Technical Execution, Innovation & Problem Fit, Product & UX, Real-World Potential, Pitch & Communication.
- **CDSS Datathon Fall 2023** (https://cdss-datathon-fall-2023.devpost.com/): "Tracks: HRT Sponsored Track …; HRT Track Prize, 1 winner". Track body is not on the page. Criteria: Technical Knowledge (50%), Creativity (30%), Presentation (20%).

The trend is that HRT's prize wording moved from "best integrates the use of data" (2023–2025, US) to "Best Use of Data **for Predictions & Decision-Making**" (2026, UK: IC Hack, OxHack) (verified-on-page). Several UK 2026 winners are therefore forecast-and-decide tools, not dashboards (inferred).

## Project details

### 1. WildFire: IC Hack 26, HRT winner
- **Data and processing:** the page lists Python/Flask + React, satellite images, the CalFire API ("reverse engineering Fire Department API using isactive=true"), USDA vegetation density, wind/weather, and Claude for summarising historical events (verified-on-page). The repo holds dozens of daily AM/PM `.gpkg` fire snapshots from 2012 (`backend/Datasets/Snapshot/2012_Snapshot/`, about 150–430 KB each). Repo size is about 2.2 GB, almost all data (verified-in-source, tree listing). The data is batch/historical, not live.
- **Code check:**
  - `README.md:11`: "mathematical models … using statistical techniques such as Monte Carlo and Percolation models".
  - `backend/historical_sim/simulation.py:91` wind multiplier (downwind ×2·strength). `:147` spreads only `if np.random.rand() < spread_prob`. `:177` `monte_carlo_simulation(n_runs, …)`. `:220` `burn_probability = burn_counts / n_runs`.
  - `backend/tft_data_pipeline/train_tft_model.py:30` imports `TemporalFusionTransformer` from pytorch_forecasting.
  - The "C++ compiled Python modules" challenge on the page was not checked.
- **Why it won (inferred):** it turns historical data into a probability distribution, not a single answer, and lets users test decisions (fire breaks/retardant) against it. That matches "predictions & decision-making" exactly.

### 2. SafeStep: IC Hack 26, HRT Honourable Mention
- **Data and processing:** UK Police API crime data, Google Places/Yelp reviews, news, and user reports go into PostgreSQL+PostGIS. Reports are turned into category/severity signals with DistilBERT. Scores use Gaussian distance weighting and temporal multipliers, and Google Directions alternatives are ranked by safety. The heatmap was precomputed once at fixed resolution after per-zoom recomputation proved slow. Mock data was seeded by hashing lat/long (verified-on-page).
- **Code check:**
  - `backend/app/services/spatial_scorer.py:29` "weight = exp(-0.5 * (distance / bandwidth)^2)".
  - `backend/app/ml/sentiment.py:17` `MODEL_NAME = "distilbert-base-uncased-finetuned-sst-2-english"`.
  - `backend/app/services/uk_crime_ingestion.py:26` `BASE_URL = "https://data.police.uk/api"`.
  - A `backend/tests/test_spatial_scorer.py` file exists (tree listing).
  - The repo has only 2 commits, so the history is squashed.
- **Why it won (inferred):** a clean multi-source pipeline with a stated scoring model, plus a written account of data problems (pixel vs. geographic smoothing, synthetic test data).

### 3. Live London: OxHack 2026, HRT winner (also won the Zed "Built with Delta" prize)
- **Data and processing:** live TfL bus/train positions, TomTom traffic density/speed/flow, OSM roads converted to a drivable graph, and camera feeds. Users close a line or road, and a simulation reroutes commuters and estimates congestion and economic cost (verified-on-page).
- **Code check:**
  - `lib/feed.mjs:4` `POLL_MS = 15_000`. `:24` keeps only TfL operator (`TFLO`) vehicles from the SIRI VehicleMonitoringDelivery.
  - `lib/car-sim.mjs:50` seeded `mulberry32` RNG (reproducible runs). `:111` "Detour search (A*)" for closures.
  - `lib/simulation.mjs:122` "may start from a labelled fallback when TomTom is unavailable". `:291` TomTom flow tiles "labelled live / stale / fallback".
  - `README.md:77` movement "never extrapolates beyond the latest fix". `:68` lists `npm test`, `test:sim`, and Playwright browser tests.
  - Commits run 24–25 Oct 2026, inside the event window.
  - A committed `.env` exists; it was not opened.
- **Why it won (inferred):** truly real-time data, honest freshness labelling, and a counterfactual simulation that answers a decision question ("what if we close this road?").

### 4. wAIsted: OxHack 2026, HRT Runner-Up
- **Data and processing:** the Devpost page says 22 discharge points near Oxford, rainfall → spill volume model, and a bacteria-concentration heatmap. Data came from the Thames Water API, EA hydrology and Open-Meteo history, and the team says it used Claude to locate and clean data (verified-on-page).
- **Code check:**
  - `README.md:30` says "52 sewage works … It learns only from how much water each works treated, never from its spill records".
  - `scripts/model/wb.py:1` hourly water balance "Fitted to measured treated flow, not to spills". `:13` capacity = "95th percentile of daily treated flow", checked against spill records.
  - `scripts/model/04_stat_evaluate.py:9` "rolling origin (fold A … fold B …)".
  - `scripts/model/08_wb_evaluate.py:27` Brier score. `:31` bootstrap difference. `:51` per-site ROC AUC vs. a GBM baseline.
  - Caveat: commits continue to 26 Oct 2026, after the event, and the README's "52 works" differs from the page's "22". Some of this rigour may postdate judging.
- **Why it placed (inferred):** a defensible held-out evaluation and a model that avoids training on its own target (leakage).

### 5. STIK_GUI: TreeHacks 2025, HRT winner
- **Data and processing:** hundreds of lab spheroid images annotated in CVAT, YOLOv8 segmentation (claimed precision 99.739%, mAP50-90 97.369%), and a PyQt GUI that keeps the model on a separate thread (verified-on-page). Data is batch images, with roughly 1–26 MB JPEGs in the repo (verified-in-source, tree).
- **Code check:** `stick_gui/ProcessorThread.py:4` imports `QThread, pyqtSignal`, `:6` `from ultralytics import YOLO`, `:14` `class ProcessWorker(QThread)`, `:56` `self.model.predict(source=image_file)`. Commits run to 1 Mar 2025, after the event.
- **Why it won (inferred):** a real lab dataset, a measured model, and a usable pipeline that replaces manual tracing.

### 6. BinoSoRAs ("watchdog"): TreeHacks 2024, HRT winner
- **Data and processing:** each suspect video is interpolated every 8 frames with FLAVR, then compared with the original using FID. The team chose a threshold of 52.87 and reports TNR 78.5% and accuracy 91.67%. It was the team's first hackathon. Stack: PyTorch, TensorFlow, OpenCV, NumPy, scikit-learn (verified-on-page).
- **Code check:** `github.com/Willy-Chan/Bino-SoRAs` returns 404 today (lead-only for code).
- **Why it won (inferred):** a research-grade idea (adapting a January 2024 paper) with a quantified threshold and error rates.

### 7. ShipSense.ai: TreeHacks 2023, HRT winner
- **Data and processing:** 68 original satellite ship images were expanded with fine-tuned Stable Diffusion/GANs to fix class imbalance, a CNN/R-CNN was trained (96% claimed), and 55,000+ AIS records were analysed for dark-vessel hotspots shown on a React/WebGL globe (verified-on-page).
- **Code check:**
  - `README.md:14` "Everything in this project was completed during TreeHacks". `:20` "We only used **68** original images". `:40` "55,000+ AIS radar records".
  - `data_scripts/ship_preproc.py:45` image cropping for preprocessing.
  - `main.py:31` also calls OpenAI `text-davinci-003` in a Streamlit app.
  - The AIS notebooks (about 14 MB) were not opened.
- **Why it won (inferred):** it treated data scarcity as the core problem and solved it with augmentation, then validated the result.

### 8. Belciti / BIMS-5: HackBelfast 2026, HRT "Best Use Of Data" (£1,000)
- **Data and processing:** about 15 Northern Ireland and UK open-data sources (OpenDataNI, NISRA, Belfast City Council, data.gov.uk, Air Quality NI, Google Earth Engine rasters, OSM/Overpass, Kaggle, SONI). The team cites scattered sources and normalisation as the main work, and used Git LFS because data exceeded 100 MB. The project is Dockerised with a Mapbox UI and PostgreSQL. The team was 2 first-years and 1 third-year (verified-on-page).
- **Code check:**
  - `readme.md:3` "deterministic grid metrics, Git-style city commits, evidence/confidence panels, data provenance".
  - `docs/forecast_model_card.md:6` "Belfast … replay grid (308 cells)", forecast horizon 2026–2036.
  - `scripts/train_forecast_model.py:196` `def slope(...)`. `:217` the forecast is `slope(recent)*0.58 + slope(long)*0.28 + event/metric boosts`, a weighted linear trend, not ML.
  - `tests/test_forecast_artifacts.py` exists.
  - "Transformer" in `scripts/build_transformer_model.py:35` means electricity transformers (NIE Networks assets), not neural networks.
  - Committed `.env` and `.claude/settings.local.json` exist; they were not opened.
- **Why it won (inferred):** breadth and care in data integration (provenance, confidence, model cards) over model sophistication. This is the closest analogue to a first-year team.

### 9. Dynamic Pricing for NYC Subway Fares: CDSS Datathon Fall 2023, HRT Track Prize
- **Data and processing:** an ARIMA ridership forecast drives a hybrid dynamic-pricing factor, with station clustering so nearby stations don't diverge. A simulation claims lower local fares plus more MTA revenue. The team reports problems merging two large, non-overlapping datasets and names EDA as their key lesson (verified-on-page). Colab and TensorFlow.
- **Code check:** no GitHub repo. Colab notebooks are linked from the page, not opened.
- **Why it won (inferred):** a forecast connected directly to a pricing decision, with a simulated outcome.

## What HRT says it looks for (verified-on-page unless marked)

- https://www.hudsonrivertrading.com/student-opportunities/ :
  - "A typical day involves applying rigorous statistical analysis to vast quantities of market and financial data"
  - Algorithm Developers "rely on a mix of quantitative (math, stats, data analysis) and technical (C++/Python programming) skills"
  - "Software Engineers bring deep knowledge of C++, OS internals, CPU architecture, and networking hardware and protocols."
  - "Data is a cornerstone of HRT's trading strategies"
  - "HRT Data Scientists focus on extracting useful information from the vast volume of data available in the world."
  - "the majority of HRTers join us with no previous finance experience."
  - Interviews: "a coding test, 1-2 technical phone screens, and an onsite multi-round final interview".
  - The page does not mention hackathons.
- https://www.hudsonrivertrading.com/hrtbeat/how-hrt-thinks-about-data/ (Francisco Rivera, 1 Feb 2022):
  - "if the data they ingest is fundamentally flawed, they are destined to fail."
  - "'Garbage in, garbage out' sums it up."
  - "stay vigilant and understand the provenance of the data we work with"
  - "good engineering practices are critical to both research with and productionizing data, particularly when the datasets get large."
- Algorithm Development intern posting, Summer 2026 (third-party mirror https://builtin.com/job/algorithm-development-quant-research-internship-summer-2026/6747075, removed 3 Feb 2026, so this is lead-quality):
  - "Use machine learning and time series techniques to derive novel insights on market behavior from large and complex datasets"
  - "Build predictive models for financial markets using a combination of market and non-market data"
  - "Experience with statistical analysis, numerical programming, or machine learning in Python, Pandas/Numpy, R, and/or MATLAB"
- https://www.hudsonrivertrading.com/careers/ : "curious thinkers and eager automators".

Jump Trading and DRW: not covered. No sponsor prize for either firm was found in the scanned Devpost set, so I did not collect their recruiting pages.

## Patterns across the winners (inferred)
- None of the 9 winners is a trading, order-book, or low-latency C++ project. HRT rewards rigorous use of real-world data in any domain: health, transport, environment, civic planning, media.
- Winners combine messy public or real datasets (often several), state the method (Monte Carlo, Gaussian kernels, water balance, ARIMA, YOLO, FID), and most quantify their results (accuracy, Brier/AUC, burn probability, revenue simulation).
- The 2026 UK wording rewards prediction plus decision: what-if simulators (WildFire, Live London, Belciti, wAIsted) took 4 of the 5 UK prizes.
- The strongest repos show data hygiene: provenance and freshness labels (Live London, Belciti), leakage-aware evaluation (wAIsted), seeded reproducibility (Live London), and tests (SafeStep, Live London, Belciti). This lines up with HRT's "garbage in, garbage out" and provenance message.

## Search scope
- Devpost hackathon API (`devpost.com/api/hackathons?search=…&status[]=ended`) queried with about 55 terms: UK/US university hackathon names plus generic words (quant, trading, fintech, imperial, cambridge, oxford, durham, …). That returned 1,097 events. For the 496 events with 2023–2026 dates, I fetched each homepage and regex-matched `hudson river|HRT|jump trading|DRW`.
- Hits: hackcmu-2023, hackcmu-2024, treehacks-2023/2024/2025, cdss-hackathon-2023, cdss-datathon-fall-2023, ic-hack-26, oxhack-2026, hackbelfastni, and hacktheburghxiii (HRT listed as a judge only).
- No Jump or DRW hits, including hackillinois-2023…2026, wildhacks, uchicago-ktp-hackdays-2026 and bigredhacks. HackIllinois Devpost pages may not list sponsor prizes, so Jump at HackIllinois remains **lead-only**.
- For each hit event I scanned every project page in the gallery for a "Winner" line containing HRT, Hudson or "use of data".
- **Lead-only (winner not tagged on Devpost):**
  - HackCMU 2023 "Best Use of Data" (mechanical keyboards) and HackCMU 2024 "Best Use of Data (Hudson River Trading)" (galleries of 54 and 7 projects, with no winner badges).
  - CDSS Hackathon Feb 2023 "Best Overall Award … best use of data, sponsored by Hudson River Trading".
  - Hack the Burgh XIII (Nov 2026): HRT judges.
  - Not found on Devpost: IC Hack 24/25, Hack Cambridge, DurHack 2023–2026, HackLondon 24/26 and TreeHacks 2026 had no HRT text.
- Repos were read via the `gh` API and raw.githubusercontent file fetches, saved to `/private/tmp/claude-501/-Users-dust-Projects-first-year-hack-new-project/4ebaf192-5440-4dc8-9335-94f7adcd7ba0/scratchpad/qrepos-hrt/`. Nothing was cloned whole and nothing was executed. `.env`/settings files were not opened.
- Web search was used only for HRT careers pages. Generic web search for Devpost HRT winners returned nothing useful.
- Uncertainty:
  - Repos may have been edited after judging (wAIsted, STIK_GUI).
  - Prize challenge bodies for IC Hack 26 and HackBelfast are not published on Devpost.
  - The Devpost API search terms may miss events, for example ones named only by sponsor.
