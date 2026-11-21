# New project

The team's FirstYearHack 2026 project: **Track 2, Retro Remix**, built around reinventing the compass.
Name, language and final scope are still to be decided.

## Research (21 Nov 2026)

Prior-art and planning notes are in [`research/`](research/). Start with [`research/SUMMARY.md`](research/SUMMARY.md).

| File | Contents |
|---|---|
| [`SUMMARY.md`](research/SUMMARY.md) | Recommendation, open gaps, risks, limits |
| [`hackathon-opensource.md`](research/hackathon-opensource.md) | 35 hackathon and open-source compass projects (Devpost, GitHub, Hackaday) |
| [`products-art-video.md`](research/products-art-video.md) | 27 products, art pieces and YouTube builds |
| [`rules-snowflake.md`](research/rules-snowflake.md) | Event details, rules precedent, organiser question, Snowflake features, past Snowflake winners |
| [`demo-video.md`](research/demo-video.md) | Launch-film references (GPT-6 Astra 1979 → 2026 opening), checked 1979 facts, 3 opening ideas, video tools |

Key points:

- **"A compass that points at X instead of north" has been built 60+ times.** The closest is *X Marks the Spot* (XHacks 2026, retro theme, no prize). We need a stronger twist.
- **Nobody seems to have built yet:** an agent that turns free-text intent into one bearing after checking live facts (open now, in stock, quiet), re-plans when the target changes, and acts on arrival. Also open: needle wobble as uncertainty, real historical navigation (declination, the needle settling) as the interaction, and pointing at data or trends.
- **Demo risk:** phone compasses can be off by more than 100° indoors. Build a simulated-heading demo mode first.
- **Snowflake:** `ST_AZIMUTH`/`ST_DISTANCE` plus Overture Maps Places (free on Marketplace) give bearings to real places on any trial account. AI functions and the Cortex Code CLI are off on plain trials, so ask the Snowflake reps for credits.
- **Rules (inferred, not confirmed):** enter one main track only; the sponsor prize probably stacks. Ask the organisers using the question in `rules-snowflake.md`.
- **Video:** probably 2–3 min with a narrated live demo. Keep the cinematic 1979-vs-2026 opening to 15–40 s. Re-check the declination numbers (London ~6°W in 1979, ~1°E in 2026) on NOAA's calculator before showing them on screen.
