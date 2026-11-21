# UK/Europe quant and trading sponsors at UK student hackathons: winning projects

Research date: 2026-11-21. Slice: Optiver, IMC, G-Research, QRT, Man Group, Marshall Wace, Squarepoint, XTX, Flow Traders, Maven, Da Vinci, Winton and Bloomberg (London) at UK student hackathons.

Labels:
- **verified-in-source (path:line):** read in the repo through `gh api`. Nothing was run.
- **verified-on-page:** read on the Devpost project or prize page, or on the sponsor's own page.
- **inferred:** my own reading.
- **lead-only:** came from a search snippet or a page I could not confirm.

The Devpost winner lists came from each hackathon's `project-gallery` JSON-LD `award` field. Prize texts came from the `#prizes` section on each hackathon's main Devpost page.

## Count

- **35** winning projects for sponsors in this slice, verified-on-page from Devpost award badges (full list in Appendix A).
- **18** are written up in detail below.
- **12** had their code checked in a public repo.

Sponsors that had UK student-hackathon prizes on Devpost:

| Sponsor | Prizes found |
|---|---|
| QRT | 10 |
| Marshall Wace | 12 |
| Optiver | 6 |
| IMC | 2 (IC Hack 26) |
| G-Research | 1 (DurHack X) |
| Squarepoint | 1 (HTB V) |
| Bloomberg | 1 (Hack Cambridge Recurse, 2017) |

No Devpost prizes turned up for Man Group, XTX, Flow Traders, Maven, Da Vinci or Winton at these events. Man AHL runs its own Coder Prize instead (lead-only, see Search scope).

## Per-project table

