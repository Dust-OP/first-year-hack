# Resource index

One list of every resource linked to this project, and where it is. Updated 21 Nov 2026, 11:50.
If something is not in this list, it has not been collected yet. Add it here when you add it to the repo.

## In this repository

| Resource | Where |
|---|---|
| Event tracks, team decisions, unconfirmed rules | [`EVENT-BRIEF.md`](EVENT-BRIEF.md) |
| Project overview | [`README.md`](README.md) |
| Folder layout and rules for agents and teammates | [`AGENTS.md`](AGENTS.md) |
| Findings index and evidence labels | [`findings/README.md`](findings/README.md) |
| Prior art: 35 hackathon and open-source compass projects | [`findings/retro-compass-prior-art/hackathon-opensource.md`](findings/retro-compass-prior-art/hackathon-opensource.md) |
| Prior art: 27 products, art pieces and YouTube builds | [`findings/retro-compass-prior-art/products-art-video.md`](findings/retro-compass-prior-art/products-art-video.md) |
| Event rules, organiser question, Snowflake features, past Snowflake winners | [`findings/retro-compass-prior-art/rules-snowflake.md`](findings/retro-compass-prior-art/rules-snowflake.md) |
| Demo-video references: 11 launch films, opening ideas, video tools | [`findings/retro-compass-prior-art/demo-video.md`](findings/retro-compass-prior-art/demo-video.md) |
| Front-end recommendation: dial, heading input, demo mode | [`findings/compass-frontend-design/RESULT.md`](findings/compass-frontend-design/RESULT.md) |
| Front-end candidates: 26 GitHub projects and demos, with source line anchors | [`findings/compass-frontend-design/github-frontend.md`](findings/compass-frontend-design/github-frontend.md) |
| Front-end candidates: 17 with community reception | [`findings/compass-frontend-design/community-reception.md`](findings/compass-frontend-design/community-reception.md) |
| Visual showcase of all 47 front-end candidates and leads: screenshots, tech, licence, what to borrow, filters | [`findings/compass-frontend-design/showcase/index.html`](findings/compass-frontend-design/showcase/index.html). Published copy: https://claude.ai/artifact/Ho9vk78aBfuxteoMkCob7N (private to its owner until shared from the page's Share menu) |
| Prior-art gallery: 59 compass projects with a picture, one-line description, link and filters (hackathon, maker, product, wearable, art, YouTube, big company) | [`findings/retro-compass-prior-art/gallery/index.html`](findings/retro-compass-prior-art/gallery/index.html). Published copy: https://claude.ai/artifact/ByEgAjRs8reZgRtRqVRKQK (private to its owner until shared). Build inputs in `gallery/tools/` |
| Demo-video material: the Safari icon from 2003 to 2026 and the compass through history, as swap clips and one continuous video each, with credits | [`video-info/README.md`](video-info/README.md). The compass media is committed. The Safari icons and videos are Apple artwork and are kept local; rebuild them with the commands in the README |
| Source notes (`E-*.json`) behind the findings | `findings/*/evidence/` |
| Research method and helper (`loop.mjs`) | [`../reference-loop/`](../reference-loop/) |
| Tools the team used or checked | [`../TOOL-INVENTORY.md`](../TOOL-INVENTORY.md) |

## Key external links

| Link | Why it matters |
|---|---|
| [luma.com/firstyearhack](https://luma.com/firstyearhack) | Official event page: date, venue, team size |
| [Introducing GPT-6 Astra (YouTube)](https://www.youtube.com/watch?v=1QNsdr-Qx_I) | The reference for the demo-video opening (1979 card, then 2026 card) |
| [X Marks the Spot (Devpost)](https://devpost.com/software/x-marks-the-spot-agbuiy) · [source](https://github.com/iancdev/xhacks) | Closest prior art; our concept must go further |
| [Cosmodial](https://cosmodial.3d2k.com) · [source](https://github.com/KilledByAPixel/Cosmodial) | MIT heading-input pattern (`js/ui/gyro.js`) recommended for the dial |
| [Overture Maps on Snowflake](https://docs.overturemaps.org/getting-data/data-mirrors/snowflake/) · [CARTO Marketplace listing](https://app.snowflake.com/marketplace/providers/GZT0ZKUCHE3/CARTO) | Free place data for real bearings with `ST_AZIMUTH` and `ST_DISTANCE` |
| [NOAA magnetic field calculator](https://www.ngdc.noaa.gov/geomag/calculators/magcalc.shtml) | Re-check the London declination figures (1979 vs 2026) before putting them on screen |

## Work in progress (not yet in the repo)

Other sessions are still working on these. Their owners will add the results; don't duplicate them.

| Work | Expected location | State at 11:50 |
|---|---|---|
| Snowflake in real hackathon projects: what Snowflake does in each, SQL and features used, roles and privileges, trial-account failures; a setup script outline | `findings/snowflake-real-projects/` | Task brief only (uncommitted) |
| Demo showcase and video brainstorming | Not decided | Clip material is ready in `video-info/` (21 Nov); the storyboard has not started |

## Kept outside the repo on purpose

The researcher keeps these on their own machine. They are not committed, for the reasons given.

| Resource | Reason |
|---|---|
| 12 frame stills from the reference launch films (GPT-6 Astra, Walkman, Casio and others) | Copyrighted commercial footage. The films are linked from `demo-video.md`; watch them there |
| YouTube captions and metadata for 9 product videos | Copyrighted transcripts. Video links are in `products-art-video.md` |
| Raw cached web pages (Devpost, Luma, hackathon galleries) and one fetched PDF | Third-party copies. The live URLs are cited in the reports |
| Third-party source files read during research (Cosmodial `gyro.js`, SteelSeries `steelseries.js`, a three.js orientation-controls fork) | Read for evaluation only. Copy code into the app only when it is adopted, with its license and commit noted (see `AGENTS.md` rule 5) |
| One-off scraping and caption scripts (about 100 lines in total) | Throwaway helpers. They have no reuse value. The two gallery build scripts are kept, in `gallery/tools/` and `showcase/tools/` |
| Safari icon images and the Safari clips and videos built from them (the media under `video-info/safari/` is ignored by git; the JSON manifests there are tracked) | Apple artwork; the repo is public. Sources, order and the rebuild commands are in `video-info/README.md` |
| Working copies of the two research tasks | The repo copies in `findings/` are the ones to read |

## Known gaps

- Reddit opinion on compass UI designs has not been read; automated access was blocked. Check it in a normal browser.
- Kickstarter comments, Bilibili and Hackster were blocked, and X was not searched.
- The event rules on entering two tracks and stacking prizes are unconfirmed. Ask the organisers.
- No candidate has been tested on a phone.
