# TASK-002 Architecture Review

## Identity

- Task ID: TASK-015, round 1
- Role: reviewer
- LLM family: gpt
- Branch: `agent/gpt/reviewer/task-015`
- Worktree: `C:/Users/furko/Desktop/multi-agent-worktrees/gpt-reviewer-task-015`
- Review target: TASK-002 at commit `9576fc9`
- Base ref: `agent/claude/orchestrator/task-001`
- Commit or pull request: pending at report creation; no push or merge is part of this review

## Outcome

Verdict: `changes-required`.

The architecture establishes clear module ownership, an explicit state machine, durable checkpoints, provider boundaries, deterministic bootstrap, and a useful recovery model. It is not safe to implement yet. Four high-severity contract defects would otherwise permit a partially persisted event batch, make valid crash-recovery cases fail the documented state machine, leave foreground provider processes alive after pause or timeout, and make the runtime unable to represent the typed gate and resource dependencies used by the corrected task graph.

TASK-003 through TASK-008 and TASK-017 must remain `blocked` on the strength of this verdict. The Architect should resolve the findings through TASK-016 or a replacement architecture-amendment task, after which this reviewer must perform round 2 against the immutable amendment commit.

## Findings

### A-001 — High — A multi-event journal append is not crash-atomic

- Locations: `docs/architecture/runtime/DURABLE-STATE-AND-CHECKPOINTS.md:36-64`; `docs/architecture/runtime/STATE-MACHINE.md:175-183`; `docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md:57-67`; `docs/architecture/runtime/CRASH-RECOVERY.md:13-22,66`
- Responsible owner: architect; implementation would be owned by TASK-003

The append protocol serializes multiple newline-delimited event envelopes into one buffer and then writes and fsyncs it. It claims that validation before the write makes the persisted batch all-or-nothing and that a crash before fsync leaves the whole batch absent. Filesystem append and fsync provide durability, not transaction atomicity for an arbitrarily sized buffer. A crash can persist one or more complete, checksum-valid lines and a torn final line. The restore rule discards only the torn tail, so it can retain a valid prefix of a bootstrap or recovery batch.

This violates the stated batch post-condition and can leave a run bootstrapped without `RunStarted`, or recovery with only some lease/effect decisions applied. Define a recoverable batch boundary, such as a batch identifier plus durable commit record, a length-prefixed/checksummed transaction frame, or one atomically replaced segment file. Restore must expose either every event in the committed batch or none. Add crash-point tests after every partial write boundary and before/after the commit marker.

### A-002 — High — Recovery emits transitions that become illegal after lease reclamation

- Locations: `docs/architecture/runtime/STATE-MACHINE.md:95-124,126-140`; `docs/architecture/runtime/CRASH-RECOVERY.md:37-66`; `diagrams/architecture/runtime-sequences.md:118-127`
- Responsible owner: architect; implementation would be owned by TASK-006 and TASK-008

Phase 4 emits `LeaseExpired`, which moves a `running` task to `ready`. Phase 5 then emits `WorkerSucceeded` for a committed effect or `TaskBlocked` for an indeterminate non-idempotent effect. Both events are legal only from `running`; they are illegal from the `ready` state created earlier in the same batch. Phase 6 can similarly emit `TaskTimedOut` for a task that Phase 4 already moved to `ready`, although `TaskTimedOut` is legal only from `running`.

The documented all-or-nothing recovery batch therefore rejects ordinary crash cases instead of completing recovery. Define recovery-specific transitions whose guards and record effects are explicit, or determine the final reconciliation outcome before emitting exactly one legal task transition. Add transition-table and batch-order tests for every combination of lease state, ledger state, and elapsed deadline.

### A-003 — High — Live control and provider process-tree ownership are unspecified

