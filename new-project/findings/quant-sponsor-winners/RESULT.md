# What quant and data sponsors reward, and what our app can do with its data

Inspected: 2026-11-21. Five parallel research workers read Devpost winner badges, sponsor challenge text, event pages and the firms' own careers pages. Where repos existed, they read the code with `gh` (read-only, nothing run).
Adoption state: **not adopted**. These are recommendations for the team.

## Coverage

| Report | Sponsors | Winning entries found | How firm |
|---|---|---|---|
| [`uk-quant-sponsors.md`](uk-quant-sponsors.md) | QRT, Marshall Wace, Optiver, IMC, G-Research, Squarepoint, Bloomberg at UK student hackathons (DurHack, Hack the Burgh, IC Hack, Hack Cambridge) | 35 (18 detailed, 12 repos read) | all Devpost-confirmed |
| [`hrt-jump-drw.md`](hrt-jump-drw.md) | Hudson River Trading (IC Hack 26, OxHack 2026, HackBelfast 2026, TreeHacks, Columbia CDSS) | 9 (7 repos read) | Devpost-confirmed; Jump/DRW found on none of 496 events |
| [`citadel-twosigma-sig.md`](citadel-twosigma-sig.md) | Citadel, Two Sigma, SIG | 10 + 1 runner-up | 6 solid; the rest self-claimed or LinkedIn-only |
| [`jane-street.md`](jane-street.md) | Jane Street | 8 | Only 3 are true Jane Street hackathon prizes in 2,560 Devpost events. The rest are its own contests (ETC, Advent of FPGA) |
| [`kcl-seasons-and-data-cos.md`](kcl-seasons-and-data-cos.md) | KCL Tech's past events; Databricks, Bloomberg, Confluent, MongoDB, ClickHouse | about 9 KCL winners + 8 data-company winners | Devpost-confirmed; HackLondon 2025 not public |

**Total: about 79 winning entries, of which about 65 are confirmed on the prize page or Devpost.** That is well above the 30 asked for.

## Key facts for our event

- **No quant firm sponsored any KCL Tech event we could check** (CultureHack 2024, FYH 2025, FYH 2025/26, HackLondon 2026). The confirmed sponsor today is Snowflake. A quant prize at FirstYearHack would be a surprise. Ask on the day (tracks and prizes are "revealed on the day").
- **The closest KCL precedent is HackLondon 2026's Serac/IBex track:**
  - **Marks:** 20% for "effective use of [their] API and datasets" and 35% for technical sophistication.
  - **Winners:** combined planning, EPC, Land Registry and flood data, ran **500 m radius queries**, turned the results into **scores or heatmaps**, and used an LLM only to explain them. This is very close to our compass: radius, distance and direction.
- **Quant prizes are rarely about trading.** HRT's 2026 UK prize was renamed "Best Use of Data for Predictions & Decision-Making"; none of its 9 winners involves trading. Jane Street's few hackathon prizes went to "products that work". Only Optiver and Squarepoint ran trading simulators.

## What the winners had in common (inferred across the reports)

1. **Real, named, messy data.** They stated where it came from, how big it was and how fresh. Live or real data beat synthetic: map.it used generated data and came second to Pelagos's live ship tracking.
2. **A precise question and a named method.** Examples: Monte Carlo, ARIMA, kernel density, auctions, a water-balance model. They also named one statistical pitfall and fixed it, such as data leakage, missing labels or a 2008-recession control.
3. **Numbers computed by code; AI only explains them.** This held across the data-company and HackLondon winners.
4. **Honest handling of bad data.** Missing data, errors and duplicates were handled and shown. Marshall Wace: "handle errors gracefully and account for missing data", "modular and reproducible", "visualize and monitor the data".
5. **A decision at the end.** Citadel rubric: "asked a precise question, chose a defensible method, handled the data honestly… a conclusion someone could act on." "What-if" simulators won 4 of 5 HRT UK prizes.
6. **Visible correctness.** Tests, seeded runs, measured speed (queries/sec, latency) and a short write-up. Jane Street: approach over answer, "regressions are just diffs".
7. **Risk over profit in trading tasks.** Optiver: "best trading strategy… (not the team that makes the most money)".

**Warning seen in the code:**
- Many winners' write-ups overclaim: "live" prices that were mock data, unused libraries, accuracy inflated by train/test leakage.
- Judges mostly see the demo, so they rarely catch it.
- **Our edge:** be the team whose claims survive a code read. Label simulated data as simulated.

