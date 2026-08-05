# Lifecycle Control and One-Input Bootstrap

Normative lifecycle contract for the autonomous runtime. Produced under TASK-002, amended under TASK-016. Related decisions: [ADR-0008](../../adr/0008-one-input-project-bootstrap-contract.md) and [ADR-0009](../../adr/0009-graceful-pause-drain-and-crash-recovery.md), as superseded in part by [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md). Implemented by TASK-007.

## Amendment register — TASK-016

| Superseded claim (TASK-002) | Superseded by | Decision |
|---|---|---|
| "`pause` and `stop` addressed to a running foreground process are delivered as a control request the supervisor observes on its next loop iteration" — with no transport, identity, acknowledgement, ordering, ownership check, or stale-request rule | [Live-run control protocol](#live-run-control-protocol) | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| Drain step 4, "tasks still in flight are **not** killed mid-effect. Their leases are left to lapse" | [Graceful drain](#graceful-drain) step 4: the task-level treatment is unchanged, but the invocation's OS process tree is terminated with bounded escalation and verified exit before the command returns | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| Pause post-condition "a checkpoint exists … and no live writer holds the run" | The same, plus: no unmanaged descendant of any invocation of this writer epoch remains, and every registered invocation has a durable `ProcessGroupClosed` | [ADR-0014](../../adr/0014-live-run-control-and-process-tree-ownership.md) |
| "Batch atomicity means bootstrap is all-or-nothing", resting on one fsync of three envelopes | The same guarantee, now established by the batch commit record | [ADR-0012](../../adr/0012-crash-atomic-journal-batches-with-commit-records.md) |
| `worktree` rendered as null with "the runtime resolves it at dispatch" and no owner for resolving it | The workspace lifecycle module owns it; see [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md) | [ADR-0011](../../adr/0011-agent-workspace-lifecycle-module.md) |

## One-input bootstrap

### The single input

The operator supplies exactly one thing: a project brief. Either inline text or a path to a file whose contents are the brief.

```powershell
node bin/run-project.mjs start --input "Bir envanter takip uygulaması geliştir"
node bin/run-project.mjs start --input-file ./brief.md
```

No second command, no interactive prompt, no manually authored task record, no operator-supplied role assignment. Everything else is resolved from the repository: role assignments from `config/agents/settings.yaml`, the task shape from `templates/task.md`, role contracts from `.agents/<role>/`.

### Determinism

Bootstrap is a pure function:

```ts
bootstrap(input: ProjectInput, context: BootstrapContext): BootstrapResult
```

Everything impure is in `context`: `nowIso`, `runOrdinal`, `repoHead`, `runRoot`, the task template contents, the resolved Manager role assignment, and the run limits. The CLI computes the context; `bootstrap` computes the plan. For a fixed `(input, context)` the returned `BootstrapPlan` is byte-identical under canonical JSON, which makes it directly unit-testable without a filesystem or a clock.

```text
projectInputDigest = sha256(canonicalJson({ brief: normalizedBrief }))
runId              = "run-" + first12HexOf(projectInputDigest) + "-" + zeroPad(runOrdinal, 4)
runDir             = runRoot + "/" + runId
```

`normalizedBrief` is the brief with CRLF converted to LF, trailing whitespace stripped per line, and a single trailing newline. `runOrdinal` distinguishes repeated runs of the same brief and is derived from the run directories already present under `runRoot`, so it too is a function of observable state rather than of a clock.

### Deterministic output

The plan contains:

1. **`initialTaskRecordBody`** — `templates/task.md` rendered with:

   | Field | Value |
   |---|---|
   | `task_id` | `T-0001` |
   | `title` | `Define project scope, roadmap, and initial backlog` |
   | `status` | `ready` |
   | `owner_role` | `manager` |
   | `llm` | the `llm` assigned to `manager` in `config/agents/settings.yaml` |
   | `branch` | `agent/<llm>/manager/t-0001` |
   | `worktree` | null at bootstrap. The workspace lifecycle module resolves and creates it during `prepare`, after the lease is granted and before the worker is invoked; see [WORKSPACE-LIFECYCLE.md](WORKSPACE-LIFECYCLE.md). TASK-002 recorded that "the runtime resolves it at dispatch" without naming an owning module, which is the gap TASK-016 closes |
   | `write_scope` | the `manager` role's configured write scope, verbatim |
   | `dependencies` | `[]` |
   | `required_gates` | `[review]` |

   The body embeds the project brief verbatim under a `## Project input` heading. The brief may be in any language, because it is operator input rather than product interface copy; every field, heading, and identifier the runtime generates is English.

2. **`initialTaskRecordPath`** — `<runDir>/tasks/ready/T-0001-define-project-scope.md`. Always inside the run directory, never inside the repository `tasks/` tree.

3. **`events`** — exactly three envelopes, appended as one compare-and-set batch:

   ```text
   RunBootstrapped { runId, projectInputDigest, repoHead, limits }
   TaskCreated     { task: T-0001 proposal }
   RunStarted      { }
   ```

   Batch atomicity means bootstrap is all-or-nothing: either the run exists with its Manager task and is `running`, or nothing was created. There is no half-bootstrapped run to clean up.

   Under TASK-002 that claim rested on writing three envelopes in one buffer and calling fsync, which finding A-001 established is not atomic: a crash could leave `RunBootstrapped` durable without `RunStarted`, producing exactly the half-bootstrapped run this paragraph promises cannot exist. The claim now rests on the batch commit record in [DURABLE-STATE-AND-CHECKPOINTS.md](DURABLE-STATE-AND-CHECKPOINTS.md): the three envelopes carry one `batchId`, the commit record is the last line written, and restore exposes all three or none. The crash-point matrix C1 through C10 in that document must be exercised against this specific batch, because bootstrap is one of the two batches whose partial application would be silently wrong rather than merely inefficient.

### Bootstrap failures

| Code | Condition | Turkish operator message |
|---|---|---|
| `EMPTY_INPUT` | The brief is empty after normalization | `Proje girdisi boş olamaz.` |
| `INPUT_TOO_LARGE` | The brief exceeds the configured size bound | `Proje girdisi izin verilen boyutu aşıyor.` |
| `MANAGER_ROLE_UNASSIGNED` | `manager.llm` is null | `Proje yöneticisi rolü bir LLM ailesine atanmamış.` |
| `MANAGER_ROLE_DISABLED` | `manager.enabled` is false | `Proje yöneticisi rolü devre dışı.` |
| `TEMPLATE_INVALID` | `templates/task.md` is missing required front matter | `Görev şablonu geçersiz.` |

Codes are English and stable; only the displayed message is Turkish, per the project language policy.

### Graph growth after bootstrap

Bootstrap creates one task. The Manager agent's result carries `proposedTasks`, which the supervisor admits under the guards in [STATE-MACHINE.md](STATE-MACHINE.md). The graph grows as roles decompose work, which is what makes a single input sufficient for a whole run.

## Command surface

| Command | Effect | Terminal states it can produce |
|---|---|---|
| `start --input\|--input-file` | Bootstrap and run to completion in the foreground | `succeeded`, `failed`, `cancelled` |
| `resume --run <runId>` | Attach, recover, continue | `succeeded`, `failed`, `cancelled` |
| `pause --run <runId>` | Request a drain with pause intent | `paused` |
| `stop --run <runId>` | Request a drain with stop intent | `cancelled` |
| `status --run <runId>` | Read-only `RunStatusView`; acquires no writer lock | none |

`pause` and `stop` addressed to a running foreground process are delivered through the live-run control protocol below. Addressed to a run with no live writer, they operate on durable state directly, after acquiring the writer lock.

Option names, run identifiers, exit codes, log lines, and event codes are English. Everything printed for the operator is Turkish.

## Live-run control protocol

Added under TASK-016 to resolve the first half of A-003. TASK-002 stated that a second `pause` or `stop` "delivers a control request" without defining how, which left five questions an implementer cannot answer: what the transport is, how a request is identified, how the caller knows it was seen, in what order concurrent requests take effect, who is allowed to send one, and what happens to a request nobody consumed.

**Owner.** The lifecycle module, TASK-007. It owns operator intent, the command surface, process signals, and exit codes, and this is operator intent arriving by a different door. The supervisor consumes accepted requests as ordinary events; it does not read the transport. [COMPONENT-BOUNDARIES.md](COMPONENT-BOUNDARIES.md) records the assignment, and no other module owns any part of it.

### Transport

A durable file-based control inbox inside the run directory:

```text
<runDir>/control/
  req-<requestId>.json        written by the requesting CLI, tmp-then-atomic-rename
  ack-<requestId>.json        written by the supervisor, tmp-then-atomic-rename
  consumed/                   requests moved here after acceptance or rejection
```

Both writes use the same tmp-write, fsync, atomic-rename, fsync-directory sequence the checkpoint protocol uses, so a reader never observes a partial request or a partial acknowledgement. The transport therefore depends on exactly the three filesystem primitives already required, and on nothing else.

Two alternatives were rejected. A **local socket or named pipe** diverges between platforms in naming, permissions, and lifetime, adds a listening endpoint to the security review surface, and is gone the moment the supervisor dies, so a request sent during a crash window is simply lost. **Operating-system signals** cannot carry a request identity, cannot be acknowledged, have no cross-platform equivalent for a directed non-fatal signal on Windows, and cannot be ordered. The directory has none of those problems and is inspectable during a QA or security gate, which matches how the rest of the run is observable.

### Request identity

```text
requestId = "ctl-" + first16HexOf(sha256(canonicalJson({
              runId, kind, requestedBy, requestedAtIso, clientNonce })))
```

`kind` is drawn from the closed set `'pause' | 'stop' | 'status_probe'`. `requestId` must match `/^ctl-[0-9a-f]{16}$/`; a file name that does not is ignored and moved to `consumed/`. The identifier is the only part of a request that ever reaches a filesystem path, and it is pattern-validated before it does.

The atomic rename makes request creation exactly-once at the transport level: two CLIs computing the same `requestId` produce one file. Acceptance is exactly-once at the state level, because `ControlRequestAccepted` records `requestId` in `run.acceptedControlRequests` and `applyEvent` rejects a duplicate.

### Ownership check and trust boundary

A request carries `runId` and `targetWriterEpoch`, the epoch the requester read from `writer.lock`. The supervisor accepts only a request whose `runId` matches the run it holds and whose `targetWriterEpoch` equals its own current epoch. A request addressed to a superseded epoch is rejected `rejected_stale`.

The trust boundary is stated plainly: the run directory's filesystem permissions **are** the authentication boundary. The runtime is a single-writer, single-machine, single-user process, and it does not implement a second authentication scheme on top of the one the operating system already enforces on that directory. What it does do is treat every request as untrusted input:

1. Only the three `kind` values are accepted; anything else is `rejected_unsupported`.
2. `requestId` is pattern-validated before it is used in any path.
3. No field of a request is ever used to construct a filesystem path, a command vector, a branch name, or a glob.
4. A request larger than `limits.controlRequestMaxBytes` is rejected without being parsed.
5. `requestedBy` is recorded as an opaque English label for the audit trail and is never treated as an authorization claim.

### Durable ordering

The control directory is a transport, not a queue. Ordering is established in the journal: the supervisor reads all pending requests once per loop iteration, sorts them by `(requestedAt, requestId)` for determinism, and appends `ControlRequestAccepted` for each acceptable one **before** appending the run transition it implies. The order in which control requests took effect is therefore the journal's order, which is durable, replayable, and identical after a crash.

When two requests of different kinds are pending in one pass, `stop` wins over `pause` regardless of timestamp, and the `pause` is acknowledged `superseded`. Escalating a pause to a stop is legal in the run transition table; de-escalating a stop to a pause is not, and resolving the pair by timestamp would make the outcome depend on clock skew between two CLI invocations.

### Acknowledgement

After the `ControlRequestAccepted` append is durable, the supervisor writes `ack-<requestId>.json`:

```text
{ requestId, status, observedAt, runState, stateVersion, detail }
status ∈ 'accepted' | 'superseded' | 'rejected_stale'
       | 'rejected_unsupported' | 'rejected_terminal_run'
```

The requesting CLI polls for its own acknowledgement until `limits.controlAckTimeoutMs` elapses. On `accepted` it reports the Turkish message for the intent and follows the run to its terminal state, or exits 0 when it was not attached. On any rejection it reports the reason and exits 4. On timeout it reports that the request could not be delivered and exits 4; it must not silently fall back to operating on durable state, because a live writer holds the run and a second writer would be refused anyway.

An acknowledgement is written for every request the supervisor consumes, including every rejection, so "no acknowledgement" means exactly one thing: nobody consumed it.

### Stale-request behavior

| Condition | Outcome |
|---|---|
| `targetWriterEpoch` is not the current epoch | `rejected_stale`, moved to `consumed/` |
| `requestedAt` older than `limits.controlRequestTtlMs` | `rejected_stale`, moved to `consumed/` |
| `requestId` already in `run.acceptedControlRequests` | `superseded`, moved to `consumed/`; no second effect |
| Run is terminal | `rejected_terminal_run`, moved to `consumed/` |
| Malformed, oversized, or unknown `kind` | `rejected_unsupported`, moved to `consumed/` |

Recovery sweeps the directory under the same rules on every attach, so a request left behind by a CLI that died cannot take effect against a run that resumed hours later. That sweep is Phase 7 of [CRASH-RECOVERY.md](CRASH-RECOVERY.md).

### Test obligations

1. A `pause` delivered to a live supervisor produces exactly one `ControlRequestAccepted`, one `accepted` acknowledgement, and one `RunPauseRequested`.
2. The same request file replayed after acceptance produces `superseded` and no second run transition.
3. A request carrying a superseded `targetWriterEpoch` is rejected and leaves run state unchanged.
4. Concurrent `pause` and `stop` in one pass yield `draining`, with the `pause` acknowledged `superseded`.
5. A request with an unknown `kind`, an oversized body, or a `requestId` containing a path separator or a traversal sequence is rejected without the value reaching any path, asserted on the constructed path.
6. A request older than the TTL is rejected by the supervisor and again by recovery after an attach.
7. With no supervisor running, the CLI times out within `controlAckTimeoutMs` and exits 4 without mutating the run.

## Graceful drain

Drain is one mechanism with two intents. `pause` ends in `paused`; `stop` ends in `cancelled`.

1. Move the run to `pausing` or `draining`. Admission closes immediately: `selectDispatchable` is no longer consulted and no lease is granted.
2. In-flight tasks continue. Their leases keep being renewed so the scheduler does not reclaim work that is about to finish. Results arriving during drain are applied normally.
3. Wait until no task is `leased` or `running`, or until `limits.drainTimeoutMs` elapses.
4. On the deadline, tasks still in flight are abandoned **at the task level** — their leases are left to lapse, their identifiers are recorded in `RunDrainCompleted.abandonedTaskIds`, and the next attach reconciles them exactly as it reconciles a crash. Their **OS process trees are not abandoned**: each registered invocation is cancelled gracefully, escalated within a bound, and verified to have exited, per [PROVIDER-ADAPTERS.md](PROVIDER-ADAPTERS.md).
5. Wait for every registered invocation of this writer epoch to have a durable `ProcessGroupClosed`. This wait is bounded by `limits.processTreeCloseTimeoutMs` and cannot be skipped.
6. Write a checkpoint at the current version.
7. Emit `RunDrainCompleted{ intent }`, releasing the run to `paused` or `cancelled`.
8. Release the writer lock and exit.

Step 4 supersedes the TASK-002 rule that in-flight work is never killed at the drain deadline. That rule was chosen to avoid manufacturing indeterminate effects, and the reasoning was sound about the ledger. Finding A-003 established what it did not account for: fencing stops a superseded worker from writing **run state**, and does nothing at all to stop a detached `claude`, `codex`, or `gemini` process from continuing to consume quota, edit a worktree, and perform external effects after the supervisor has exited. That process holds no lease, answers to no epoch, and appears in no record. Terminating it converts an unbounded, invisible problem into a bounded, recorded one that the effect ledger already knows how to adjudicate. The cost — more `indeterminate_effect` escalations — is analyzed in [RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md](RETRIES-TIMEOUTS-AND-IDEMPOTENCY.md).

Step 5 is why `pause` cannot return early. A command that returns while a descendant is still alive would hand the operator a run that looks paused and is not.

## Pause and resume equivalence

**Pause post-condition.** After `pause` returns, all five hold:

1. A checkpoint exists at the run's current version and validates.
2. Every acknowledged event is durable, at a committed batch boundary.
3. No live writer holds the run.
4. Every invocation registered under this writer epoch has a durable `ProcessGroupClosed`.
5. **No unmanaged descendant of any such invocation remains**, except one recorded as `orphan_unresolved` with its reason, which on Windows cannot arise and on POSIX is bounded by the single-append window described in [CRASH-RECOVERY.md](CRASH-RECOVERY.md).

Post-conditions 4 and 5 are added under TASK-016. They apply to `stop` and to the signal-triggered drain identically; there is one drain mechanism and it has one set of post-conditions.

**Resume pre-condition.** No live writer; a validated checkpoint or a replayable journal exists.

**Resume path.** `paused -> recovering -> running`. Resume goes through recovery unconditionally, because a pause that hit the drain deadline is indistinguishable from a crash with respect to in-flight tasks, and handling both with one code path removes an entire class of divergence.

**Equivalence claim.** For the same project input and the same seeded randomness, a run that is paused and resumed any number of times reaches the same terminal run state as an uninterrupted run, and each task is executed at most once beyond what the retry policy prescribes.

The claim holds because:

- Completed tasks are `succeeded` in the restored record and are never re-dispatched; the transition function rejects any attempt.
- Committed effects are recorded in the ledger and never re-executed.
- Backoff deadlines are durable `notBefore` timestamps, not in-memory timers.
- Dispatch ordering depends only on the record and the injected clock, not on process history.

The claim is about the terminal run state, not about wall-clock duration or dispatch interleaving, which legitimately differ.

## Signal handling

| Signal | Behavior |
|---|---|
| First `SIGINT` or `SIGTERM` | Treated as `stop`: graceful drain with stop intent. The operator sees a Turkish message stating that the run is draining and that a second interrupt will exit immediately. |
| Second `SIGINT` within 5 seconds | Immediate exit. Safe for run state, because every acknowledged event is already durable and the run becomes an ordinary crashed run that the next attach recovers. It is **not** safe for process trees: the second interrupt bypasses drain step 5, so descendants may survive. On Windows the job object's kill-on-close limit still terminates them; on POSIX they become orphans that the next attach fences and, when they were bound, terminates. The Turkish message printed at the first interrupt states that the escape hatch may leave provider processes running. |
| `SIGHUP` | Ignored, so a closed terminal does not abort a long run. |

An interrupt therefore triggers graceful drain rather than an abrupt exit, and the escape hatch remains available without risking state loss. TASK-016 makes the residual cost of the escape hatch explicit rather than leaving it unstated: it trades a bounded wait for a possibly surviving process tree, and that is the operator's choice to make knowingly.

## Completion reporting and exit codes

| Exit code | Condition | Turkish operator message pattern |
|---|---|---|
| 0 | Run reached `succeeded`, or a `pause`/`stop` completed cleanly with a durable checkpoint | `Çalışma tamamlandı.` / `Çalışma duraklatıldı.` |
| 1 | Run reached `failed` | `Çalışma başarısız oldu: <sebep>` |
| 2 | Run reached `cancelled` | `Çalışma iptal edildi.` |
| 3 | Run drained with tasks left in `blocked`, requiring a human decision | `Çalışma insan kararı bekleyen görevlerle durduruldu.` |
| 4 | Startup or configuration error, including a live writer on the target run | `Çalışma başlatılamadı: <sebep>` |

Exit code 3 is distinct from 1 and 2 because a blocked run is resumable after a human acts, and an automation wrapper must be able to tell "act and resume" from "this failed". The reported summary lists the terminal reason, the per-state task counts, and every blocked task with its reason.

## Observable pre- and post-conditions

| Claim | How it is observed |
|---|---|
| One input is sufficient | `start --input` produces a run whose `T-0001` Manager task record exists, with no second command |
| Bootstrap is deterministic | Two calls with the same `(input, context)` return byte-identical plans |
| Bootstrap is atomic | After a failure at any point in the batch append, no run directory contains a partial run |
| Bootstrap does not touch the repository | No file under the repository `tasks/` tree changes during any test |
| Drain is bounded | Drain returns within `drainTimeoutMs` plus a fixed tolerance, even with a worker that never completes |
| Pause is durable | After `pause`, a checkpoint at the current version exists and validates |
| Resume does not duplicate work | The count of `DispatchStarted` events for any `succeeded` task is unchanged across a pause and resume |
| Interrupt drains | A single `SIGINT` produces `RunDrainCompleted` and exit code 2, not an abrupt exit |
| Codes are distinct | Success, failure, cancellation, and blocked-run outcomes yield 0, 1, 2, and 3 |
| Language policy holds | Every operator-visible string is Turkish; every flag, code, and log line is English |
| Control requests are delivered once | A `pause` file replayed after acceptance yields `superseded` and no second run transition |
| Control requests are answered | Every consumed request has an acknowledgement file; the absence of one means nobody consumed it |
| Pause leaves no descendant | With an adapter whose child spawns a grandchild, ignores the first cancellation, and outlives the command timeout, neither process is alive when `pause` returns, and `ProcessGroupClosed` records `escalation: 'forced'` with `verifiedExit: true` |
| Outcomes precede lock release | For every registered invocation, the `ProcessGroupClosed` append is durable before `releaseWriter` is called; asserted by an injected seam that fails the run if the order is inverted |
