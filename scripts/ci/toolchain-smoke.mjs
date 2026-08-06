// Proves that the runtime toolchain compiles, tests, and lints a real module, and that
// it fails on a defect.
//
// The runtime tree is empty until Wave 3, so the ordinary checks have nothing to compile
// and cannot demonstrate that the toolchain works. This smoke test scaffolds a throwaway
// fixture under the ignored .agent-runtime/ directory, runs the same configuration the
// runtime tasks will use, and asserts both directions:
//
//   positive cases   a valid module compiles, its node:test suite passes, lint and format pass
//   negative cases   a type error, a failing test, and a lint violation each fail the build
//
// The fixture is removed on every run, including on failure.

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';

import {
  assertSupportedNodeVersion,
  info,
  repositoryRoot,
  runNodeCaptured,
  typescriptCompilerPath,
} from '../quality/lib/toolchain.mjs';

assertSupportedNodeVersion();

const fixtureRelativeRoot = '.agent-runtime/toolchain-smoke';
const fixtureRoot = join(repositoryRoot, fixtureRelativeRoot);
const compiler = typescriptCompilerPath();
const results = [];

function writeFixtureFile(relativePath, content) {
  const absolutePath = join(fixtureRoot, relativePath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, content, 'utf8');
  return absolutePath;
}

function removeFixtureFile(relativePath) {
  rmSync(join(fixtureRoot, relativePath), { force: true });
}

function compile() {
  return runNodeCaptured([compiler, '--project', `${fixtureRelativeRoot}/tsconfig.json`]);
}

function record(name, expectation, outcome) {
  const passed = expectation === 'succeeds' ? outcome.status === 0 : outcome.status !== 0;
  results.push({ name, expectation, status: outcome.status, passed });
  if (!passed) {
    process.stderr.write(`[smoke] unexpected result for "${name}" (exit code ${outcome.status})\n`);
    process.stderr.write(`${outcome.stdout}${outcome.stderr}\n`);
  }
}

function scaffold() {
  rmSync(fixtureRoot, { recursive: true, force: true });

  writeFixtureFile(
    'tsconfig.json',
    `${JSON.stringify(
      {
        extends: '../../tsconfig.json',
        compilerOptions: { rootDir: '.', outDir: 'dist', noEmit: false },
        include: ['src/**/*.ts', 'tests/**/*.ts'],
      },
      null,
      2,
    )}\n`,
  );

  writeFixtureFile(
    'src/checkpoint.ts',
    [
      'export interface Checkpoint {',
      '  readonly sequence: number;',
      '  readonly label?: string;',
      '}',
      '',
      'export function latest(checkpoints: readonly Checkpoint[]): Checkpoint | undefined {',
      '  return checkpoints.at(-1);',
      '}',
      '',
    ].join('\n'),
  );

  writeFixtureFile(
    'tests/checkpoint.test.ts',
    [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      '',
      "import { latest } from '../src/checkpoint.js';",
      '',
      "test('returns the last checkpoint', () => {",
      "  assert.deepEqual(latest([{ sequence: 1 }, { sequence: 2, label: 'second' }]), {",
      '    sequence: 2,',
      "    label: 'second',",
      '  });',
      '});',
      '',
      "test('returns undefined for an empty history', () => {",
      '  assert.equal(latest([]), undefined);',
      '});',
      '',
    ].join('\n'),
  );
}

function runPositiveCases() {
  record('valid module compiles', 'succeeds', compile());

  record(
    'node:test suite passes',
    'succeeds',
    runNodeCaptured(['--test', `${fixtureRelativeRoot}/dist/tests/checkpoint.test.js`]),
  );

  record(
    'lint accepts the fixture',
    'succeeds',
    runNodeCaptured([
      'scripts/quality/lint.mjs',
      '--root',
      `${fixtureRelativeRoot}/src`,
      '--root',
      `${fixtureRelativeRoot}/tests`,
    ]),
  );

  record(
    'format check accepts the fixture',
    'succeeds',
    runNodeCaptured([
      'scripts/quality/format.mjs',
      '--check',
      '--root',
      `${fixtureRelativeRoot}/src`,
      '--root',
      `${fixtureRelativeRoot}/tests`,
    ]),
  );
}

function runNegativeCases() {
  writeFixtureFile('src/type-error.ts', 'export const sequence: number = "not a number";\n');
  record('a type error fails the compiler', 'fails', compile());
  removeFixtureFile('src/type-error.ts');

  writeFixtureFile(
    'tests/failing.test.ts',
    [
      "import assert from 'node:assert/strict';",
      "import { test } from 'node:test';",
      '',
      "test('deliberately fails', () => {",
      '  assert.equal(1, 2);',
      '});',
      '',
    ].join('\n'),
  );
  const compiledFailingTest = compile();
  if (compiledFailingTest.status !== 0) {
    record('a failing test compiles before it runs', 'succeeds', compiledFailingTest);
  } else {
    record(
      'a failing test fails the test runner',
      'fails',
      runNodeCaptured(['--test', `${fixtureRelativeRoot}/dist/tests/failing.test.js`]),
    );
  }
  removeFixtureFile('tests/failing.test.ts');
  removeFixtureFile('dist/tests/failing.test.js');

  writeFixtureFile(
    'src/lint-violation.ts',
    [
      "import { join } from 'path';",
      "import { latest } from './checkpoint';",
      '',
      'export const marker = [join, latest];',
      '',
    ].join('\n'),
  );
  record(
    'a lint violation fails the linter',
    'fails',
    runNodeCaptured(['scripts/quality/lint.mjs', '--root', `${fixtureRelativeRoot}/src`]),
  );
  removeFixtureFile('src/lint-violation.ts');
}

try {
  info('smoke', 'Scaffolding a throwaway runtime fixture under .agent-runtime/toolchain-smoke.');
  scaffold();
  runPositiveCases();
  runNegativeCases();
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

for (const result of results) {
  info('smoke', `${result.passed ? 'ok  ' : 'FAIL'} ${result.name} (expected to ${result.expectation})`);
}

const failed = results.filter((result) => !result.passed);
if (failed.length > 0) {
  process.stderr.write(`[error] Toolchain smoke test failed ${failed.length} of ${results.length} case(s).\n`);
  process.exit(1);
}

info('smoke', `Toolchain smoke test passed all ${results.length} case(s).`);