## What the firms say they want (their own words)

| Firm | Expectation |
|---|---|
| HRT | "rigorous statistical analysis to vast quantities of … data"; "understand the provenance of the data"; "Garbage in, garbage out"; most hires have no finance background |
| Citadel | precise question, defensible method, honest data handling, actionable conclusion; report + code |
| Two Sigma | scientific method, "systematically test and expand hypotheses" |
| SIG | "mathematics, statistics, and programming" on real-world data; ideas over finance knowledge |
| Marshall Wace | pipelines that handle missing data, are modular and reproducible, and are monitored |
| QRT | judged on correctness, insight, creativity, polish |
| G-Research | "find patterns in noisy, real-world datasets" with "rigorous scientific methodology" |
| Jane Street | how you think, careful bug-free code, tests, a clear write-up; no finance or OCaml needed |

## What our app can do with its data (recommendation)

**Data we actually have** (verified-live; see `../snowflake-real-projects/live-account-check.md`):
- `USERS`: profiles with offers/seeks tags
- `LOCATIONS`: the latest position only, with an accuracy radius and an update time
- `REQUESTS`: invitations with status and timestamps
- `OVERTURE_MAPS_PLACES`: tens of thousands of real, messy places in a 4 × 4.5 km area around Bush House, mostly firms and offices

**Ideas ranked by fit to the patterns above and by effort in the time left:**

1. **A transparent match score** (patterns 2 and 3). Replace any opaque "best match" with a formula computed in Snowflake SQL:
   - tag overlap both ways (my offers ∩ your seeks, and the reverse)
   - multiplied by a distance decay
   - multiplied by location freshness

   Show the breakdown on the person card. Any AI text only explains the score. *Effort: small.*
2. **An "Under the hood" data panel** (patterns 4 and 6). Show:
   - the exact SQL and the row counts
   - query latency
   - rows dropped and why: stale location older than N minutes, accuracy worse than X m, no tags
   - a "demo bot" label on synthetic people

   This answers Marshall Wace's "monitor the data" and HRT's "provenance". *Effort: small.*
3. **Bad-data handling as a feature** (pattern 4). Show:
   - the GPS accuracy radius as needle wobble
   - stale positions faded
   - Overture duplicates removed and low-confidence places dropped, with counts shown
   - "unknown" shown honestly instead of guessed

   *Effort: small to medium.*
4. **"Firms near you" mode** (patterns 1 and 5). Point the needle at real firms from Overture (`BASIC_CATEGORY` such as `professional_service`, `corporate_or_business_office`, `financial_service`) that match what the user seeks. It uses real messy data, the bearing comes from Snowflake `ST_AZIMUTH`, and the result is an action: "walk 300 m NE". Credit "© Overture Maps Foundation, CC BY 4.0". *Effort: medium.*
5. **A what-if simulator for organisers** (pattern 5, HRT's favourite shape). "If 150 people use the app at Bush House, how far is the median walk to a good match?"
   - **Method:** Monte Carlo in Snowflake SQL; seeded random placement inside the venue and random tag mixes, repeated N times.
   - **Output:** a distribution and a decision, e.g. "500 m radius is enough above N users".
   - **Labelling:** clearly marked simulated. *Effort: medium.*
6. **A privacy-safe heatmap for organisers.** Aggregate positions into H3 hexes, showing only hexes with 5 or more people. It reveals where networking happens without exposing anyone. The app keeps no location history, so this works on the current snapshot only. *Effort: medium.*

**Do not:**
- **Claim "live" for bots,** or present accuracy numbers that aren't backed by a measurement.
- **Show anyone's exact location.**
- **Make an acceptance-rate "model" from a handful of demo invites.** If shown at all, label the sample size.

## Gaps

- Citadel's own datathon pages and most LinkedIn pages blocked automated fetching.
- IC Hack 23/24 and Hack Cambridge 2023–26 Optiver winners are not on Devpost.
- No confirmed list of FirstYearHack 2026 sponsors beyond Snowflake. Check the opening talk.
- The Reddit/forum side was thin; most evidence is Devpost pages and code.

## Files

- [`uk-quant-sponsors.md`](uk-quant-sponsors.md)
- [`hrt-jump-drw.md`](hrt-jump-drw.md)
- [`citadel-twosigma-sig.md`](citadel-twosigma-sig.md)
- [`jane-street.md`](jane-street.md)
- [`kcl-seasons-and-data-cos.md`](kcl-seasons-and-data-cos.md)
- [`TASK.md`](TASK.md)
