# Lifecycle Control and One-Input Bootstrap

Normative lifecycle contract for the autonomous runtime. Produced under TASK-002. Related decisions: [ADR-0008](../../adr/0008-one-input-project-bootstrap-contract.md) and [ADR-0009](../../adr/0009-graceful-pause-drain-and-crash-recovery.md). Implemented by TASK-007.

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
   | `worktree` | null; the runtime resolves it at dispatch |
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

`pause` and `stop` addressed to a running foreground process are delivered as a control request the supervisor observes on its next loop iteration. Addressed to a run with no live writer, they operate on durable state directly.

Option names, run identifiers, exit codes, log lines, and event codes are English. Everything printed for the operator is Turkish.

## Graceful drain

Drain is one mechanism with two intents. `pause` ends in `paused`; `stop` ends in `cancelled`.

1. Move the run to `pausing` or `draining`. Admission closes immediately: `selectDispatchable` is no longer consulted and no lease is granted.
2. In-flight tasks continue. Their leases keep being renewed so the scheduler does not reclaim work that is about to finish. Results arriving during drain are applied normally.
3. Wait until no task is `leased` or `running`, or until `limits.drainTimeoutMs` elapses.
4. On the deadline, tasks still in flight are **not** killed mid-effect. Their leases are left to lapse and their identifiers are recorded in `RunDrainCompleted.abandonedTaskIds`. On the next attach, recovery reconciles them exactly as it reconciles a crash.
5. Write a checkpoint at the current version.
6. Emit `RunDrainCompleted{ intent }`, releasing the run to `paused` or `cancelled`.
7. Release the writer lock and exit.

Killing an agent mid-effect would create precisely the indeterminate effects the ledger exists to avoid. Letting the lease lapse and reconciling on the next attach is strictly safer and costs only the reconciliation pass.

## Pause and resume equivalence

**Pause post-condition.** After `pause` returns, a checkpoint exists at the run's current version, every acknowledged event is durable, and no live writer holds the run.

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
| Second `SIGINT` within 5 seconds | Immediate exit. Safe, because every acknowledged event is already durable; the run is left as an ordinary crashed run and the next attach recovers it. |
| `SIGHUP` | Ignored, so a closed terminal does not abort a long run. |

An interrupt therefore triggers graceful drain rather than an abrupt exit, and the escape hatch remains available without risking state loss.

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
