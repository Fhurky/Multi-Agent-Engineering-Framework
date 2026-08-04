# ADR-0008: One-input project bootstrap contract

- Status: Accepted
- Date: 2026-08-04
- Deciders: Solution Architect under TASK-002
- Affects: TASK-007 primarily; TASK-006 consumes the admission path

## Context

The objective is a single-command autonomous supervisor. The operator supplies a project and the system runs it. Today, starting work requires a human to author a task record from `templates/task.md`, resolve the owning role, choose a branch name, and place the record in `tasks/ready/`.

Bootstrap must collapse that into one input, deterministically, without writing into the repository's own `tasks/` tree — TASK-007 forbids that explicitly, and for good reason: a runtime that mutates the repository's governance artifacts during a run would make its own task state indistinguishable from the framework's.

## Decision

**The single input is a project brief**, supplied as `--input <text>` or `--input-file <path>`. Nothing else is required: role assignments come from `config/agents/settings.yaml`, the task shape from `templates/task.md`, and role contracts from `.agents/<role>/`.

**Bootstrap is a pure function** `bootstrap(input, context) -> BootstrapResult`. Every impure value — `nowIso`, `runOrdinal`, `repoHead`, `runRoot`, the template contents, the resolved Manager assignment, the limits — is supplied in `context` by the CLI. For a fixed `(input, context)` the returned plan is byte-identical under canonical JSON, so it is unit-testable without a filesystem or a clock.

**Identity is derived, not generated:**

```text
projectInputDigest = sha256(canonicalJson({ brief: normalizedBrief }))
runId              = "run-" + first12HexOf(projectInputDigest) + "-" + zeroPad(runOrdinal, 4)
```

`runOrdinal` comes from the run directories already present, so even the disambiguator is a function of observable state rather than of a clock.

**The deterministic output is the initial Manager task**, `T-0001`, rendered from `templates/task.md` with `owner_role: manager`, the `llm` assigned to `manager`, branch `agent/<llm>/manager/t-0001`, the manager role's configured write scope verbatim, no dependencies, and the `review` gate. The brief is embedded verbatim under a `## Project input` heading.

**All state changes are one atomic batch**: `RunBootstrapped`, `TaskCreated`, `RunStarted`, appended under a single compare-and-set. Either the run exists with its Manager task and is `running`, or nothing exists. There is no half-bootstrapped run to clean up.

**Everything is written inside the run directory**, at `<runDir>/tasks/ready/T-0001-*.md`. The repository `tasks/` tree is never touched.

**The graph grows afterwards.** The Manager agent's result carries `proposedTasks`, admitted through `TaskCreated` under the guards in [ADR-0003](0003-deterministic-run-and-task-state-machine.md). Bootstrap creates one task; the roles create the rest. That is what makes one input sufficient.

**Failures are typed and few**: `EMPTY_INPUT`, `INPUT_TOO_LARGE`, `MANAGER_ROLE_UNASSIGNED`, `MANAGER_ROLE_DISABLED`, `TEMPLATE_INVALID`. Codes are English and stable; the CLI renders a Turkish message from each code.

## Alternatives considered

**Accept a pre-authored task record as the input.** Simplest to implement and reuses the existing manual flow. Rejected: it is not one input, it requires the operator to know roles, branches, and write scopes, and it fails the stated objective outright.

**Generate the initial task by calling an LLM at bootstrap.** Would produce a richer first task. Rejected: bootstrap would become non-deterministic and non-testable, a provider outage would prevent a run from starting at all, and the decomposition work belongs to the Manager role — which is exactly what `T-0001` dispatches. Doing it in bootstrap would have the runtime perform a role's work.

**Random or timestamp-based `runId`.** Conventional. Rejected: it makes the bootstrap plan non-reproducible, so the byte-identical determinism test becomes impossible. Deriving from the input digest plus an ordinal keeps determinism and still distinguishes repeated runs.

**Write the initial task into the repository `tasks/ready/`.** Would make run state visible through the existing task lifecycle directories. Rejected: TASK-007 forbids it, it would make runtime-generated records indistinguishable from human-authored governance artifacts, and concurrent runs would collide in a directory guarded by a task lock the runtime does not hold.

**Enumerate the full task graph at bootstrap.** Much easier to validate and schedule. Rejected: a project brief does not contain the decomposition. Only the Manager role can produce it, and pretending otherwise would move product decisions into the runtime.

**Three separate appends instead of one batch.** Rejected: a crash between them would leave a run with no task, or a task in a run that never started, both of which recovery would have to special-case.

## Consequences

Positive:

- One command starts a project. The stated objective is met without an operator step in between.
- Bootstrap is unit-testable as a pure function, which is what TASK-007's determinism criterion requires.
- Atomicity removes an entire class of partial-initialization recovery code.
- Run state is fully isolated from the repository's governance artifacts, so a run cannot corrupt the framework it runs inside.

Negative:

- The quality of an entire run depends on one Manager invocation. A poor decomposition produces a poor run, with no bootstrap-time validation to catch it. The `invalid_task_proposal` guard limits the damage to a blocked task rather than a corrupted graph, but it cannot judge quality.
- `runOrdinal` is derived from directory listing, so a run directory deleted out of band can cause an identifier to be reused. TASK-007 must fail rather than overwrite when the target run directory already exists.
- The operator cannot influence the initial task beyond the brief. Overrides for role, limits, or the initial gate set are deliberately out of scope and would be a follow-up decision.
- Run artifacts accumulate under `runRoot` with no retention policy defined here.
