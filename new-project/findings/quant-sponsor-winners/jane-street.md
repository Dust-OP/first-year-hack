# Jane Street: what its sponsor prizes and challenges reward

Research date: 2026-11-21. Scope: projects that won a prize named for Jane Street or sponsored by it, plus winners of challenges Jane Street runs itself. Everything was read-only. No logins were used and no code was run.

Labels:
- **verified-in-source**: confirmed by reading the repo at the given path and line, via `gh api`.
- **verified-on-page**: read on the Devpost, event or Jane Street page. Quotes from janestreet.com and blog.janestreet.com came through a page-fetch summariser, so treat their wording as near-verbatim. Devpost quotes were pulled from the raw HTML and are exact.
- **inferred**: my reading of the evidence.
- **lead-only**: seen only in search results.

## Headline finding

Jane Street rarely names a Devpost prize after itself. I scanned the winner lists of 2,560 Devpost hackathons (22,965 prize awards). Only three awards name Jane Street or say it sponsored them: AdaHack 2026, MakeMIT 2019 and HackTX 2016.

At most events where Jane Street appears (Hack the North 2023–26, PennApps XXIV/XXV, HackMIT 2023, OxHack 2026, Cam Hack 2024, IC Hack 22, Hack Cambridge 4D, Hex Cambridge, Oxford Hack 2019, Codebrew, STACS Hack the Bubble, Gator Quant Hacks), it shows up only as a sponsor logo, a judge, a mentor or swag. That evidence is verified-on-page.

So to reach 7+ winners, the table also includes winners of challenges Jane Street runs itself: the Electronic Trading Challenge (ETC), Advent of FPGA 2025 and the Jane Street x GPU MODE hackathon. It also has one adjacent row where a Jane Street quant judged but the track sponsor is not confirmed.

## Per-project table

| # | Event (year) | Prize / track | Project | Devpost | Repo | Data + processing | Evidence |
|---|---|---|---|---|---|---|---|
| 1 | AdaHack 2026, Edinburgh (UK), 3 Oct 2026 | "Jane Street" ("Prize for the Jane Street Track") | Street Miles | https://devpost.com/software/street-miles | https://github.com/darknight054/adahack-jt | OSRM routes, OpenStreetMap/Overpass places, GPS tracks. FastAPI + SQLite double-entry-style credit ledger, a reverse auction ranked by credits per mile, server-side trip plausibility checks. React frontend. | verified-on-page + verified-in-source |
| 2 | MakeMIT 2019 (US) | "Jane Street Functional + Functional" | Calligraphy Machine | https://devpost.com/software/calligraphy-machine | https://github.com/cmnord/brush-pen-robot | TrueType font Bézier curves are interpolated into G-code and driven by an Arduino running GRBL on a custom X/Y/θ brush-pen robot. Python, numpy, matplotlib. | verified-on-page + verified-in-source |
| 3 | HackTX 2016 (US) | "Keep Austin Weird" ("Sponsored by Jane Street") | Ah-ChooseYou | https://devpost.com/software/ah-chooseyou | https://github.com/Saadnajmi/Ah-ChooseYou | Matches sneeze events within a timestamp window. Node/Express + MongoDB on Heroku, Android client, Facebook login. | verified-on-page + verified-in-source |
| 4 | Jane Street ETC, Singapore, 17 Sep 2022 | 1st place (main event and "Final Hour") | JaneStreetETC22 | n/a | https://github.com/EnriqueKhai/JaneStreetETC22 | Live exchange feed (about 5,000 trades per round). Tried ADR and ETF arbitrage, then won with market making: requote last trade ±1 on every trade message. Python. | verified-in-source (the win is self-reported in the README) |
| 5 | Jane Street ETC, Shanghai, 2019 | "first place strategy in Shanghai Station" | JaneStreet-ETC | n/a | https://github.com/Hotxuer/JaneStreet-ETC | Live exchange feed. Bond penny-pricing at 999/1001 and ETF-vs-basket arbitrage on rolling mean prices. Python. | verified-in-source (the placing is self-reported in the repo description) |
| 6 | Jane Street Advent of FPGA 2025 (online) | Featured in Jane Street's favourites. Prize: "three most inventive & creative contributions" get a Kria KV260 kit; which three got kits is not stated | Day 12 solver, taped out on TinyTapeout (Robert Solomon Saab, U of Toronto student) | n/a | https://github.com/robertsaabwoo/advent_of_fpga_2025 | Puzzle input streamed into hardware. A backtracking "pseudo-recursive" solver in Hardcaml (OCaml), tested with a Cyclesim expect test, then taped out as an ASIC. | verified-on-page + verified-in-source |
| 7 | Jane Street Advent of FPGA 2025 (online) | Featured in Jane Street's favourites | AdventOfFPGA (Rémy Citérin, ENS student) | n/a | https://github.com/RemyCiterin/AdventOfFPGA | Bluespec hardware solvers, including Gauss-Jordan reduction for Day 10, benchmarked in cycles against software on his own out-of-order RISC-V CPU (DOoOM). | verified-on-page + verified-in-source |
| 8 | Jane Street x GPU MODE hackathon, NYC, 6 Sep 2025 | Top prize, $50,000 ($25k per round) | Team of Nadav Timor et al. | n/a | none found | The hackathon was about deploying a model that reacts to market events. The team says "stateless batching" gave about 5x queries per second and a state-management fix doubled profit per second. | lead-only |
| 9 (adjacent) | Gator Quant Hacks, U. Florida, 2–4 Oct 2026 | "Systematic Trading" and "Quantitative Puzzles" winners. The judge list includes "Jane Street Quant"; who sponsors each track is not stated | PolyBridge; A MultiPlanetary Exchange System | https://devpost.com/software/polybridge ; https://devpost.com/software/a-multiplanetary-exchange-system | https://github.com/theomachado05/polybridge | Options-implied probabilities vs Polymarket prices, with pre-registered tests (C++/pybind11, simdjson). For the exchange: an event simulator with 4,500 fault-injected fuzz runs checking ledger invariants. | verified-on-page (repo not checked) |

