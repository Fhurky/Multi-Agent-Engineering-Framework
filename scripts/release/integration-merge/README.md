# Integration release merge executor — module note

DevOps-owned release control-plane module for TASK-049. Its normative contract is
`docs/architecture/runtime/POST-GATE-MERGE-EXECUTORS.md`,
`docs/architecture/runtime/COMPONENT-BOUNDARIES.md`,
`docs/architecture/runtime/INTEGRATION-STRATEGY.md`, and ADR-0042/0043/0044, read at
`f148567d716c00d7a24783318c8d6d7031492e7b`. Governance authority is HUMAN-004 at
`7dc07488a5b1cac8b1327ebd63bf747adbe03c68`. This file is a technical note about the
code in this directory; it does not restate or amend governance.

## Dormancy

**This module is dormant and cannot act.** It ships under the
`dormant-before-durable-merge-ingress` contract. The activation record is invalid,
`admit` returns `AuthorityNotActivated`, and no merge side effect may occur. Landing
this source activates nothing: the `MergeExecutorActivationRecord` is an externally
issued immutable input, and this module exposes no function that can construct,
complete, or sign one.

## Layout

| File | Responsibility |
|---|---|
| `index.ts` | Published entry point; the only surface a caller may import |
| `contracts.ts` | Executor-local types, transcribed from the approved contract |
| `canonical-json.ts` | Canonical JSON, SHA-256, and the one-property digest projection |
| `activation.ts` | Immutable activation-record validation |
| `gate-admissibility.ts` | `ExecutorGateAdmissibility` and the authoritative-round rule |
| `release-manifest.ts` | `release-gates/v1` shape and the seven aggregate domains |
| `release-lineage.ts` | Integration evidence set, fold, and ADR-0041 subsumption |
| `published-head-evidence.ts` | `published-head-evidence/v2` two-phase validation |
| `policy-control.ts` | `classifyPolicyControl` and attestation normalization |
| `required-checks.ts` | Exact-head required-check evaluation |
| `protected-paths.ts` | Frozen governance/enforcement path set, no override variant |
| `remediation.ts` | Agent-owned remediation routing that creates no task |
| `retry.ts` | The approved `merge-retry/v1` bounded policy |
| `merge-port.ts` | The single pull-request merge port and its dormant default |
| `admission.ts` | The ordered, total, pure `admit` |
| `execute.ts` | Durable intent, the sole mutation, recovery, and verification |
| `run-tests.ps1` | PowerShell entry point for the test suite |
| `tests/` | Nested fixtures |

## Language and toolchain

The approved architecture places this path in the ten-module map, binds it to the
`index.ts` entry-point rule, and expresses its whole contract in TypeScript
discriminated unions whose totality ADR-0001 records PowerShell cannot express. The
tests use `node:test` with `node:assert/strict`, which ADR-0001 selects precisely so a
module can be covered with zero third-party dependencies.

The repository has no root `package.json` or `tsconfig.json` — TASK-018 owns those and
is not integrated — and this task's write scope is `scripts/release/integration-merge/**`
only. The module therefore relies on Node.js native TypeScript type stripping and runs
with no manifest, no build step, and no dependency:

```powershell
./scripts/release/integration-merge/run-tests.ps1
```

Node.js 22.18 or newer is required. `run-tests.ps1` adds `--experimental-strip-types`
for the 22.6–22.17 and 23.0–23.5 ranges where the feature exists but is flagged.

Because there is no compiler in the repository, the type annotations are erased rather
than checked at run time. Every invariant the types express is additionally asserted at
run time by the fixtures, and the module's public behaviour is validated by 402 executed
tests.

Relative import specifiers name `.ts` files rather than the `.js` specifiers ADR-0001
binds to TASK-003 through TASK-008, because type stripping resolves the real file and
performs no output rewriting. If the repository later gains the TASK-018 toolchain, this
is the one convention to revisit.

## Structural properties the tests enforce

- Exactly one merge port with exactly one operation, one call site, literal `main` and
  `merge` types, and a request constructor that derives every field from an admitted plan.
- No generic HTTP, socket, process spawn, `git`, `gh`, ref update, force, `--no-verify`,
  `ALLOW_MAIN_PUSH`, environment access, administrator override, branch-protection,
  ruleset, bypass, required-check, gate, task-record, lock-release, filesystem-write, or
  deployment capability anywhere in the module source.
- No policy-observation port. Complete policy observation belongs to the separate
  human-controlled `RepositoryPolicyAttestor`; the executor consumes signed attestations
  as input facts only.
- No import of a runtime implementation module or either runtime contract root, and no
  third-party dependency at all.

## Unexecuted obligations

`tests/live-control-plane.blocked.test.ts` registers the eleven live protected-branch
and attestor-boundary fixtures the approved list requires. They are reported as `todo`
and are deliberately unsatisfiable: the human-controlled control plane is absent, and
provisioning it is a HUMAN-004 third-exception action outside this role. They must never
be stubbed or provisioned to make them pass. TASK-055 owns their validation.

## Fixture material

No secret, token, credential, or private key exists in this module or its fixtures. The
attestation `signature` field in the fixtures is a clearly non-secret deterministic
placeholder string; the module never verifies a raw signature itself.
