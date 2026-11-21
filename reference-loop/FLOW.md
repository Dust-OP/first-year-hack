# File-packet prototype (optional)

Moved out of README on 2026-11-02; not part of the normal workflow.
The normal entry is [SKILL.md](SKILL.md).


This small tool connects the artifacts produced by existing agents and collectors:
request → acquisition evidence → review → prepared files → module map → library
entry → consumer feedback. It does not run models, search sites, execute reference
code or dispatch remote tasks. The existing project handoff remains authoritative.

The current design and component map are in
[the resource-loop proposal](../../projects/codex-memory-os/proposals/20261023-cross-platform-lifecycle/RESOURCE_LOOP.md).

### Packet commands

From this directory, the same commands work in PowerShell and a macOS terminal
when Node is available. Only Windows has been exercised for this implementation.
The paths below are placeholders for a task's local records:

```text
node flow.mjs init RUN inputs/request.json
node flow.mjs record RUN acquisitions inputs/acquisitions.json
node flow.mjs record RUN review inputs/review.json
node flow.mjs prepare RUN inputs/selection.json roots.local.json
node flow.mjs record RUN modules inputs/modules.json
node flow.mjs publish RUN LIBRARY
node flow.mjs query LIBRARY browser
node flow.mjs inspect LIBRARY ENTRY_ID
node flow.mjs verify LIBRARY/entries/ENTRY_ID.json
node flow.mjs feedback LIBRARY inputs/feedback.json
node flow.mjs query LIBRARY browser
```

`node flow.mjs status RUN` reports committed input stages and the next missing
artifact. Once all input stages exist, it reports `publish`; publication and
adoption are inspected in the library, not inferred from that status.

Use [the real trial inputs](../../projects/codex-memory-os/proposals/20261023-cross-platform-lifecycle/trial/inputs/request.json)
as a complete example. The adjacent acquisitions, review, selection, modules and
feedback files show every stage. Copy/edit input templates for a new task before
recording them; do not reuse the trial's evidence as observations of a new task.

## Record contracts

| Artifact | Required content |
| --- | --- |
| Request | Schema version 1; task ID, positive request revision, attempt ID; owner, question, requirement IDs/text; contributor platforms, target runtime, source-policy pointer, stopping condition; candidate/file limits |
| Acquisitions | Matching identity; candidate IDs, original URLs, pinned revision or explicit capture identity, discovery path; observations with capability, method, status, coverage, locator, timestamp and summary; saved frontier |
| Review | Matching identity, reviewer; select/reject/defer; candidate, requirement and observation IDs; separate source quality, engineering quality and fit; rationale and limits |
| Selection | Matching identity; selected candidate, local root alias, portable relative path, file role and expected SHA-256 for each file |
| Local roots | Mapping from a root alias to a real local directory. This is host-local input and is excluded from publication |
| Prepared | Generated original bytes encoded as base64, SHA-256, byte count, relative path, role and source revision; retained license/source terms for each candidate |
| Modules | Matching identity; module/category/requirement IDs; prepared file and symbol anchors; input, output, errors, dependencies, integration, reuse mode, validation scope and unknowns |
| Feedback | Published entry and matching task identity; receipt ID, consumer, module IDs, adopt/adapt/reject/defer, reason, evidence, runtime and remaining gaps |

These validators implement the deliberately narrow v0.1 contract in `flow.mjs`.
They do not claim full compatibility with the ZIP's proposed JSON Schemas. The
sample maps one known code reference; non-code assets need an explicit preparation
contract before extending this code-reference path.

## Persistence and portability

- Each run has immutable stage records. Repeating identical input is safe;
  conflicting content is rejected. A corrected task uses a new attempt directory;
  requirement changes also increment the request revision. Merge decisions belong
  to the integrator, not to an automatic last-writer-wins rule.
- Complete bytes are staged, flushed and exposed through an exclusive hard link.
  `.staging` files are retained, never treated as committed inputs, and are not
  automatically deleted. This is a local-filesystem prototype; filesystems that
  do not support hard links are unsupported. It is not a distributed transaction
  system or a claim of power-loss durability.
- Each publication is one JSON file named by the SHA-256 of canonical content.
  That file contains the selected source bytes and can be copied independently.
  Run `verify` on the receiving device. Feedback files are separate; transfer them
  too when a consumer needs adoption history. Only a local relocation was tested.
- Hashes check integrity, not sender authenticity. Records may contain arbitrary
  author-supplied notes; keep credentials and private session content out of them.
- Source selection refuses path traversal, platform-unsafe names, source drift,
  symlinks/junctions and missing retained terms. It assumes trusted local source
  and output directories; it is not a sandbox against concurrent hostile edits.
- Selection preserves source bytes. It does not perform destructive cleanup,
  dependency resolution or compilation. A subset is not a complete build.
- Limits: 8 MiB per JSON record; 4 MiB of selected raw files. Candidate/file counts
  are enforced; elapsed time, API quotas, agent budgets and stopping decisions
  remain with the invoking agent. Query scans the small local catalog; no semantic
  index, remote locking, scheduler, auto-retry or automatic source promotion.

## Verification and observed use

```text
node --test test.mjs
```

Nine checks passed on Windows / Node 22.14.0: complete local flow and feedback,
repeat/conflict behavior, stale results, failed evidence, incomplete publication,
source/path/hash/terms boundaries, junction escape, invalid module anchors and
real CLI exit behavior. The test fixtures are synthetic and retained in the
temporary directory printed by the test runner.

The [actual browser trial](../../projects/codex-memory-os/proposals/20261023-cross-platform-lifecycle/trial/RESULT.json)
used an existing native agent-browser executable and dedicated visible Chrome to
read its first-party commands page. Ten CLI operations connected the real evidence,
six selected source files, publication, query and adoption readback. Source-review
and installed-binary evidence are labeled separately; no rebuild was performed.

`pilot-local-browser.mjs` reproduces that bounded trial only when explicitly given
an existing clean checkout, installed executable, new destination and a previously
opened `reference-component` tab at `https://agent-browser.dev/commands`. It is
not the general collector. Mac execution and product acceptance remain untested.
