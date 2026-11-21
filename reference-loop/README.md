# Resource workflow helpers

Manually invoked. Node.js 22 or later; no package installation.

The shared [SKILL.md](SKILL.md) is the entry for Claude Code or Codex. Run
`node install.mjs` to register this directory with both clients, or add
`--project PROJECT_DIRECTORY` for project-only registration. Existing unrelated
entries are preserved. The installer changes no settings, hooks or permissions.
Use `$reference-loop` in Codex or `/reference-loop` in Claude Code with a concrete
need or task path. [Current readiness and starting guide](../../projects/codex-memory-os/proposals/20261023-cross-platform-lifecycle/client-setup/READY.md)
records Windows native Codex discovery/work and the Mac mini continuation.
Claude Code on the MacBook Air was installed and discovered the skill on 2026-11-02.

## Connected local workflow

```text
node loop.mjs start TASK "problem and useful result"
node loop.mjs collect TASK github https://github.com/public-clis/bilibili-cli/issues/18
node loop.mjs note TASK SOURCE_URL "claim it supports" [EXCERPT_FILE]
node loop.mjs import TASK SAVED_OBSERVATION.json
node loop.mjs search TASK_OR_LIBRARY "pagination fork"
node loop.mjs read TASK EVIDENCE_ID
node loop.mjs resume TASK
```

The agent writes `TASK/RESULT.md` with the decision, module mapping when relevant,
actual trial and next gap. `resume` returns that context and discovered URL origins.
`search` distinguishes saved agent results, current task briefs and raw evidence;
reading a hit is separate from deciding its usefulness. Saved results precede raw
evidence at equal lexical score. Search scope is one task or immediate child tasks
in an explicit library directory; follow linked nested results or use scoped `rg`
for deeper findings. No automatic link following or model calls.

`note` embeds up to 200,000 excerpt characters and reports the original length,
truncation and raw input path. Keep that input in the task if it must travel with
the result; the path alone does not preserve the full file. `import` reuses an
identical observation and rejects conflicting content at the same source/time.
Retrieval reports malformed stored records in `warnings` with
`evidence_scan_incomplete: true`, while retaining usable results.

`node package.mjs NEW_DIRECTORY` builds a portable source folder with the procedure,
helpers, installer and result guidance. It does not register anything or overwrite files.
The [connected trial](../../projects/codex-memory-os/proposals/20261023-cross-platform-lifecycle/component-trial/RESULT.md)
records real acquisition, import reuse, preserved reply context, source routing,
saved-decision retrieval and resume. The newer starting guide distinguishes native
Mac helper execution from local agent-client and browser acceptance.

Start with [how the workflow runs](../../projects/codex-memory-os/proposals/20261023-cross-platform-lifecycle/OPERATING.md).
The current coding agent owns the workflow. Give it a problem; it collects and
reads evidence, tries the relevant operation, then returns the useful result.

## Collect useful evidence

```text
node collect.mjs github https://github.com/public-clis/bilibili-cli/issues/18 CASE.json
node collect.mjs bilibili BV11SwuzoEVf SAMPLE.json
```

`github` uses the installed `gh` CLI to read an issue and ordinary comments. An
optional final integer limits comment pages (default 2, maximum 5; 30 per page).
PR inline review threads are excluded. `bilibili` reads public metadata and one
comment sample; it merges duplicate root placements without losing embedded
replies and extracts URLs or explicit `github: owner/repo` mentions. This route
does not promise all comments or use authentication/cookie extraction.

Both commands retain source links, actual content and coverage; they do not decide
what is true. The agent reads correction replies and current original sources,
then tries the relevant task operation. Lead URLs are candidates, not automatically
trusted resources. Existing output files are preserved. Exit 2 means a partially
collected record was saved; exit 1 means the requested operation could not finish.

[Real community trial and practical fixes](../../projects/codex-memory-os/proposals/20261023-cross-platform-lifecycle/community-trial/RESULT.md).
This is the normal first path. Source-code packaging below is optional.

## Checks

```text
node --test loop.test.mjs   # loop helpers: note, read, library search, resume
node test.mjs               # file-packet prototype (FLOW.md)
npm test                    # both suites
```

## 2026-11-02 revision (Mac)

A blind comparison on two real research tasks found the original SKILL.md scored
below working without the skill (12 vs 18 and 15 vs 16 of 20). The losing runs
verified against mock data instead of a real instance, skipped the most complete
reference implementation, and could not save non-GitHub sources as evidence.
This revision makes live verification and full reading of the best implementation
the core steps, adds `note` for any source, adds a shared `library`, and makes
`read` output uniform, and requires runnable code that carries the best
implementation's edge cases. Re-run against the same no-skill reports: Panopto
19 vs 18 (faster and ~30% fewer tokens), Blackboard 15 vs 15 (tie; judge preferred
the no-skill design for keeping a byte-hash backstop). One run per cell, so 1-2
point gaps are within noise. The previous package is preserved at
`~/.codex/workflow-updates/20261102-skills/staged/payload/reference-loop` (Mac) and
`<windows-user>/.codex/workflow-updates/20261102-reference-loop-before` (Windows).

## Current maintenance

The [2026-11-07 improvement result](../../reference-library/20261107-reference-loop-improvement/RESULT.md)
records bounded-subagent research, evidence-scope/proportionality changes, helper
integrity fixes and their checks. This local shared source is used by both existing
Mac skill links; another device or a new client's actual skill execution needs its
own evidence.
