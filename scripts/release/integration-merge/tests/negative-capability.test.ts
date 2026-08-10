/**
 * Static negative-capability allow-list tests.
 *
 * These enumerate the approved negative-capability table rather than sampling it. They
 * read this module's own source text and prove, for every non-test file, that the
 * capability simply does not exist:
 *
 *   - exactly one merge port with exactly one operation, and no second path to `main`;
 *   - no generic HTTP, fetch, socket, or request construction;
 *   - no process spawn and no `git` or `gh` invocation;
 *   - no `git push`, ref update, force, `--no-verify`, or hook bypass;
 *   - no `ALLOW_MAIN_PUSH` and no environment access at all;
 *   - no administrator override, branch-protection, ruleset, or bypass mutation;
 *   - no policy observation or mutation port;
 *   - no check, status, or gate mutation;
 *   - no task-record or ownership mutation and no lock release;
 *   - no filesystem writer;
 *   - no deployment or irreversible production action.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RELEASE_MERGE_PORT_OPERATIONS } from '../merge-port.ts';
import { DormantReleaseMergePort } from '../merge-port.ts';
import type { ReleasePullRequestMergePort } from '../contracts.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = join(HERE, '..');

interface SourceFile {
  readonly path: string;
  readonly text: string;
}

function collectSources(directory: string, accumulator: SourceFile[]): SourceFile[] {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      // Test fixtures deliberately mention prohibited names in assertions.
      if (entry === 'tests') {
        continue;
      }
      collectSources(full, accumulator);
      continue;
    }
    if (!entry.endsWith('.ts')) {
      continue;
    }
    accumulator.push({
      path: relative(MODULE_ROOT, full).replace(/\\/g, '/'),
      text: readFileSync(full, 'utf8'),
    });
  }
  return accumulator;
}

const SOURCES = collectSources(MODULE_ROOT, []);

/** Strips comments so a prohibition described in prose is not read as an occurrence. */
function code(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1 ');
}

const CODE: readonly SourceFile[] = SOURCES.map((file) => ({
  path: file.path,
  text: code(file.text),
}));

test('the module has source files to analyse', () => {
  assert.ok(SOURCES.length >= 12, `expected the module sources, found ${SOURCES.length}`);
  assert.ok(SOURCES.some((file) => file.path === 'index.ts'));
  assert.ok(SOURCES.every((file) => !file.path.startsWith('tests/')));
});

/* --- Prohibited capability tokens --------------------------------------- */

interface Prohibition {
  readonly capability: string;
  readonly pattern: RegExp;
}

