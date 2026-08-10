/**
 * Governance and enforcement paths that may never appear in an admitted release diff.
 *
 * The set is frozen and there is no override variant, no allow-list parameter, and no
 * "force" flag. It mirrors the human-controlled paths named in `AGENTS.md`, in
 * cross-cutting rule 7 of `docs/architecture/runtime/COMPONENT-BOUNDARIES.md`, and in
 * the protected list `scripts/orchestration/validate-write-scope.ps1` enforces.
 */

/** Exact paths. */
const PROTECTED_EXACT_PATHS: readonly string[] = Object.freeze([
  'AGENTS.md',
  'CLAUDE.md',
  'config/agents/settings.yaml',
  'scripts/ci/validate-framework.ps1',
  'scripts/ci/test-orchestration.ps1',
  'scripts/security/check-repository.ps1',
  'scripts/setup/install-git-hooks.ps1',
  '.github/workflows/ci.yml',
  '.github/workflows/security.yml',
  '.github/CODEOWNERS',
  '.gitattributes',
  '.gitignore',
  '.worktreeinclude',
]);

/** Directory prefixes. Every path beneath them is protected. */
const PROTECTED_PREFIXES: readonly string[] = Object.freeze([
  '.agents/',
  '.githooks/',
  'scripts/orchestration/',
]);

export interface ProtectedPathFinding {
  readonly path: string;
  readonly rule: 'exact' | 'prefix';
}

/** Normalizes separators so a Windows-style path cannot evade the comparison. */
function normalize(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.\//, '');
}

/** True when `path` is a human-controlled governance or enforcement path. */
export function isProtectedPath(path: string): boolean {
  const candidate = normalize(path);
  if (PROTECTED_EXACT_PATHS.includes(candidate)) {
    return true;
  }
  return PROTECTED_PREFIXES.some((prefix) => candidate.startsWith(prefix));
}

/**
 * Returns every protected path in the changed-path set, in input order. A non-empty
 * result is `ProtectedPathChange` and constructs no plan.
 */
export function findProtectedPathChanges(
  changedPaths: readonly string[],
): readonly ProtectedPathFinding[] {
  const findings: ProtectedPathFinding[] = [];
  for (const path of changedPaths) {
    const candidate = normalize(path);
    if (PROTECTED_EXACT_PATHS.includes(candidate)) {
      findings.push({ path, rule: 'exact' });
      continue;
    }
    if (PROTECTED_PREFIXES.some((prefix) => candidate.startsWith(prefix))) {
      findings.push({ path, rule: 'prefix' });
    }
  }
  return findings;
}

/** The complete protected set, exposed read-only for the negative-capability tests. */
export function protectedPathSet(): {
  readonly exact: readonly string[];
  readonly prefixes: readonly string[];
} {
  return { exact: PROTECTED_EXACT_PATHS, prefixes: PROTECTED_PREFIXES };
}
