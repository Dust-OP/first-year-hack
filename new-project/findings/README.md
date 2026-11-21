# Findings

All research findings and evidence for this project live here: one folder per research question.
Nothing in this folder is product code. Each entry file records its own adoption state and approval date.

| Folder | Question | Start with |
|---|---|---|
| [`retro-compass-prior-art/`](retro-compass-prior-art/) | What compass reinventions already exist? What are the event rules, the Snowflake options and the demo-video references? | [`SUMMARY.md`](retro-compass-prior-art/SUMMARY.md) |
| [`compass-frontend-design/`](compass-frontend-design/) | Which front-end designs and tech should the compass dial use? (41 candidates from GitHub, Hacker News and design communities) | [`RESULT.md`](compass-frontend-design/RESULT.md) |
| [`snowflake-real-projects/`](snowflake-real-projects/) | What does Snowflake actually do in real hackathon projects (source read, 19 projects), which roles do they set up, and what should our app's role/setup be? | [`RESULT.md`](snowflake-real-projects/RESULT.md) |
| [`linkedin-integration/`](linkedin-integration/) | What does Sign In with LinkedIn return (and not return), how must the sign-in be built, and what do LinkedIn's API terms allow us to store? | [`RESULT.md`](linkedin-integration/RESULT.md) |

## Layout of a findings folder

- **Entry file:** `RESULT.md` or `SUMMARY.md`. It holds the recommendation, the limits, the adoption state and the next check.
- **Worker reports:** `*.md` files with the per-candidate detail (URLs, versions, license, quotes, status labels).
- **`showcase/`** (optional): a visual gallery, `index.html` plus `img/`, showing what each candidate looks like.
- **`evidence/`:** `E-*.json` source notes recorded with the reference-loop helper (`loop.mjs note`). Each note names its source URL, the claim it supports and the observation time.

## Evidence labels

Claims are labelled by how they were checked:

- **verified-live:** run on the real target.
- **verified-local:** run locally.
- **verified-in-source:** the implementing code was read.
- **verified-in-spec:** only documentation was read.
- **inferred:** reasoned from cited evidence.
- **unverified:** not yet checked; the exact next check is given.

Status labels in the worker reports follow the same idea. "Source read" or "thread read" means the source was opened; "lead only" means it was only seen in search results.

## What is deliberately not stored

- **Frame stills from commercial launch films:** kept privately by the researcher, for copyright reasons.
- **Downloaded media:** not stored.
- **Secrets and API keys:** never stored, including keys found inside third-party repos.

The working copies of these tasks are also kept in the researcher's local reference library. **This folder is the copy the team should read.**