const PROHIBITED: readonly Prohibition[] = [
  { capability: 'generic HTTP request', pattern: /\bfetch\s*\(/ },
  { capability: 'generic HTTP client', pattern: /\bXMLHttpRequest\b|\baxios\b|\bgot\b\s*\(/ },
  { capability: 'node http/https module', pattern: /node:https?\b|require\(['"]https?['"]\)/ },
  { capability: 'raw socket', pattern: /node:net\b|node:tls\b|\bWebSocket\b/ },
  { capability: 'process spawn', pattern: /node:child_process\b|\bspawn(Sync)?\s*\(|\bexecFile\s*\(|\bexecSync\s*\(/ },
  { capability: 'git command invocation', pattern: /['"`]git['"`]|\bgit\s+(push|merge|commit|update-ref|checkout|reset)\b/ },
  { capability: 'gh CLI invocation', pattern: /['"`]gh['"`]|\bgh\s+(pr|api|repo)\b/ },
  // Passive signed policy fields such as `forcePushAllowed` are required evidence,
  // not mutation capabilities. Match callable ref operations and command syntax.
  { capability: 'git push', pattern: /git\s*push|\b(?:pushRef|forcePush)\s*\(|--force\b|\+refs\// },
  { capability: 'git ref update', pattern: /updateRef|createRef|deleteRef|refs\/heads\/\$\{/ },
  { capability: 'hook bypass', pattern: /--no-verify|noVerify|skipHooks|bypassHook/ },
  { capability: 'ALLOW_MAIN_PUSH', pattern: /ALLOW_MAIN_PUSH/ },
  { capability: 'environment access', pattern: /process\.env|node:process\b|getenv/ },
  // `enforce_admins` is a required observed protection rule, not an override API.
  { capability: 'administrator override', pattern: /\b(?:adminOverride|administratorOverride|asAdministrator)\s*\(/ },
  { capability: 'branch-protection mutation', pattern: /updateBranchProtection|setBranchProtection|deleteBranchProtection/ },
  { capability: 'ruleset mutation', pattern: /createRuleset|updateRuleset|deleteRuleset|setRuleset/ },
  { capability: 'bypass-actor mutation', pattern: /addBypassActor|setBypassActors|updateBypassActors/ },
  { capability: 'policy observation port', pattern: /readPolicy|observePolicy|getBranchProtection|listRulesets|fetchPolicy/ },
  { capability: 'policy mutation', pattern: /writePolicy|mutatePolicy|setPolicy\b/ },
  { capability: 'check or status mutation', pattern: /createCheckRun|updateCheckRun|setCheckRun|createCommitStatus|setStatus\b/ },
  { capability: 'required-check mutation', pattern: /setRequiredChecks|updateRequiredChecks|disableRequiredCheck/ },
  { capability: 'gate mutation', pattern: /recordVerdict|writeVerdict|closeGate|approveGate|setGate\b/ },
  { capability: 'task-record mutation', pattern: /writeTaskRecord|updateTaskRecord|setTaskOwner|createTask\b|assignTask/ },
  { capability: 'lock release', pattern: /releaseLock|releaseTask|forceRelease|breakLock/ },
  { capability: 'filesystem writer', pattern: /writeFile|writeFileSync|appendFile|mkdir|rmSync|unlink|createWriteStream/ },
  { capability: 'deployment or production action', pattern: /createDeployment|triggerDeploy|deployRelease|publishArtifactToProduction/ },
  { capability: 'secret material', pattern: /BEGIN [A-Z ]*PRIVATE KEY|ghp_[A-Za-z0-9]|github_pat_|Authorization:\s*Bearer\s+[A-Za-z0-9]/ },
];

for (const prohibition of PROHIBITED) {
  test(`the module contains no ${prohibition.capability}`, () => {
    const offenders = CODE.filter((file) => prohibition.pattern.test(file.text)).map(
      (file) => file.path,
    );
    assert.deepEqual(
      offenders,
      [],
      `${prohibition.capability} found in ${offenders.join(', ')}`,
    );
  });
}

/* --- Exactly one merge port --------------------------------------------- */

test('the merge port declares exactly one operation', () => {
  assert.deepEqual(RELEASE_MERGE_PORT_OPERATIONS, [
    'mergeIntegrationPullRequestIntoMain',
  ]);

  const port: ReleasePullRequestMergePort = new DormantReleaseMergePort();
  const operations = Object.getOwnPropertyNames(
    Object.getPrototypeOf(port) as object,
  ).filter((name) => name !== 'constructor');
  assert.deepEqual(operations, ['mergeIntegrationPullRequestIntoMain']);
});

test('the merge port interface declares exactly one method', () => {
  const contracts = SOURCES.find((file) => file.path === 'contracts.ts');
  assert.ok(contracts !== undefined);
  const block = /export interface ReleasePullRequestMergePort \{([\s\S]*?)\n\}/.exec(
    contracts.text,
  );
  assert.ok(block !== null, 'the merge port interface must exist');
  const methods = (block[1] ?? '').match(/^\s{2}\w+\s*\(/gm) ?? [];
  assert.equal(methods.length, 1);
  assert.match(methods[0] ?? '', /mergeIntegrationPullRequestIntoMain/);
});

test('there is exactly one call site of the merge port in the module', () => {
  const callSites = CODE.flatMap((file) =>
    (file.text.match(/mergeIntegrationPullRequestIntoMain\s*\(/g) ?? []).map(
      () => file.path,
    ),
  );
  // contracts.ts declares it, merge-port.ts implements the dormant default, and
  // execute.ts invokes it exactly once.
  const invocations = callSites.filter((path) => path === 'execute.ts');
  assert.equal(invocations.length, 1, `merge invocations: ${callSites.join(', ')}`);
});

test('the observation port exposes read operations only', () => {
  const contracts = SOURCES.find((file) => file.path === 'contracts.ts');
  assert.ok(contracts !== undefined);
  const block = /export interface ReleaseObservationPort \{([\s\S]*?)\n\}/.exec(
    contracts.text,
  );
  assert.ok(block !== null);
  const methods = ((block[1] ?? '').match(/^\s{2}(\w+)\s*\(/gm) ?? []).map((entry) =>
    entry.trim().replace(/\($/, ''),
  );
  assert.ok(methods.length > 0);
  for (const method of methods) {
    assert.match(method, /^read/, `${method} must be a read operation`);
  }
  // And none of them observes policy.
  for (const method of methods) {
    assert.equal(/policy|ruleset|protection|bypass|admin/i.test(method), false, method);
  }
});

test('no declared port anywhere in the module can observe or mutate policy', () => {
  const contracts = SOURCES.find((file) => file.path === 'contracts.ts');
  assert.ok(contracts !== undefined);
  const interfaceBlocks = contracts.text.match(
    /export interface \w*(Port|Manager|Store)\b[\s\S]*?\n\}/g,
  ) ?? [];
  assert.ok(interfaceBlocks.length >= 3);

  for (const block of interfaceBlocks) {
    const methods = (block.match(/^\s{2}(\w+)\s*\(/gm) ?? []).map((entry) =>
      entry.trim().replace(/\($/, ''),
    );
    for (const method of methods) {
      assert.equal(
        /^(observe|read)?(Policy|Ruleset|BranchProtection|Bypass)/i.test(method) &&
          /policy|ruleset|protection|bypass/i.test(method),
        false,
        `${method} would be a policy port`,
      );
    }
  }
});

test('the base branch and merge method are literal types, not parameters', () => {
  const contracts = SOURCES.find((file) => file.path === 'contracts.ts');
  assert.ok(contracts !== undefined);
  const block = /export interface ReleaseMergeRequest \{([\s\S]*?)\n\}/.exec(
    contracts.text,
  );
  assert.ok(block !== null);
  assert.match(block[1] ?? '', /baseBranch:\s*typeof RELEASE_BASE_BRANCH/);
  assert.match(block[1] ?? '', /mergeMethod:\s*typeof RELEASE_MERGE_METHOD/);
});

test('the only merge-request constructor derives every field from an admitted plan', () => {
  const mergePort = CODE.find((file) => file.path === 'merge-port.ts');
  assert.ok(mergePort !== undefined);
  const constructors = mergePort.text.match(/function buildReleaseMergeRequest/g) ?? [];
  assert.equal(constructors.length, 1);
  assert.match(mergePort.text, /plan: ReleaseMergePlan/);
});

test('the dormant default merge port performs no operation', async () => {
  const port = new DormantReleaseMergePort();
  const result = await port.mergeIntegrationPullRequestIntoMain({
    pullRequestNumber: 1,
    expectedHeadOid: '0'.repeat(40),
    baseBranch: 'main',
    mergeMethod: 'merge',
    idempotencyKey: '0'.repeat(64),
  });
  assert.deepEqual(result, { outcome: 'unsupported' });
});

test('no base branch other than main is nameable by the module', () => {
  for (const file of CODE) {
    const matches = file.text.match(/baseBranch\s*[:=]\s*['"`]([^'"`]+)['"`]/g) ?? [];
    for (const match of matches) {
      assert.match(
        match,
        /['"`]main['"`]/,
        `${file.path} names a base branch other than main: ${match}`,
      );
    }
  }
});

test('the protected-path guard has no override variant', () => {
  const guard = CODE.find((file) => file.path === 'protected-paths.ts');
  assert.ok(guard !== undefined);
  assert.equal(/force|override|allowOverride|skip|ignoreProtected/i.test(guard.text), false);
});

test('admit accepts no flag that suppresses validation', () => {
  const admission = CODE.find((file) => file.path === 'admission.ts');
  assert.ok(admission !== undefined);
  assert.equal(
    /skipValidation|force\b|bypass\b|allowUnsafe|ignoreGates|dryRun/i.test(
      admission.text,
    ),
    false,
  );
  assert.match(admission.text, /export function admit\(input: ReleaseAdmissionInput\)/);
});
