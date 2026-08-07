/**
 * Static dependency allow-list test.
 *
 * The module imports no runtime implementation module and no runtime contract root.
 * `scripts/release/integration-merge/` is a level-0, self-contained release
 * control-plane leaf in the approved import graph: nothing imports it, and it imports
 * neither `src/orchestrator/state/contracts/` nor `src/agents/contracts/`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const MODULE_ROOT = join(HERE, '..');

/** The only third-party-free specifiers this module may import. */
const ALLOWED_BUILTINS: readonly string[] = ['node:crypto'];

/** Builtins the tests themselves may additionally use. */
const ALLOWED_TEST_BUILTINS: readonly string[] = [
  'node:test',
  'node:assert/strict',
  'node:fs',
  'node:path',
  'node:url',
  'node:crypto',
];

interface SourceFile {
  readonly path: string;
  readonly text: string;
  readonly isTest: boolean;
}

function collect(directory: string, accumulator: SourceFile[]): SourceFile[] {
  for (const entry of readdirSync(directory)) {
    const full = join(directory, entry);
    if (statSync(full).isDirectory()) {
      collect(full, accumulator);
      continue;
    }
    if (!entry.endsWith('.ts')) {
      continue;
    }
    const path = relative(MODULE_ROOT, full).replace(/\\/g, '/');
    accumulator.push({
      path,
      text: readFileSync(full, 'utf8'),
      isTest: path.startsWith('tests/'),
    });
  }
  return accumulator;
}

const SOURCES = collect(MODULE_ROOT, []);

function importSpecifiers(text: string): readonly string[] {
  const specifiers: string[] = [];
  const staticImport = /^\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/gm;
  let match = staticImport.exec(text);
  while (match !== null) {
    specifiers.push(match[1] as string);
    match = staticImport.exec(text);
  }
  const dynamicImport = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  match = dynamicImport.exec(text);
  while (match !== null) {
    specifiers.push(match[1] as string);
    match = dynamicImport.exec(text);
  }
  const requireCall = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  match = requireCall.exec(text);
  while (match !== null) {
    specifiers.push(match[1] as string);
    match = requireCall.exec(text);
  }
  return specifiers;
}

test('the module has source and test files to analyse', () => {
  assert.ok(SOURCES.some((file) => !file.isTest));
  assert.ok(SOURCES.some((file) => file.isTest));
});

test('every import is either an allowed builtin or module-local', () => {
  for (const file of SOURCES) {
    const allowed = file.isTest ? ALLOWED_TEST_BUILTINS : ALLOWED_BUILTINS;
    for (const specifier of importSpecifiers(file.text)) {
      if (specifier.startsWith('.')) {
        continue;
      }
      assert.ok(
        allowed.includes(specifier),
        `${file.path} imports the disallowed specifier ${specifier}`,
      );
    }
  }
});

test('no import reaches outside the module directory', () => {
  for (const file of SOURCES) {
    for (const specifier of importSpecifiers(file.text)) {
      if (!specifier.startsWith('.')) {
        continue;
      }
      const depth = file.path.split('/').length - 1;
      const ascents = (specifier.match(/\.\.\//g) ?? []).length;
      assert.ok(
        ascents <= depth,
        `${file.path} escapes the module with ${specifier}`,
      );
    }
  }
});

test('no import names a runtime implementation module', () => {
  const runtimeModules = [
    'src/orchestrator',
    'src/agents',
    'src/shared',
    'src/backend',
    'src/frontend',
    'orchestrator/state',
    'orchestrator/scheduling',
    'orchestrator/supervisor',
    'orchestrator/lifecycle',
    'orchestrator/recovery',
    'orchestrator/workspace',
    'orchestrator/ingress',
    'orchestrator/integration',
  ];

  for (const file of SOURCES) {
    for (const specifier of importSpecifiers(file.text)) {
      for (const runtimeModule of runtimeModules) {
        assert.equal(
          specifier.includes(runtimeModule),
          false,
          `${file.path} imports the runtime module ${specifier}`,
        );
      }
    }
  }
});

test('no import names either runtime contract root', () => {
  for (const file of SOURCES) {
    for (const specifier of importSpecifiers(file.text)) {
      assert.equal(
        /state\/contracts|agents\/contracts/.test(specifier),
        false,
        `${file.path} imports a runtime contract root: ${specifier}`,
      );
    }
  }
});

test('no import names an orchestration script or a task record', () => {
  for (const file of SOURCES) {
    for (const specifier of importSpecifiers(file.text)) {
      assert.equal(
        /scripts\/orchestration|scripts\/ci|scripts\/quality|tasks\//.test(specifier),
        false,
        `${file.path} imports ${specifier}`,
      );
    }
  }
});

test('the module has no third-party dependency of any kind', () => {
  const external = new Set<string>();
  for (const file of SOURCES) {
    for (const specifier of importSpecifiers(file.text)) {
      if (specifier.startsWith('.') || specifier.startsWith('node:')) {
        continue;
      }
      external.add(specifier);
    }
  }
  assert.deepEqual([...external], []);
});

test('the published entry point is index.ts', () => {
  assert.ok(SOURCES.some((file) => file.path === 'index.ts'));
});

test('every non-test module file is reachable from the entry point', () => {
  const entry = SOURCES.find((file) => file.path === 'index.ts');
  assert.ok(entry !== undefined);

  const reachable = new Set<string>(['index.ts']);
  const queue = ['index.ts'];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    const file = SOURCES.find((candidate) => candidate.path === current);
    if (file === undefined) {
      continue;
    }
    for (const specifier of importSpecifiers(file.text)) {
      if (!specifier.startsWith('./')) {
        continue;
      }
      const resolved = specifier.replace('./', '');
      if (!reachable.has(resolved)) {
        reachable.add(resolved);
        queue.push(resolved);
      }
    }
  }

  const unreachable = SOURCES.filter(
    (file) => !file.isTest && !reachable.has(file.path),
  ).map((file) => file.path);
  assert.deepEqual(unreachable, []);
});

test('nothing outside the module could import it without a deep path', () => {
  // The approved graph records `release-integration-merge <- (nobody)`. The module is
  // a leaf: it exports one entry point and holds no re-export of any runtime symbol.
  const entry = SOURCES.find((file) => file.path === 'index.ts');
  assert.ok(entry !== undefined);
  for (const specifier of importSpecifiers(entry.text)) {
    assert.ok(
      specifier.startsWith('./'),
      `the entry point must re-export module-local symbols only, found ${specifier}`,
    );
  }
});
