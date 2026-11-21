# Retro compass — FirstYearHack 2026 prior art

Date: 21 Nov 2026 (event day; submissions 18:00). Owner chose Track 2 Retro Remix, compass theme.

## Recommendation
- Don't pitch "a compass that points at X instead of north": 60+ prior builds (Devpost 2016–2026, Kickstarter, YouTube).
  Closest: X Marks the Spot (ESP32 + Gemini picks a place, XHacks 2026, retro theme, no prize).
- Open ground (nothing found built): an agent that turns free-text intent into one bearing after checking live facts
  (open now, in stock, quiet) via browser automation, re-plans when the target closes, and acts on arrival;
  needle wobble as uncertainty; real historical navigation (declination, needle settling) as interaction;
  pointing at data/trends; web-only (phone sensors) so there's no hardware risk.
- Indoor demo risk: phone compass bent >100° indoors (CampMap). Build a simulated-heading demo mode first.
- Snowflake: ST_AZIMUTH/ST_DISTANCE + Overture Maps (CARTO, free Marketplace) give bearings to real POIs with no AI
  needed. No past Snowflake winner used geospatial. Trial accounts: AI functions and Cortex Code CLI are off without
  card/separate trial; ask Snowflake reps for credits.
- Rules (inferred from KCL Tech precedent, not stated): one main track only; sponsor prize likely stackable.
  Ask organisers (question text in rules-snowflake.md). Last year's video rule: 2–3 min YouTube with live
  demo and voice narration, so keep the cinematic 1979-vs-2026 part short.

## Evidence
- hackathon-opensource.md — 35 projects (34 page-read)
- products-art-video.md — 27 items (products, art, video captions/comments)
- rules-snowflake.md — event page, rules precedent, Snowflake docs, 6 past winners
- demo-video.md — 11 launch films; owner's "astra 6" = OpenAI "Introducing GPT-6 Astra" (3 Sep 2026, 2:43),
  1979 card -> 2026 card same-room remake (main agent checked metadata + frame sheet). Recommended opening:
  "same street, different north" — London declination ~6.0°W (1979) vs ~1.2°E (2026), NOAA model per worker;
  re-check on NOAA calculator before putting numbers on screen. Keep cinematic part 15–40 s, total <=2:30.
- Main agent re-checked: Luma page, X Marks the Spot, Agora, CampMap pages, Terra GitHub issues, ST_AZIMUTH docs.

## Limits
Reddit, Kickstarter comments, Bilibili, Hackster blocked; X not searched (no login). No organiser confirmation of rules.

## Status
Approved by the project owner on 2026-11-21. Concept chosen the same day: a compass that points at nearby people worth working with (built as demo v1 in `app/`). Still open: the organiser rule check on track and prize stacking (question text in rules-snowflake.md).
