# AGENTS.md: new-project

Instructions for any coding or research agent (Codex, Claude Code or others) and for human teammates working in `new-project/`.
This file describes this project only. It does not replace any agent's own global configuration.

## Project

- **Event:** KCL First Year Hackathon 2026, **Track 2: Retro Remix**. The theme is reinventing the compass.
- **Team:** see the repository root [`README.md`](../README.md).
- **Concept (decided 21 Nov):** a compass that points at nearby people worth working with. Point at someone to see their profile, send an in-app invitation, and after they accept both sides open the other's LinkedIn profile.
- **Stage:** demo v1 built in [`app/`](app/) (working title "Career Compass"). The final name is not chosen. Not yet run on a real phone or against Snowflake; see [`app/README.md`](app/README.md).
- **Technical direction from research, adopted in demo v1:**
  - A phone web app.
  - An SVG compass dial rotated with CSS transforms.
  - Heading input from DeviceOrientation, with the iOS permission prompt handled.
  - A no-sensor demo mode.
  - Details: [`findings/compass-frontend-design/RESULT.md`](findings/compass-frontend-design/RESULT.md).

## Architecture

The repository is `Dust-OP/first-year-hack`. This project is one folder inside it.

```
first-year-hack/                  repository root
├── README.md                     repo overview and team members
├── TOOL-INVENTORY.md             tools used or checked by the team
├── index.html, style.css         static site introducing the reference-loop workflow (not this project's app)
├── reference-loop/               shared research skill: instructions, helper scripts (loop.mjs), references
└── new-project/                  ← this project
    ├── AGENTS.md                 this file: architecture, folder roles, working rules
    ├── README.md                 human-facing overview and key research points
    ├── app/                      the web app (demo v1): Node server, API, phone UI, Snowflake setup
    ├── EVENT-BRIEF.md            event tracks as given, team decisions, unconfirmed rules
    ├── RESOURCES.md              index of every linked resource: in repo, external, in progress, kept local
    └── findings/                 all research findings and evidence
        ├── README.md             index of findings, evidence labels, what is not stored
        ├── retro-compass-prior-art/   prior art, event rules, Snowflake, demo-video references
        │   ├── SUMMARY.md
        │   ├── *.md              worker reports
        │   └── evidence/         E-*.json source notes
        └── compass-frontend-design/   front-end design and tech for the compass dial
            ├── RESULT.md
            ├── github-frontend.md       26 GitHub/demo candidates, source read, line anchors
            ├── community-reception.md   17 candidates with community reception and tech feedback
            ├── showcase/                visual gallery: index.html + img/ screenshots of every candidate
            └── evidence/
```

## Folder roles

| Path | Role | Who writes it |
|---|---|---|
| `new-project/AGENTS.md` | Project architecture, folder roles and rules for agents. Update it when folders are added or their roles change. | Whoever changes the structure |
| `new-project/README.md` | Short human-facing overview with links into `findings/`. | Anyone |
| `new-project/EVENT-BRIEF.md` | The event brief as received and the decisions taken. Update a decision's state when the team changes it. | Anyone, after a team decision |
| `new-project/RESOURCES.md` | Index of all project resources, including work in progress and what is kept out of the repo and why. Add a row when you add or move a resource. | Anyone adding a resource |
| `new-project/findings/` | **The only place for research results and evidence.** One subfolder per research question. | Research sessions |
| `findings/<topic>/RESULT.md` or `SUMMARY.md` | The decision-ready summary: recommendation, limits, adoption state, next check. | The research owner for that topic |
| `findings/<topic>/*.md` | Detailed worker reports: per-candidate data, quotes, status labels. | Research workers |
| `findings/<topic>/evidence/` | Source notes (`E-*.json`) from `reference-loop/loop.mjs note`. | Research sessions |
| `new-project/app/` | The product: a zero-dependency Node server (`server.mjs`, `lib/`), the phone UI (`public/`), tests (`test/`) and Snowflake setup (`snowflake/`). `public/compass.js` is the dial and belongs to the front-end design work. Start with `app/README.md`. | App sessions |
| `../reference-loop/` | The research method and its helpers. Do not put project findings here. | Skill maintainers |

**App checks:** run `npm test` in `new-project/app/` after changing anything under `lib/`. Never commit `app/.env` or key files.

## Working rules

1. **Research output goes to `findings/<topic>/`.** Start with the entry file. Use the evidence labels defined in [`findings/README.md`](findings/README.md), and record the inspection date.
2. **Before new research,** read [`findings/README.md`](findings/README.md) and the relevant `RESULT.md` or `SUMMARY.md`. Reuse what is still valid instead of repeating it.
3. **Never commit secrets:** API keys, tokens, cookies or passwords. This includes keys found in third-party repos.
4. **Don't commit copyrighted media** such as film stills or downloaded videos.
5. **Third-party code licenses:**
   - MIT, Apache-2.0, BSD and CC0 may be copied with attribution. Note the source and commit next to the copied code.
   - GPL, AGPL and unlicensed code is reference only.
6. **IDE folders stay out of commits** (for example `new-project/.idea/`).
7. **Several sessions may edit this repo.** Run `git pull --ff-only` before editing. Change only your own files or topic folder, and don't overwrite another session's work.
8. **Do not deploy to Vercel** unless asked (see the root README).

## Open items

- **Reddit opinion on compass UI designs** has not been read; automated access was blocked. A teammate should check it in a normal browser and add it to `findings/compass-frontend-design/`.
- **Event rules on track and prize stacking** are unconfirmed. Ask the organisers; the question text is in `findings/retro-compass-prior-art/rules-snowflake.md`.
- **The app has not been run on a phone yet.** First check: open `app/` over HTTPS on one iPhone and one Android phone, outdoors, and record what the heading does.
- **The Snowflake path has not been run.** Needs an account; then `npm run snowflake:check` in `app/`.