- Locations: `docs/architecture/runtime/LIFECYCLE-AND-BOOTSTRAP.md:85-111,132-140`; `docs/architecture/runtime/PROVIDER-ADAPTERS.md:119-163`; `docs/architecture/runtime/INTERFACE-CONTRACTS.md:398-485,542-573`; `docs/adr/0009-graceful-pause-drain-and-crash-recovery.md`
- Responsible owner: architect; implementation would be owned by TASK-004, TASK-006, TASK-007, TASK-008, and TASK-017

The lifecycle says that a second `pause` or `stop` command delivers a control request to a running foreground supervisor, but it defines no transport, request identity, acknowledgement, durable ordering, authentication/ownership check, or stale-request behavior. More importantly, the drain deadline deliberately abandons in-flight tasks without defining how the adapter's entire OS process tree is tracked and terminated. Fencing prevents a stale result from mutating state, but it does not stop a detached Claude, Codex, or Gemini child process from continuing to consume resources, edit a worktree, or perform external effects after the supervisor exits.

Define one cross-platform live-run control protocol and one process-tree lifecycle contract. Each invocation needs a durable invocation identity, owned process group or Windows Job Object equivalent, graceful cancellation, bounded escalation, verified tree exit, and a persisted outcome before the writer lock is released. Pause may leave resumable task state, but it must not return while an unmanaged descendant remains. Recovery must detect and safely fence or terminate an orphan belonging to the recorded invocation. Tests must include a child that spawns a grandchild, ignores the first cancellation, and outlives the command timeout.

### A-004 — High — Runtime dependency contracts cannot represent the corrected task graph

- Locations: `docs/architecture/runtime/INTERFACE-CONTRACTS.md:64-140,178-220,340-380,489-526`; `docs/architecture/runtime/STATE-MACHINE.md:64-75,99-124,160-173`; `docs/architecture/runtime/LEASES-AND-SCHEDULING.md:70-93,110-116`; `tasks/TASK-001-DEPENDENCY-GRAPH.md:7-37,129-177`
- Responsible owner: architect; implementation would be owned by TASK-003, TASK-005, TASK-006, and TASK-013

The architecture models dependencies as task identifiers satisfied only when every target task is `succeeded`. The corrected decomposition uses typed scheduling and gate edges with distinct satisfying conditions, plus named resource locks that serialize scopes even when path globs are not sufficient. The runtime contracts contain no edge type, target condition, gate verdict, recurring event activation, waiting/quiescent state, or named resource-lock representation.

Implementing the architecture as written would either deadlock pre-merge review gates or release consumers before their independent gates pass, and it could continuously redispatch recurring lifecycle work. Amend the task, event, scheduler, and completion contracts to represent at least review-ready publication, integrated/merged readiness, independent gate verdicts, named resource locks, and monotonic event-triggered recurring work. Prove acyclicity across scheduling, review, and integration preconditions, and test idle quiescence and exactly-once activation.

## TASK-002 acceptance-criterion judgments

| Criterion | Judgment | Evidence |
|---|---|---|
| Every named component maps to one TASK-003 through TASK-008 owner with no shared module ownership | `not met` | The documented six modules have unique owners, but live-run control and process-tree ownership are required runtime responsibilities with no owning module or interface (A-003). The already-recorded workspace-lifecycle gap also requires TASK-016/TASK-017. |
| Explicit run/task transition table, terminal states, and illegal transitions | `met with blocking inconsistency` | `STATE-MACHINE.md:21-58,79-158` is explicit and total on paper, but its legal transitions cannot execute the recovery sequence (A-002). |
| Observable checkpoint, resume, lease, fencing, idempotency, retry, timeout, and recovery pre/post-conditions | `not met` | Most contracts are observable, but append atomicity, recovery ordering, and process termination post-conditions are false or absent (A-001 through A-003). |
| Cross-task interfaces are stable enough for parallel implementation | `not met` | The interfaces are extensive, but omit typed dependency/gate/resource-lock/recurring activation semantics and process-tree control (A-003, A-004). |
| One-input bootstrap has one input, deterministic output, and creates the Manager task without another operator step | `met` | `LIFECYCLE-AND-BOOTSTRAP.md:5-67` defines the single brief, pure bootstrap plan, Manager record, run-local output path, and initial events. Its claimed batch durability still depends on A-001. |
| Every cross-cutting decision has an ADR with context, decision, alternatives, and consequences | `met` | ADR-0001 through ADR-0010 were reviewed. Each uses the required structure; no duplicate decision contradiction was found. ADR-0009 requires amendment for A-002/A-003. |
| All authored files stay inside the Architect write scope | `met` | The target commit changes only `docs/architecture/**`, `docs/adr/**`, `diagrams/architecture/**`, and `docs/architecture/ARCHITECTURE.md`. |

