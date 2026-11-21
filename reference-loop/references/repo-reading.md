# Reading a repository to support a decision

Use for technical solution selection/adaptation, integration design, feasibility or
compatibility judgments, and explanations of actual behavior or failures. Whether
the user says "read the repo" is not the trigger: the requested decision determines
the need for code evidence. The output is a reconstructable explanation of the named
operation, with source anchors and visible unknowns. Complete this route before
calling such a claim source-traced. A candidate found in docs remains a documented
candidate until its implementing module has been inspected.

## Map documentation to implementation

For each capability that supports a recommendation, identify its official project
or package, the installed/release version being evaluated, and the implementing
module and symbol. Use package metadata, source links, exports, routes or symbol
search to establish the mapping. Read that implementation through the steps below.
A link to a repository root, README, type signature, example or test alone does
not show how the product implements the capability. Tests supplement the trace.

Keep the documented promise and the observed source behavior separate. Record
agreement, implementation conditions, version mismatch or contradiction. Source
is evidence for that inspected revision; it does not silently replace a public
contract or prove that a different deployed build behaves the same way.

Reuse a retained implementation trace only when its module/revision and conclusion
still fit. An old `verified-in-source/spec` label is ambiguous: inspect its actual
evidence before counting it as code reading. Do not let a docs-only saved answer
satisfy an implementation-required question.

For a supplied public GitHub repository, reading its code is the normal next step.
Reuse a local checkout or retrieve the named revision's files through the repository
viewer, raw-file route or available GitHub API/CLI. A failed web rendering or search
snippet does not make the repository unavailable: try an available alternate read
route and report the exact failed path/status if still blocked. Do not silently
fall back to README-only research. A new full clone is not required when direct
file access supplies the implementation and its callers.

If source is closed, remains inaccessible or cannot be located, record where/how
it was sought and the result. Return the documented contract and any authorized
black-box observations with that limit. Leave implementation verification unavailable
or incomplete; do not invent code, substitute a similar project as this product's
implementation, or silently narrow the task to a documentation summary. A bounded
partial recommendation is allowed; a claim that the module was reviewed is not.

## 1. Fix the question and source identity

Write the operation and questions being answered before tracing. Name the selected
runtime/configuration and the outcomes the answer must distinguish. Preserve the
requested scope; record a narrower answer explicitly rather than silently dropping
a question. For example: "For this exported operation, does the configured retry
limit apply after success, an ordinary error, and the named special error?"

Record repository/path and commit/tag. Check local changes in the files used; if
there is no Git identity or files are modified, record version plus file identities
for the inspected content. Use the existing checkout. Read its instructions,
manifest/entry declarations, configuration and directory layout to locate the code.
Do not claim that a current upstream page describes an older installed copy.

## 2. Establish the entry and read complete code units

Identify the callable entry, command, route, event or job that starts the operation.
Show the registration/export/dispatch or caller that selects it in the named
configuration. A similarly named function or README example does not prove this.
For an exported library API, its actual export plus the inspected public call
contract can establish the boundary; an unknown consuming app remains unverified.

Use search to locate definitions/references, then read the complete function,
method or top-level executable block being traced, including its guards, early
returns, catches and finally blocks. Read referenced configuration/defaults and
type definitions that supply the operation's inputs or state. Fetch omitted chunks
when tool output is truncated. A full-file claim requires the whole file to have
been read; otherwise identify the actual units/ranges read.

## 3. Trace calls, inputs, state and completion across files

Build a compact execution path starting at the established entry. For each unit:

- Follow each call, await, callback registration, emitted event and scheduled job
  that computes the named outcome, changes its deciding state or performs its I/O.
  Pair event registration with the handler and emitted event; show the dispatch or
  factory selection for dynamic calls. Do not bridge a missing edge from its name.
- Trace inputs upstream through the caller, constructor, config merge and defaults
  until their origin and override order are recorded. An external input may end at
  the inspected public contract; show how the implementation consumes it.
- For each state field controlling the outcome, locate initialization, writes and
  reset/cleanup. Record the transition and its trigger. Search references to the
  traced entry and these fields within their owning modules/package; account for
  other callers, aliases or handlers that change the outcome. Record searched paths
  and dynamic-reference limits. If those paths cannot be resolved, limit the claim
  to the inspected caller and state conditions instead of claiming all callers.