| # | Event (year) | Exact prize | Project | Devpost | Repo | Data | Code check |
|---|---|---|---|---|---|---|---|
| 1 | DurHack X (Nov 2025) | Create a crystal ball that can predict something unique… (G-Research) | Niche Machine | [link](https://devpost.com/software/niche-machine) | [De-Rosa/NicheMachine](https://github.com/De-Rosa/NicheMachine) | Kaggle TikTok songs CSV, Last.fm/AcousticBrainz APIs and live TikTok trending scrape. LightGBM classifier. | yes |
| 2 | DurHack X (Nov 2025) | Meeting in the Middle (QRT) | QRT: Meet in The Middle | [link](https://devpost.com/software/qrt-meet-in-the-middle-cv0mgs) | none | OAG flight schedules and CO2 data from an S3 bucket. Polars, Flask and React. Multi-objective ranking of host cities. | no repo |
| 3 | DurHack 2022 (Nov) | QRT Stock Prediction Model Challenge | Stock Return Prediction Model using ML | [link](https://devpost.com/software/stock-prediction-model) | [RShah033/...](https://github.com/RShah033/Stock-Return-Prediction-Model-using-Machine-Learning) | QRT-supplied tabular data: 20 days of lagged returns and volumes plus sector codes. LightGBM+RF blend with KFold by date. | yes |
| 4 | DurHack 2022 | QRT Stock Prediction Model Challenge | QRT Stock Prediction | [link](https://devpost.com/software/qrt-stock-prediction) | [alexhewey/...](https://github.com/alexhewey/DurHack---QRT-Stock-Prediction) | Same QRT dataset. PyTorch model and missing-data cleaning. | not checked |
| 5 | DurHack 2022 | QRT Visualisation of Market Data Challenge | Fortune Fruits | [link](https://devpost.com/software/fortune-fruits) | [amrenstephenson/durhack-nov-22](https://github.com/amrenstephenson/durhack-nov-22) | Live Binance WebSocket ticker feed and REST klines. Flask server. ESP32 "banana" display. | yes |
| 6 | DurHack 2022 | QRT Visualisation of Market Data Challenge | Distinguished-Orange-Rook | [link](https://devpost.com/software/distinguished-orange-rook) | [pkitazos/distinguished-orange-rooks](https://github.com/pkitazos/distinguished-orange-rooks) | Live Bybit public-trade WebSocket feed, a React hook and Google Charts. | yes |
| 7 | DurHack 2023 (Nov) | Data Extraction and Analysis Challenge (QRT) | QRT Remote Log Analyzer | [link](https://devpost.com/software/qrt-remote-log-analyzer) | [eskalVAR/qrt_log_viewer](https://github.com/eskalVAR/qrt_log_viewer) | Logs streamed from QRT's generator binary. fs.watch, Redis hash indexes and a Node web UI. | yes |
| 8 | DurHack 2023 | Data Extraction and Analysis Challenge (QRT) | Log Analysis and Data Extraction Application | [link](https://devpost.com/software/log-analysis-and-data-extraction-application) | [mdxw73/data-extraction-application](https://github.com/mdxw73/data-extraction-application) | Same logs. Python tailing, regex parsing, latency statistics, alerts and Streamlit. | yes |
| 9 | DurHack 2023 | Best Use of Datasets (Marshall Wace) | Torus | [link](https://devpost.com/software/torus-3l1gft) | [akshit-mahendru/Torus](https://github.com/akshit-mahendru/Torus) | arXiv API abstracts, stop-word cleaning, BERTopic topic map and Flask. | yes |
| 10 | Hex Cambridge (Jan 2021) | Optiver Challenge 1st Place | Hex-Howl-Trading | [link](https://devpost.com/software/hex-howl-trading) | [Croydon-Brixton/hex_howl](https://github.com/Croydon-Brixton/hex_howl) | Live Optibook order books for a dual-listed pair (PHILIPS_A/B). Market making with inventory skew and hedging. | yes |
| 11 | Hack the Burgh VI (Mar 2020) | Optiver Challenge | HTB-VI: Optiver trading bot challenge | [link](https://devpost.com/software/htb-vi) | [nout-kleef/HTB-VI](https://github.com/nout-kleef/HTB-VI) | Live UDP market feed for SP/ESX. Ichimoku indicator, SMS alerts and a JS chart front end. | yes |
| 12 | Hack the Burgh VI (Mar 2020) | Optiver Challenge | Stock Analytics | [link](https://devpost.com/software/stock-analytics) | [JuanDelAguila/Hack-the-Burgh](https://github.com/JuanDelAguila/Hack-the-Burgh) | Live UDP feed with a historical buffer. Order-book volume-imbalance signal. | yes |
| 13 | Hack the Burgh 7 (Mar 2021) | Optiver Challenge Prize | The Hedgetrimmers | [link](https://devpost.com/software/the-hedgetrimmers) | none | Optibook basket-vs-components spread, delta-neutral hedging. | no repo |
| 14 | HackTheBurgh X (Mar 2024) | Mastering trading with AI - Optiver | Optiver Challenge - Team LAB (team-014) | [link](https://devpost.com/software/teamlab-optiver-team-014) | none | Optibook market making plus news sentiment ML for directional trades. | no repo |
| 15 | Hack the Burgh V (Mar 2019) | Squarepoint Challenge | PokerStarz poker bot | [link](https://devpost.com/software/pokerstarz-poker-bot) | [brano2/htb2019-pokerstarz](https://github.com/brano2/htb2019-pokerstarz) (404 now) | Monte Carlo hand-strength simulation (treys) and thresholds tuned from simulated histograms. | repo gone |
| 16 | Hack the Burgh VIII (Feb 2022) | Marshall Wace - Giving Back Challenge | Ulwazi - Pricing assistant for small-scale farm produce | [link](https://devpost.com/software/__-pricing-assistant-for-local-farmers) | [OisinNolan/farm_price_api](https://github.com/OisinNolan/farm_price_api) | Claimed live retail and commodity prices, but the code uses mock input. Gurobi binary ILP behind FastAPI. | yes |
| 17 | IC Hack 26 (Jan/Feb 2026) | IMC Trading - Best Use of Technology to Create Positive Social Impact | Smart ePCR | [link](https://devpost.com/software/sjai) | [hugomarfani/ICHack26](https://github.com/hugomarfani/ICHack26) | JRCALC/AEPR clinical JSON assets, sentence-transformer semantic search API and an offline Hive store. | yes |
| 18 | Hack Cambridge Recurse (Jan 2017) | Bloomberg Favourites Prize | Cognitive Crowds | [link](https://devpost.com/software/cognitive-crowds-d4zchg) | [thee-engineer/cambridgehack-2017](https://github.com/thee-engineer/cambridgehack-2017) | Audience video split into frames every 2 s, sent to the MS Emotion and Text APIs, output as an attention time series. | not checked |

## Details

### 1. Niche Machine: G-Research, DurHack X (2025)
- **Challenge text:** "'Create a crystal ball that can predict something unique…' Nintendo Switch 2's for the winning team!" (verified-on-page, https://durhack-2025.devpost.com/#prizes). The page states no judging criteria.
- **Data and processing:** The Devpost page says: "We scraped Tiktok and music data, and did feature engineering to train a light gradient boosting (LGB) model to classify if a song was going to be a hit". An Arduino IR sensor on a 3D-printed ball triggers a prediction (verified-on-page).
  - Batch training data is a Kaggle `tiktok.csv` read at `src/pipelinev3.py:15,49`. It is enriched with Last.fm and AcousticBrainz features (`src/data/load_data.py:31-69`). Live inference input is a trending-video scrape through `TikTokApi` (`src/data/load_data.py:10,104-112`). The API calls are rate-limited with a lock (`src/pipelinev3.py:29-46`).
  - The "viral" label is a hand-written heuristic: 2 of 3 criteria (early engagement vs the artist's mean, listener outperformance, listener/play ratio) (`src/pipelinev3.py:320-337`).
  - Training uses a stratified 80/20 split, LightGBM binary with `is_unbalance`, early stopping and ROC-AUC on the test split (`src/pipelinev3.py:394-425`).
  - All verified-in-source.
- **Caveats (inferred):** Devpost says ">0.95 ROC-AUC on training data". The code prints AUC on the held-out split, but the label is built from listener features that are also related to the inputs, so leakage is likely.
- **Why it won (inferred):** It took the "predict something unique" brief literally, with a niche target and a physical crystal ball. It had a real multi-source pipeline and a proper ML evaluation metric.

### 2. QRT: Meet in The Middle: QRT, DurHack X (2025)
- **Challenge text:**
  - Devpost brief: "QRT has 13 global, collaborative offices… Design a tool or algorithm to identify the best host location (not necessarily an office) - balancing: Carbon emissions from travel / Fairness in travel distance/time. We're partnering with OAG… providing flight schedules and CO₂ emissions data" (verified-on-page, durhack-2025.devpost.com).
  - QRT's challenge site lists the judging criteria: "Correctness - produces a reasonable output given some input parameters; Insight - provides a clear overview of the different trade-offs; Creativity - great visualisation or unique fairness metrics; Polish - clean, presentation-ready outputs and code". Submissions "must include a mechanism for ingesting JSON data to test its abilities during the judging phase". The data sits in the S3 bucket `qrt-durhack2025-challenge-data` (verified-on-page, https://durhack.qwerty.technology/mitm/).
- **Data and processing:** Polars and Flask back end, React/TypeScript front end. Candidate destinations are QRT offices or "the world's 50 largest airports". The score weighs "sustainability, fairness in total travel effort, minimizing overall travel time and span, and reducing jetlag" (verified-on-page). There is no repo.
- **Why it won (inferred):** It scored explicit trade-offs against every judging axis, and Polars suited the large OAG schedule data ("Big data needs big bears").

### 3. Stock Return Prediction Model using ML: QRT, DurHack 2022
- **Challenge text:** Only the prize names are on Devpost (verified-on-page). The notebook restates the task: "The target of this challenge is `RET` and corresponds to the fact that the return is in the top 50% of highest stock returns" (verified-in-source, notebook cell 2).
- **Data and processing:**
  - The input is QRT's tabular files (`x_train_Lafd4AH.csv`, `y_train_JQU4vbI.csv`, `x_test_c7ETL4q.csv`) with 46 features (`durhack-2022-stock-prediction-model.ipynb` cell 3).
  - Feature engineering adds conditional aggregates via `groupby(['SECTOR'|'DATE'|'INDUSTRY'])[RET_1].transform('max')` (cell 6) and uses all 20 lagged RET/VOLUME features (cell 8).
  - Validation is `KFold` over unique dates, so days do not leak across folds (cell 10).
  - The final prediction is a 50/50 LightGBM + RandomForest probability blend, thresholded at each date's median (cell 13).
  - All verified-in-source. The notebook is single-line JSON, so cells are cited instead of lines.
- **Result (verified-on-page):** "improve on the benchmark accuracy of 51.31% by 0.38% to get to a 51.69%".
- **Why it won (inferred):** It beat QRT's own benchmark with leakage-aware validation by date. The team reported a tiny but honest edge rather than an inflated one.

### 4. QRT Stock Prediction: QRT, DurHack 2022
- **Data and processing (verified-on-page only):** PyTorch on the same QRT data. The team listed "Dealing with missing data, deciding what is relevant to the stock value, getting the model the generalise across all the data." The repo was not checked.

### 5. Fortune Fruits: QRT Visualisation of Market Data, DurHack 2022
- **Data and processing:**
  - The Devpost page says: "python application using the websockets library to stream trade data from Binance's WSS API… expose these predictions via a HTTP endpoint… ESP microcontroller into a banana" (verified-on-page).
  - The stream is `wss://stream.binance.com:9443/ws/!ticker_1d@arr`, read on a background thread (`server/finance_streamer.py:24-31`). Candles come from 1-hour klines, limit 24 (`server/finance_api.py:34`).
  - The "prediction" just sorts the cached tickers by 24h change ("good", "meh" by absolute change, "bad" reversed) (`server/stock_predictor.py:31-37`).
  - All verified-in-source.
- **Why it won (inferred):** The brief was visualisation. A live feed on a novelty hardware display was memorable, and the prediction claim is shallow.

### 6. Distinguished-Orange-Rook: QRT Visualisation of Market Data, DurHack 2022
- **Data and processing:** A React `useExchange` hook opens `wss://stream.bybit.com/contract/usdt/public/v3` and subscribes `publicTrade.<TOKEN>` (`src/hooks/useExchange.ts:24,37`, verified-in-source). It is built with Astro static generation, Google Charts and a chart "Controller" component (verified-on-page).
- **Why it won (inferred):** It turned a clean real-time trade stream into multiple chart views.

### 7. QRT Remote Log Analyzer: QRT, DurHack 2023
- **Challenge text (verified-on-page, durhack-2023.devpost.com):** "develop a tool to simplify the extraction and analysis of the log output of a supplied application". The suggested features were:
  - "Analyse more than one log file at a time"
  - "continuously analyse logs as they are updated"
  - "Filtering… extra points for enabling regex"
  - "Display time difference between two entered points (rough latency analysis) and a statistical summary"
  - "Raising 'alerts'… e.g. latency is above threshold"
  - "Extra points for making the application work via a web browser".
- **Data and processing:**
  - A watcher on the log host uses `fs.watch` on the directory and on each file (`webserver.js:106-120`).
  - Each line is split and indexed into Redis hashes by timestamp, level and message (`webserver.js:24-26`). Exchange timing summary rows are parsed into JSON per exchange and order type (`webserver.js:44-54`).
  - A separate search service runs `HSCAN … MATCH` queries (`search.js:45`).
  - All verified-in-source.
- **Why it won (inferred):** It met the real-time, multi-file and browser criteria with a design that scales (a remote indexed store). It also won the Redis prize.

### 8. Log Analysis and Data Extraction Application: QRT, DurHack 2023
- **Data and processing:**
  - It tails each file with seek, readlines and a 1-second sleep in threads (`log_helper_module.py:224-230`).
  - A regex parses `timestamp level: message` (`:181`). Latency is computed as consecutive timestamp `diff()` and summarised with `.describe()` (`:146,156`). A latency alert fires when the gap exceeds 2 s (`:196-199`).
  - The user can enter a regex to filter and highlight (`:96-127`). Exchange timing statistics are parsed too (`:210`).
  - The UI is Streamlit charts.
  - All verified-in-source.
- **Why it won (inferred):** It ticked the most boxes on QRT's list (regex, live, statistics, alerts).

### 9. Torus: Marshall Wace "Best Use of Datasets", DurHack 2023
- **Challenge text (verified-on-page):** "develop a unique, scalable, and reliable data pipeline that retrieves a dataset of your choice and makes the best use of it." The evaluation criteria were:
  - "Reliability — …handle errors gracefully and account for missing data"
  - "Uniqueness"
  - "Scalability — …how it could be implemented at an industry scale"
  - "Visualization — …a way to visualize and monitor the data"
  - "Pipeline Design — …modular and reproducible".
- **Data and processing:**
  - The arXiv API is queried with keyword AND/OR title/abstract filters, in chunks of 2000 results with a 2-second sleep (`Durhack/views.py:48-62`).
  - NLTK stop words are removed (`:92`).
  - BERTopic uses the `paraphrase-MiniLM-L12-v2` embedding (`:112-120`). The output is an interactive similarity graph.
  - All verified-in-source.
  - Devpost says the data was pulled "by using the Open AI API". The code shows arXiv instead (inferred: a writing error).
- **Why it won (inferred):** It had a clear retrieve, clean, model and visualise pipeline on a "unique" question (research gaps).

### 10. Hex-Howl-Trading: Optiver Challenge 1st Place, Hex Cambridge (2021)
- **Challenge text (verified-on-page, hex-cambridge.devpost.com):** "build a Python trading algorithm that outperforms all others on our proprietary virtual exchange Optibook… The winning team will be the one that has developed the best trading strategy to trade in our simulator (not the team that makes the most money)."
- **Data and processing:**
  - The bot reads live price books for both instruments (`src/bots/bot-liquidifier.py:87`).
  - It quotes the illiquid leg inside its spread, using `UNDERCUT_FACTOR` (`:32-37`), and pins quotes to the liquid leg's best bid and ask (`:39-59`).
  - Volume is skewed by inventory with a sine winding function (`:62-80`).
  - Asserts guard against negative-edge quotes or oversize orders (`:100-111`).
  - The position is softly hedged with IOC orders on the liquid leg (`:117-141`), and quotes expire after 0.1 s (`:17,159`).
  - All verified-in-source.
- **Why it won (inferred):** It was a real market-making design with risk controls (inventory skew, hedging, sanity asserts), which fits "best strategy, not most money". The Devpost write-up is a joke, so the code carried the entry.

### 11. HTB-VI: Optiver Challenge, Hack the Burgh VI (2020)
- **Challenge text (verified-on-page):** "Design your own trading algorithm! The algorithm will be judged based on performance, risk-reward balance, novelty and presentation."
- **Data and processing:** A live UDP market feed and order channel to Optiver's exchange (`optiver/autotrader.py:13-29`). An Ichimoku conversion, base and cloud computation over the price buffer needs 52 entries before it trades (`optiver/MarketState.py:18-39,62-89`). Entries are gated on a flat position (`:39`). There is also an SMS P&L alert and a chart front end (verified-on-page). Code lines are verified-in-source.
- **Why it won (inferred):** It covered all four criteria, especially "presentation", with alerts and a chart.

### 12. Stock Analytics: Optiver Challenge, Hack the Burgh VI (2020)
- **Data and processing:** The signal is order-book imbalance: the sum of bid minus ask volume over two 10-tick windows (`submit/trade3.py:52,59`). Size is scaled by the volume surge relative to the past window with `RISK = 2000` (`:64-73`), and a WAIT state limits re-entry. These are verified-in-source.
  - Devpost says "Using Python and TA-LIB". `talib` does not appear in the repo (grep, verified-in-source).
- **Result (verified-on-page):** "400 dollars of profit per 1000 invested dollars".

### 13. The Hedgetrimmers: Optiver Challenge Prize, Hack the Burgh 7 (2021)
- **Challenge text:** Optibook brief, same as Hex Cambridge (verified-on-page).
- **Data and processing:** "finds the spread between the traded value of a basket of stocks, and the value of the underlying stocks… buying the basket when it is underpriced, and hedging… (remaining delta-neutral)". The team "placed limits on our order functions to only place algorithmic orders when the spread is below a reasonable amount" (verified-on-page). There is no repo.
- **Why it won (inferred):** It was ETF/basket arbitrage with explicit hedging and risk limits.

### 14. Team LAB: "Mastering trading with AI - Optiver", HackTheBurgh X (2024)
- **Data and processing:** "market-making strategy and leverages sentiment analysis through machine learning to execute directional trades in anticipation of market movements triggered by news". The team reports "the highest hourly PnL throughout the weekend" (verified-on-page). There is no repo.

### 15. PokerStarz: Squarepoint Challenge, Hack the Burgh V (2019)
- **Challenge text (verified-on-page):** "Build a poker bot to play our own version of poker!"
- **Data and processing (verified-on-page):**
  - Hand score is `p(win|hand, board)=1.0 - rank/7642` using the treys library.
  - Pre-flop it runs a Monte Carlo of 1000 random 3-card boards.
  - Action thresholds (raise 0.33/0.55, call 0.27/0.2) were set from score histograms over 1000 and 1,000,000 simulated rounds.
  - The repo now returns 404, so the code is lead-only.
- **Why it won (inferred):** Its decisions were probabilistic and calibrated against simulation data.

### 16. Ulwazi: Marshall Wace "Giving Back Challenge", Hack the Burgh VIII (2022)
- **Challenge text (verified-on-page):** "how technology could help in contributing to society… Alternatively, we welcome projects based on data analysis, such as to optimize the efficient use of resources or forecasting events that serve the public interest".
- **Data and processing:** The problem is set up as a binary integer program in Gurobi: a crop-to-buyer assignment that maximises profit net of transport cost (`main.py:65-81`). It is served by FastAPI (`api.py`). The input comes from `mock_input` (`api.py:7`). These are verified-in-source.
  - Devpost says "We identified sources of live pricing data", and lists scraping as "What's next". So the live data was not built (inferred).
- **Why it won (inferred):** It had a well-posed optimisation, a credible social-impact story and citations to research.

### 17. Smart ePCR: IMC "Best Use of Technology to Create Positive Social Impact", IC Hack 26 (2026)
- **Challenge text:** The Devpost prize body only says "To Be Determined" (verified-on-page). The brief is lead-only.
- **Data and processing:**
  - The team spent "24 hours embedded with the St John Ambulance (SJA) team" (verified-on-page).
  - The JRCALC protocol and AEPR attribute JSON assets are bundled into the app (repo tree `paramedic_scribe/assets/`). The offline store is Hive (`paramedic_scribe/lib/services/storage_service.dart:10-11`).
  - A semantic-search microservice uses `all-MiniLM-L6-v2` with normalized embeddings and cosine scores (`semantic_search_backend/embedder.py:32-37`). It exposes `/suggest` and `/pathways/suggest` endpoints (`semantic_search_backend/main.py:323,377`).
  - All verified-in-source.
- **Why it won (inferred):** It came from real user research, had a measurable pain point ("for every 20 minutes… 60 minutes of administrative debt") and was engineered offline-first.

### 18. Cognitive Crowds: Bloomberg Favourites Prize, Hack Cambridge Recurse (2017)
- **Challenge text (verified-on-page):** "Bloombergs pick of the best project will get some interesting gadgets".
- **Data and processing (verified-on-page):** Recorded audience video. The pipeline "extracts frames every 2 seconds and continuously analyses the public's emotions" through the MS Emotion and Text Analytics APIs. It computes an attention score per frame, writes JSON and plots it against the talk timeline (PHP, Python and OpenCV). The code was not checked.

## Firms' stated expectations of candidates

- **Marshall Wace** (verified-on-page, https://www.mwam.com/technology-graduate-scheme/):
  - "We are looking for candidates who have actively developed their technical and programming skills"
  - "We look for engineers who have experience working with at least one programming language"
  - Example graduate project: "Writing data pipelines that feed into systematic trading models"
  - The DurHack 2023 brief asks for pipelines that "handle errors gracefully and account for missing data", that are "modular and reproducible", and that include a way "to visualize and monitor the data" (verified-on-page).
- **G-Research** (verified-on-page, https://www.gresearch.com/students-graduates/graduates/):
  - "employ rigorous scientific methodology to extract deep insights from an extensive data ecosystem"
  - "We find patterns in noisy, real-world datasets to predict movement in global financial markets"
  - Job boards ask for a "Strong mathematical background" (lead-only, Bright Network snippet).
- **QRT** (verified-on-page, https://durhack.qwerty.technology/mitm/):
  - Judging criteria are "Correctness… Insight - provides a clear overview of the different trade-offs… Creativity - great visualisation or unique fairness metrics… Polish - clean, presentation-ready outputs and code".
  - Judges also feed a submission JSON at judging time.
  - The site lists hiring for "Data Engineering, Quantitative Developer…".
  - The 2023 LLM challenge criteria are "Creativity - Accuracy - Performance - Impact - Bonus points for custom model training or local hardware acceleration" (durhack-2023.devpost.com).
- **Optiver:**
  - "the best trading strategy… (not the team that makes the most money)" (Hex Cambridge prize, verified-on-page).
  - "judged based on performance, risk-reward balance, novelty and presentation" (HTB VI prize, verified-on-page).
  - Lead-only (search snippet, page now redirects): the TraderHack judges "take into account overall trading strategy, risk management as well as code structure and creativity". The graduate SWE route uses a HackerRank test and needs no trading knowledge (Bright Network snippet).
- **IMC, Squarepoint, Bloomberg:** No candidate expectations were found beyond the prize titles above.

## Patterns (inferred)

1. **Most winners fall into three challenge archetypes:**
   - Trading simulator (Optiver Optibook or UDP exchange; Squarepoint poker).
   - Supplied-data engineering or ML (QRT logs, stock returns, OAG flights).
   - Themed open prize (Marshall Wace, IMC, G-Research).
2. **On trading challenges, risk controls win, not P&L alone.** The winning bots all show inventory limits, hedging, position gating or calibrated thresholds.
3. **On data challenges, the winners handle the data properly:**
   - Streaming or tailing for live data (logs, WebSocket feeds).
   - Indexing or columnar tools for scale (Redis, Polars).
   - Leakage-aware validation (KFold by date).
   - A dashboard or visual readout.
4. **Write-ups often overclaim:** TA-Lib that is not in the repo, "live" prices that are mock data, training-set AUC. Judges seem to reward the demo, but the code checks show the claims are often weaker than the pitch.

## Search scope

- **Devpost hackathon search API** (`devpost.com/api/hackathons?search=…`) for IC Hack, Hack Cambridge, DurHack, Hack the Burgh, OxHack, StudentHack, Royal Hackaway, HackLondon, UCL, Warwick, BrumHack, HackNotts, HackKings and others.
- **Prize sections parsed on 45 hackathon pages:** IC Hack 18-26, Hack Cambridge Recurse/Ternary/4D/101/Atlas, Hex Cambridge, DurHack 2019-2026, HTB V-X and 2023, OxHack 2026, StudentHack 2020/24/25, Royal Hackaway v6-v9, HackLondon 24/2026, WarwickHACK 2021/22, Cam Hack 2024/25, The FinTech Hackathon, HackNotts 25/84.
- **Gallery pages 1-2** (and 3-4 for some events) read for JSON-LD awards. Winners are listed first, so this is likely complete, but it is not guaranteed.
- **Gaps:**
  - IC Hack 24 Optiver, Citadel and Marshall Wace prizes and IC Hack 22 Optiver show no winners in the gallery; they may not have been assigned on Devpost.
  - No Devpost pages were found for IC Hack 23, Hack Cambridge 2023-2026, HTB XI/XII or HackLondon 2025.
  - KCL HackLondon 2026 had no in-slice sponsor prizes.
- **Firms with no Devpost UK student-hackathon prize found:** Man Group (lead-only: the Man AHL Coder Prize is a separate competition, hedgeweek.com), XTX, Flow Traders (lead-only: a Hong Kong event), Maven, Da Vinci and Winton.
- **Code:** read through `gh api` contents and saved under `/private/tmp/claude-501/-Users-dust-Projects-first-year-hack-new-project/4ebaf192-5440-4dc8-9335-94f7adcd7ba0/scratchpad/qrepos-uk/`. Nothing was executed.
  - 404: `brano2/htb2019-pokerstarz`, `cst0313/ICHack26`.
  - No repo: Meet in The Middle, HPLaaS, Team LAB, Hedgetrimmers, trading101, Actually Effective Altruism.

## Appendix A: all 35 in-slice winners found (verified-on-page)

| Event | Prize | Project |
|---|---|---|
| IC Hack 26 | Marshall Wace - Emergent Behaviour | Digital Twin (eventtwin) |
| IC Hack 26 | Marshall Wace - Emergent Behaviour (HM) | ERLA (magi-2bhmze) |
| IC Hack 26 | IMC Trading - Best Use of Technology to Create Positive Social Impact | Smart ePCR (sjai) |
| IC Hack 26 | IMC Trading - … (HM) | Relay (relay-5ajcmb) |
| IC Hack 25 | Marshall Wace - Exploring a Chain of Events | Actually Effective Altruism |
| IC Hack 25 | Marshall Wace - … (HM) | Causalitree |
| IC Hack 22 | [Marshall Wace] Most Entrepreneurial Hack | StartNet |
| DurHack X 2025 | G-Research crystal ball | Niche Machine |
| DurHack X 2025 | Meeting in the Middle (QRT) | QRT: Meet in The Middle |
| DurHack X 2025 | Building on Foundations (QRT) | HPLaaS |
| DurHack X 2025 | Bridging Worlds (Marshall Wace) | ORION |
| DurHack 2024 | Capture the Flag (QRT) | Java==Javascript |
| DurHack 2024 | Chain of events (Marshall Wace) | Pipeline of Peril |
| DurHack 2024 | Funniest Hack (Sponsored by Marshall Wace) | None of Your Business |
| DurHack 2023 | Data Extraction and Analysis Challenge (QRT) | QRT Remote Log Analyzer; Log Analysis and Data Extraction Application |
| DurHack 2023 | Large Language Model Acceleration (QRT) | Teach me anything robot |
| DurHack 2023 | Best Use of Datasets (Marshall Wace) | Torus |
| DurHack 2022 | QRT Stock Prediction Model Challenge | Stock Return Prediction Model…; QRT Stock Prediction; Stock Prediction GOGOGO |
| DurHack 2022 | QRT Visualisation of Market Data Challenge | CryptoCraft; Distinguished-Orange-Rook; Fortune Fruits |
| Hex Cambridge 2021 | Optiver Challenge 1st Place | Hex-Howl-Trading |
| Hack Cambridge Atlas 2022 | Optiver Challenge | trading101 |
| Hack Cambridge Atlas 2022 | Marshall Wace Challenge | Orbidity |
| Hack Cambridge Recurse 2017 | Bloomberg Favourites Prize | Cognitive Crowds |
| HackTheBurgh X 2024 | Mastering trading with AI - Optiver | Team LAB |
| Hack The Burgh 2023 | Marshall Wace Challenge | Penguu |
| Hack the Burgh VIII 2022 | Marshall Wace - Giving Back Challenge | Ulwazi |
| Hack the Burgh 7 2021 | Optiver Challenge Prize | The Hedgetrimmers |
| Hack the Burgh VI 2020 | Optiver Challenge | HTB-VI; Stock Analytics |
| Hack the Burgh V 2019 | Squarepoint Challenge | PokerStarz |