## Details

### 1. Street Miles, AdaHack 2026 (Jane Street track)

**Event and prize** (verified-on-page, https://adahack-2026.devpost.com/ and its project gallery)
- The prize is listed as "Jane Street 1 winner Prize for the Jane Street Track".
- The gallery's winner list says "Winner, Jane Street — AdaHack 2026".
- Optiver and G-Research each ran a separate track at the same event.
- Event-wide judging criteria (exact): "Teamwork How much did each person contribute? ... Originality Was it original? ... Theme How well did their project fit the theme of Sustainability? Presentation Skills What was their final presentation? Was it concise and informative? ... Project Qual[ity] ...".
- Devpost does not publish the Jane Street brief itself.
- The repo README states the brief as "AdaHack 2026, Jane Street challenge: encourage staff who drive to the London office to walk or cycle instead." (`README.md:2`, verified-in-source)

**Project**
- Devpost: https://devpost.com/software/street-miles
- Repo: https://github.com/darknight054/adahack-jt
- Built with: fastapi, javascript, python, react, sqlalchemy, sqlite.

**Data and processing**
- Data sources are all keyless: OSRM routes from OpenStreetMap, places from the Overpass API, and live GPS from the phone. Routes and places are cached in a committed SQLite database. Credit movements are processed as they happen, one ledger row per event.
- Techniques:
  - an append-only credit ledger, with balances "computed from the data";
  - a reverse auction for car-free commutes;
  - anti-farming rules: a daily cap, a price floor and ceiling, and only earned credits can be sold;
  - server-side trip validation against the routed path.
- The Devpost write-up says: "because this was for Jane Street, a trading firm, we thought it would be fun if the whole thing worked like a wee stock market."

**Code check** (verified-in-source)
- `backend/app/switch.py:39-44`: offers are sorted "fewest credits per mile of driving replaced first": `sorted(rows, key=lambda o: (o["ask"] / o["car_km"], o["created_at"]))`.
- `backend/app/economy.py:47-53`: every credit movement is an `INSERT ... INTO ledger`, and balances are `SUM(credits)` over the ledger. `economy.py:88` caps earnings with `config.DAILY_CAP`.
- `backend/app/trips.py:120-129`: the server routes the trip through OSRM and rejects tracks that are "faster than anyone could {mode} that route" or that "jump further than you could travel".
- No test directory was found in the tree.

**Why it won** (inferred)
- It turned a social brief into a small market with explicit mechanism design: auction ordering, a fix for incentive misalignment ("Rewarding the wrong people... So we built the auction"), and anti-gaming constraints.
- The design was then backed by an auditable ledger and server-side verification.
- That plays to a trading firm's interest in market mechanics and correctness more than to UI polish.

### 2. Calligraphy Machine, MakeMIT 2019 ("Jane Street Functional + Functional")

**Event and prize** (verified-on-page, https://makemit2019.devpost.com/)
- Exact prize text: "Jane Street Functional + Functional 1 winner The winning team will receive a keyboard, and the prize will be awarded to teams that built products that work, and for which we would like to see in the real world with bonus points for demonstrating the value of functional programming. Prizes: Keyboards - Constructed by hand with the help of a few Jane Street engineers."
- Jane Street's own blog post (https://blog.janestreet.com/hackathon-keyboards/) says it "wanted to create a prize for the winners that would do justice to the maker spirit of the competition."

**Project**
- Devpost: https://devpost.com/software/calligraphy-machine
- Repo: https://github.com/cmnord/brush-pen-robot
- Built with: arduino, grbl, matplotlib, numpy, python.

**Data and processing**
- Input is font files (TTF converted to TTX XML). Processing is a batch pipeline: glyph Bézier curves are interpolated and emitted as G-code.
- An Arduino running the GRBL G-code interpreter handles motion control. "X, Y, and θ motion allow us to vary the thickness of lines".
- `plot.py` draws glyphs for testing.

**Code check** (verified-in-source)
- `glyph.py:1` imports `bezier`.
- `glyph.py:27` `interpolate_path(resolution)`, `glyph.py:38` `get_gcode(...)`, and `glyph.py:47` emits `"G1 X{} Y{} F100\n"`.

**Why it won** (inferred)
- It literally satisfies "products that work": a physical machine producing real output. The hardware is mechanically clean.
- I found no OCaml or functional code, so the functional-programming bonus was probably not the deciding factor.

### 3. Ah-ChooseYou, HackTX 2016 ("Keep Austin Weird")

**Event and prize** (verified-on-page, https://hacktx16.devpost.com/)
- Exact prize text: "Keep Austin Weird 1 winner Prize: something weird. Sponsored by Jane Street."
- No criteria are given beyond "weird".

**Project**
- Devpost: https://devpost.com/software/ah-chooseyou
- Repo: https://github.com/Saadnajmi/Ah-ChooseYou
- What it does: a "Mobile app that matches you with someone that sneezed at the same time as you."

**Data and processing**
- User-generated event timestamps stored in MongoDB.
- Matching is a time-window range query.

**Code check** (verified-in-source)
- `Server/routes/sneezes.js:48-54`: the `POST /:id/match/:timestamp` route queries `{"timestamp": {'$gte': end, '$lte': start }}` around the given time.
- `Server/models/Sneeze.js:5` holds `timestamp: {type: Date, default: Date.now}`.

**Why it won** (inferred)
- Pure humour fit to a "weird" category.
- This shows that Jane Street sponsor prizes are sometimes about playfulness, not finance.

### 4. JaneStreetETC22, Jane Street ETC Singapore 2022, 1st place

**Event and prize**
- Self-reported in the README, which quotes the organiser brief (verified-in-source, https://github.com/EnriqueKhai/JaneStreetETC22 README): "etc is a programming challenge. The goal is to write a program that will make fake money by trading securities on a fake financial exchange... In each matchup, you and another team compete to be the best market maker, providing liquidity to a third bot called the 'marketplace'."
- There are two scored competitions: weighted continuous scoring from 11:00 to 17:00, and "The Final Hour".

**Data and processing**
- Data is a live, real-time public exchange feed, read through Jane Street's `Exchange()` helper (`read_public_feed`, `send_order`, `cancel_order`), with separate test and production environments.
- The team logged opening and closing prices and trade counts per round.
- Strategy evolved from ADR arbitrage (VALE↔VALBZ, $10 conversion) and ETF arbitrage (XLF↔basket, $100 conversion) to market making around the last trade price. The README says that took them from about $300 per round to "over $10,000 per round".
- On fair price: "We felt that the order book was an aggregation of individual speculation... Instead, we took the last transacted price."
- Lessons in the README: "iterate often, develop quickly and test, test, test!" They regretted not saving each round's logs to CSV for pandas analysis afterwards.

**Code check** (verified-in-source)
- `market_maker.py:23-51`: on each `trade` message, it cancels both resting orders and re-posts BUY at `price - delta` and SELL at `price + delta` (size 1).

**Why it won** (inferred)
- They switched from waiting for rare arbitrage to capturing the spread on every trade, which suits a high-volume simulated market.
- They found the change through empirical observation of the feed, not theory.

### 5. JaneStreet-ETC, Jane Street ETC Shanghai 2019, first place

**Event and prize**
- Self-reported: the repo description says "the first place strategy in Shanghai Station". The README says only "You can learn the strategy we used which are simple from the code."

**Data and processing**
- Live exchange feed.
- Simple statistics: rolling means of recent trade prices per symbol.

**Code check** (verified-in-source, https://github.com/Hotxuer/JaneStreet-ETC)
- `strategy.py:5-10`: bond penny-pricing, buying at 999 and selling at 1001.
- `strategy.py:31-50`: ETF arbitrage when `10*BAT_mean ± 100` crosses the basket `3*BOND + 2*BDU + 3*ALI + 2*TCT`.

**Why it won** (inferred)
- Simple, robust, correct-by-construction arbitrage beat cleverness.
- This matches the ETC22 team's experience.

### 6. Robert Solomon Saab, Advent of FPGA 2025 (Jane Street challenge)

**Event and prize** (verified-on-page)
- Challenge post: https://blog.janestreet.com/advent-of-fpga-challenge-2025/
  - The brief is to "pick any puzzles you like ... to build synthesizable RTL with realistic I/O".
  - Submissions need "your code (open-sourced), testbench, and a README or document explaining your approach and how to run it".
  - Hardcaml earns bonus points.
  - "We'll pick the three most inventive & creative contributions" for a Kria KV260 kit. The kits are chosen by the Jane Street hardware team.
- Results post: https://blog.janestreet.com/advent-of-fpga-challenge-2025-results/
  - 213 submissions from 46 countries.
  - Judges "looked for submissions with detailed write-ups that others can reference and learn from" and "trickier solves that took the solution further in some dimension", for example "demonstrating results on actual hardware".
  - Saab "actually taped it out as an IC through TinyTapeout".

**Data and processing**
- Raw puzzle input is streamed into hardware.
- The Day 12 solver uses a backtracking "pseudo recursive" design that stores one map copy, to minimise hardware.

**Code check** (verified-in-source, https://github.com/robertsaabwoo/advent_of_fpga_2025)
- `README.md:3-5`: Hardcaml Day 12 solution, with Verilog generated from Hardcaml and taped out.
- `day_12/Hardcaml/test/test_day_12_solver.ml:108`: `let%expect_test "day 12 verification"`, a Cyclesim cycle-accurate simulation with an `[%expect]` block (line 197). This is Jane Street's own expect-test style.

**Why featured** (inferred)
- He went past the brief: the solver handles a more general problem, it reached real silicon, and it used Jane Street's own tools (Hardcaml and expect tests).

### 7. Rémy Citérin, Advent of FPGA 2025

**Event and prize**
- Same challenge as #6.
- The results post praises "benchmarking his hardware implementations against software running on his own custom out-of-order RISC-V CPU" (verified-on-page).

**Data and processing**
- Bluespec hardware.
- Gauss-Jordan reduction with GCD normalisation for Day 10.
- Cycle-count benchmarks against software.

**Code check** (verified-in-source, https://github.com/RemyCiterin/AdventOfFPGA)
- `README.md:110-117`: the Gauss-Jordan approach.
- `README.md:471-484`: DOoOM CPU comparison and a cycles table, including "186M cycles, versus 290M".

**Why featured** (inferred)
- Quantitative evidence (measured cycles against a baseline) plus a reference-quality write-up.

### 8. Jane Street x GPU MODE hackathon, NYC, Sep 2025 (lead-only)

- Search results show Jane Street's event page (https://www.janestreet.com/join-jane-street/programs-and-events/gpu-mode-hackathon). It returned 404 when I fetched it directly.
- The search snippets describe "the challenges of putting a real model dealing with market events into production". They say winning requires thinking about the whole system, using profilers to find bottlenecks, or better algorithms for new market events.
- The winning team's own post on X (https://x.com/NadavTimor/status/1965082710730551701, not fetchable: HTTP 402) claims:
  - $50,000 total, "out of 51 top talent teams";
  - round 1 was won by "stateless batching" (about 5x queries per second);
  - round 2 was won by a state-management fix that "boosted our profit per second by 2x".
- No repo was found.
- Why it won (inferred): latency and throughput engineering on the whole system, plus correctness of model state, scored on profit per second.

### 9. Adjacent: Gator Quant Hacks 2026 (Jane Street-judged, track sponsor unconfirmed)

**Event and judging** (verified-on-page, https://gqhacks.devpost.com/)
- Jane Street is a sponsor logo.
- The judges are listed as "Faculty and Sponsors University of Florida Quant Jane Street Quant Citadel SWE Databento Representative MLH".
- The track descriptions on Devpost list prizes only. The hacker guide on Notion did not render.

**Winning projects**
- PolyBridge ("Systematic Trading") compares option-implied prices with Polymarket. It "trades only signals that pass tests written in advance". The team found that a date-parsing bug was causing every losing trade. Stack: C++, pybind11, simdjson, FastAPI.
- A MultiPlanetary Exchange System ("Quantitative Puzzles") is a lock-then-commit exchange design. It checks invariants "after every ledger step of 4,500 fault-injected fuzz runs, with 0 violations".
- Neither page mentions Jane Street.

**Why it matters** (inferred)
- Even in quant-judged tracks, the winners emphasised pre-registered tests, invariants and reproducibility.

## What Jane Street says it looks for

All verified-on-page.

**Interview approach**
- https://blog.janestreet.com/what-a-jane-street-dev-interview-is-like/
  - "We are more interested in seeing how you approach a difficult problem"
  - "the journey through the interview is a lot more important than the snapshot of the solution at the end of it."
  - "Every successful candidate should achieve a bug-free solution for part 1 relatively quickly."
  - Interviewers may prefer "a candidate that wrote careful and clear code, communicated well" over one who got further but was sloppy.
  - "there are no bonus points for using a functional language like OCaml."
- https://www.janestreet.com/preparing-for-a-software-engineering-interview
  - "We are looking for candidates who engage in clear and productive discussions about the problem at hand."
  - "We expect you to write code in a real programming language in these interviews, not pseudocode."
  - "If OCaml isn't your strongest language, then don't use it."
  - "You should be comfortable with basic data structures and APIs in your language of choice."
- https://www.janestreet.com/join-jane-street/interviewing/
  - "We focus on collaborative problem solving during the interview"
  - "We believe that asking great questions is more important than knowing all the answers."
  - "We won't test you on knowledge of finance or economics."
  - "we strongly encourage you not to try OCaml for the first time during the interview."

**Engineering culture**
- https://www.janestreet.com/technology/
  - "use OCaml, a statically typed functional language, as our primary development platform"
  - "billions of dollars worth of transactions flow through them every day"
  - "Curious and disciplined engineers wanted." (quoted on the interviewing page)
- Testing and correctness, from https://blog.janestreet.com/the-joy-of-expect-tests/:
  - "In expect tests, regressions are just diffs."
  - "they capture things you never expected them to."
- Puzzles, from https://www.janestreet.com/puzzles/: "Every month or two, we'll post a new puzzle to this page." The page does not call puzzles a hiring criterion.

**Challenge requirements**
- From the Advent of FPGA post: open-source code, a testbench and a README explaining the approach are required.
- Judging favoured "detailed write-ups that others can reference and learn from".

**Takeaway for data handling** (inferred)
- Jane Street expects you to process data correctly and verifiably, and to explain how you did it.
- In practice that means:
  - clean, bug-free code over feature count;
  - tests (ideally expect-style golden outputs) and invariants;
  - reproducible pipelines;
  - honest measurement (latency, throughput, profit per second, cycles);
  - clear communication of the reasoning.
- Finance knowledge and OCaml are not required.

## Patterns across winners (inferred)

1. **Something that really works beats a pitch.** Examples: a physical robot, a running market bot, silicon, an end-to-end app with server-side checks.
2. **Market mechanism thinking.** Street Miles turned a sustainability brief into an auction and ledger. The ETC winners exploited spread and arbitrage structure.
3. **Simple, robust strategies found by watching the data.** The ETC22 team watched the live feed, then switched to last-trade ±1 market making.
4. **Correctness and verification are visible.** Expect tests, fuzzed invariants, pre-registered tests, ledger-derived balances and plausibility checks on input data.
5. **Measured performance claims.** Queries per second and profit per second in GPU MODE, cycle counts in Advent of FPGA.
6. **Fun counts at hackathon-level Jane Street prizes.** "Keep Austin Weird" and "Functional + Functional" both rewarded playful, working builds. Most such prizes have light published criteria.

## Search scope

- **Devpost hackathon API** (`/api/hackathons?search=...&status[]=ended`). About 130 name queries covering UK/EU (IC Hack, Hack Cambridge, DurHack, HackLondon, OxHack, Cam Hack, AdaHack, STACS, HackUPC, Junction, HackZurich, etc.), US (HackMIT, MakeMIT, PennApps, HackPrinceton, TreeHacks, Hack the North, HackTX, YHack, Columbia DevFest, etc.), APAC (DevSoc/UNSW, Codebrew, NUS, Hong Kong) and quant/fintech terms. That gave 2,560 unique hackathons.
- **Winner lists.** I parsed the `challenge-winners-json-ld` block on every project gallery: 22,965 award rows. Matches for "jane": 2 (AdaHack 2026, MakeMIT 2019).
- **Hackathon home pages.** I fetched 1,792 home pages of hackathons that had winners; 61 mention Jane Street. Their prize text yielded one more Jane Street-sponsored prize (HackTX 2016 "Keep Austin Weird"). It also showed swag-only prizes (HackBackBetter, TIDALHACK:26) and many logo, judge or mentor appearances.
- **Devpost software search** (`/software/search.json`) for "jane street", "janestreet", "jane street challenge/prize/track" and "ocaml". Its winners were not Jane Street prizes.
- **Web searches** (about 15 queries): Jane Street prize and track wording, IC Hack, Hack Cambridge, Reddit/HN, GPU MODE, ETC, Advent of FPGA, Kaggle. Kaggle Jane Street competition winners were seen only as leads (YouTube walkthroughs, third-party notes) and are not included as rows.
- **GitHub (`gh search repos`)**: "jane street etc", "electronic trading challenge", "jane street hackathon", "gpu mode jane street", Kaggle solution repos.
- **Jane Street pages read**: interviewing, preparing-for-a-software-engineering-interview, technology, puzzles, and the blog posts on dev interviews, expect tests, hackathon keyboards and Advent of FPGA (challenge and results).
- **Fetch failures**: Medium (403), mpolson64 ETC blog (404), X posts (402), the Jane Street GPU MODE page (404) and the gqhacks Notion page (empty render).

**Gaps**
- Many Jane Street-sponsored events either do not use Devpost or do not name prizes by sponsor, so Jane Street-judged winners at those events are invisible to this method.
- Hack Cambridge 2023–26 and HackMIT 2024–26 were not found on Devpost.
- No repos were cloned. All code checks used `gh api` reads only.