## Artifact coverage

All 25 target files were covered.

| Artifact | Result |
|---|---|
| `docs/architecture/ARCHITECTURE.md` | Reviewed; summary is coherent, but its atomicity and pause/recovery claims inherit A-001 through A-003. The stale toolchain gap is now resolved by human commit `fb9f45c` and must be reconciled by the Orchestrator. |
| `COMPONENT-BOUNDARIES.md` | Reviewed; unique ownership is clear. Missing live-control/process-tree responsibility contributes to A-003. |
| `INTERFACE-CONTRACTS.md` | Reviewed; A-003 and A-004. |
| `STATE-MACHINE.md` | Reviewed; A-002 and A-004. |
| `DURABLE-STATE-AND-CHECKPOINTS.md` | Reviewed; A-001. Checkpoint rename/checksum recovery is otherwise well specified. |
| `LEASES-AND-SCHEDULING.md` | Reviewed; fencing and bounded concurrency are clear. Dependency/resource semantics are incomplete under A-004. |
| `PROVIDER-ADAPTERS.md` | Reviewed; provider isolation and error taxonomy are clear. Descendant process ownership/cancellation is incomplete under A-003. |
| `RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md` | Reviewed; ledger distinctions and retry policy are clear, but recovery application is blocked by A-002. |
| `LIFECYCLE-AND-BOOTSTRAP.md` | Reviewed; bootstrap shape and Turkish operator copy comply. A-001 and A-003. |
| `CRASH-RECOVERY.md` | Reviewed; A-001 and A-002. |
| `INTEGRATION-STRATEGY.md` | Reviewed; contract control is reviewable, but the pre-merge/typed-edge model must be reconciled under A-004. |
| ADR-0001 through ADR-0010 and `docs/adr/README.md` | Reviewed; required sections are present. ADR-0004 and ADR-0009 inherit A-001 through A-003. No additional finding. |
| `runtime-components.md` | Reviewed; visual ownership matches the text and inherits A-003. |
| `runtime-state-machine.md` | Reviewed; visual states match the table and inherit A-002. |
| `runtime-sequences.md` | Reviewed; the recovery sequence exposes A-001/A-002. |

## Verification

- Reviewed `git diff agent/claude/orchestrator/task-001..9576fc9` and every file listed by TASK-015.
- Compared all TASK-002 acceptance criteria against the normative documents rather than the author's checked boxes.
- Compared the architecture's dependency model with the corrected typed-edge and named-resource-lock graph on `integration/autonomous-runtime`.
- Checked module ownership, cross-contract imports, transition legality, crash points, bootstrap output location, ADR structure, language policy, and configured write scopes.
- `git diff --check agent/claude/orchestrator/task-001..9576fc9` produced no whitespace errors.
- Final write-scope validation and the report commit are recorded in the handoff after this file is finalized.

## Risks and handoff

- Unresolved blockers: A-001 through A-004.
- Work explicitly left outside this role: no architecture, task record, runtime source, governance, or enforcement file was modified.
- Required next role: Orchestrator through TASK-013 to route an Architect amendment; Architect/Claude to resolve the contracts; this Reviewer/GPT for TASK-015 round 2.
- Task lock released: pending final validation and commit.