- For timers, listeners, resources or jobs that control the named outcome, repeat
  work or a promised lifecycle behavior, identify success, error and cancellation
  disposal, or mark a missing disposal path as a finding. Give an exclusion reason
  for resources that cannot affect those claims.
- Follow each return, thrown error, callback completion or state transition back
  to its caller/consumer until the externally visible outcome is explained.

Each outgoing edge must be one of: **traced** to another source anchor;
**boundary** with a named dependency/version and inspected contract supporting the
claimed effect; **excluded** with the specific question/result it cannot affect and
the source reason; or **unresolved** with its impact on the answer. If exclusion
depends on an assumption, mark that assumption unresolved or narrow the claim.
List edges individually when their dispositions differ; equivalent logging or
formatting calls can share one exclusion with the read code units identified.

A boundary cannot hide the behavior being investigated. If the answer is about a
dependency's retry policy, reading its caller's method name does not close that
question: inspect that dependency implementation, or leave that claim unresolved.
External systems and unavailable generated/native code need the same treatment.

Reuse an already traced unit or inspected contract by linking its record. For a
cycle, record the backedge, changed inputs/state and the condition that continues
or exits it; do not reopen the same code indefinitely. Expand only edges that can
change the named outcome or lifecycle promise, retaining the exclusion reasons.

## 4. Account for branches and check the explanation

For each control-flow decision in the read path, record its condition and outcomes
when it changes the answer, deciding state, external effects or completion. Include
early exits and exception handlers. Give a source reason for excluded decisions.
Cover all outcomes of those decisions; combine ones that provably have the same
effect. Unreachable cases need the caller guard or contract that makes them so.
Do not invent cases unrelated to this operation or enumerate every combination.

Locate existing tests/examples for these outcomes. Read the setup and assertions:
state which behavior they establish, which they mock and which outcomes are missing.
Before a selected check, write the expected observable result derived from the
trace; then run the existing check or smallest reproducer and compare observations.
Choose a check that can distinguish the competing interpretations or failure being
investigated. Tests merely present on disk are source evidence. When execution is
unavailable, name the missing prerequisite and retain the exact unrun check.
A disagreement reopens the affected trace instead of being explained away.

## 5. Retain the trace and apply the completion check

Keep one compact section in the existing RESULT.md, or link one source-reading
note. Do not duplicate project state or create a form per function. Include:

| Record | Required content |
| --- | --- |
| Scope and identity | Questions, runtime/configuration, repo revision and local changes |
| Read coverage | Read file/symbol/ranges; distinguish complete units, search-only hits and unread areas |
| Execution/data/state path | Caller → callee/event → result; source anchors, input/default origins and state transitions |
| Branch outcomes | Conditions → behavior → source anchors; test/probe support or explicitly untested |
| Boundaries and gaps | Edge disposition, supporting contract/exclusion reason, unresolved impact and next check |
| Decision | Claim → trace/observation; adoption mapping if requested; confidence limited to the actual evidence |

Source anchors include file, symbol and revision; use line spans or permalink
anchors so a reviewer can reopen the exact control flow. A list of files without
the relationships and effects above is not a completed source investigation.

For **each claim**, completion requires an established entry, a continuous path to
its outcome, input/state origins, branch outcomes and a disposition for every edge
encountered along that path. No unresolved edge may be hidden behind that claim.
If an unresolved dependency could change it, keep the claim provisional and name
the missing read/check. A blocked investigation can end with a partial result;
it cannot report that all requested behavior has been understood.

Keep source tracing, local execution and target acceptance separate. Finishing the
source trace with an unrun test can support an explicitly source-only conclusion;
it cannot support a live verification claim or a passed behavioral check.

For delegated reading, pass the operation/questions and source identity. Workers
return this trace plus gaps. The integrator reopens the entry/wiring, the branch
that determines the recommendation and its final outcome; check that the anchors
support the worker's conclusion. Resolve a missing edge through a bounded follow-up
or retain it as unresolved. Worker agreement and file counts are not substitutes.
