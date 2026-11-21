# Retaining a useful result

Write RESULT.md in the task folder in plain English. Adapt the structure to the
task; do not create empty forms for stages you did not use.

- **Decision and use:** what helps the current development need, what was adopted,
  adapted, used only as a reference, rejected, or remains unresolved.
- **Community feedback for recommendations:** inspected original reports/replies,
  version/date relevance and how they affect the choice; if useful feedback was
  not found, state the actual search scope and gap. Keep reported experience
  separate from verified technical behavior; no fixed platform checklist.
- **Evidence:** stable source/comment links and saved evidence IDs; affected dates,
  version/runtime, important corrections, and incomplete coverage. Label decisive
  claims using SKILL.md's source, local, live, inferred or unverified distinctions.
  Inspection date is not publication date; a copied or stale result needs a fit check.
- **Module mapping when relevant:** requirement → original file/symbol and revision
  → inputs/outputs → required dependencies → integration location and remaining work.
- **Repository-backed claims:** include or link the trace required by
  [repository reading](repo-reading.md): established entry, connected calls/data/state,
  branch outcomes, read coverage, boundaries and unresolved edges. Source-only
  completion and executed behavior must remain distinct.
- **Solution/integration recommendations:** show documented capability → target
  repo/package version → implementing module/symbol → inspected behavior and limits.
  Separate `verified-in-spec` from `verified-in-source`; state any document/code
  disagreement or unavailable source. Documentation alone leaves the implementation
  review incomplete even when it gives a plausible answer.
- **Actual trial:** operation performed, expected vs observed behavior, environment,
  and its limits, with a command/request and evidence path. Disclose fixtures/mocks.
  Distinguish inspected code from executed code and target acceptance. If no trial
  was needed or available, say so without inventing a passing result.
- **Next action:** the specific remaining gap, responsible active writer and resume
  context if handed off. Preserve pauses and explicit user decisions. Stop if the
  useful result is sufficient; unresolved claims need the exact check that settles them.

For delegated work, link the worker artifacts and the evidence checked by the
integrator. Proposed adoption, implemented changes and user/runtime acceptance are
different states; record the one actually supported.

Put searchable capability names in the prose. Preserve a dated decision that is
later corrected in a compact history note rather than silently rewriting evidence.
The existing project/library remains authoritative; this task folder can link back
to it instead of creating a competing project memory system.

Retaining the result does not require retaining every raw source. For descriptions
and comments, source IDs/links, parent context, inspected excerpts and coverage can
support the decision. Distinguish batch acquisition from actual agent reading and
state whether returned comments were a sample or an exhausted accessible scope.
