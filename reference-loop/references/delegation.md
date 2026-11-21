# Bounded research delegation

Use when independent reading or verification is large enough to benefit from
available, authorized subagents. Keep a small lookup with the main agent. Check
the current host's tools; a configured service or copied skill is not proof that
a worker can run. If no worker is available, perform the same bounded task locally.

Split by decision-relevant questions, such as an implementation route, a conflicting
claim, or a failure mode. Do not send every worker the same broad survey. A fresh
worker with selected context is useful for independent review; do not copy the
whole conversation when a focused brief and source paths suffice.

## Brief

Supply the following in ordinary prose, omitting fields that do not matter:

- Question and the decision the answer will inform.
- Target versions/runtime, relevant user constraints and existing authorization.
- Selected local evidence paths, primary sources and known exclusions.
- Read/write scope, a separate artifact path and who integrates shared state.
- Expected output, research budget if agreed, and stopping condition.

For adoption recommendations, assign the community-feedback check to a worker or
the main agent. Supply task-relevant source options with useful operations/access
limits, including video/social sources when useful; let the researcher choose
sites and queries. Return inspected feedback, applicability and its effect on the
recommendation, or the actual search scope and evidence gap. See
[feedback guidance](source-tools.md#community-feedback-for-recommendations).

Example: “Determine whether library X handles the empty-response case on version Y.
Inspect these two source modules and tests, then run a minimal local check if useful.
Do not change product code or access accounts. Save details in TASK/workers/empty.md.
Return the answer, source symbols/revisions, expected vs observed, remaining gap and
artifact path. Stop when the case is settled or a concrete blocker is identified.”

## Return and integrate

Workers return a concise recommendation, decisive source/evidence pointers,
version/date applicability, contrary evidence, actual search/test coverage, and
what remains uncertain. Put verbose retrieval and logs in artifacts, not the parent
message. Distinguish discovered leads, inspected sources and executed checks.

The main agent reads the decisive evidence and reconciles disagreements before
adoption. An unsupported worker assertion needs a source or check; another vote is
not verification. Reuse a worker's valid execution evidence rather than rerunning
everything. Record actual ownership and live operations before handing off.

Give each writer separate files. Keep shared RESULT.md and canonical project state
under one integrator; re-read them before merging. Further work needs a remaining
question and a bounded follow-up, not an automatic agent chain.

For repository reading, give each worker named operations/questions and source
identity, and require the [source trace and completion check](repo-reading.md).
File lists and unsupported summaries do not satisfy this handoff. Split by separate
operations or entry/caller versus outcome/failure paths; the integrator must connect
the returned paths and retain any gap between them.

For technical solution research, explicitly assign the implementing-module check
to a worker or the main agent. A docs worker's answer cannot close that assignment.
The integrator verifies the capability-to-module mapping and keeps documented,
source-inspected and runtime-observed claims separate. The worker should report
unavailable source as a gap, not silently return docs as an implementation review.

Delegation can reduce main-context noise and elapsed time; it does not guarantee
lower total token use. Report measured cost only when telemetry is available.
