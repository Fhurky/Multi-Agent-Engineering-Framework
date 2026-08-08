// Compiles the runtime tree and runs its tests with the Node.js built-in test runner.
//
// Usage:
//   node scripts/ci/runtime-test.mjs               compile and run every runtime test
//   node scripts/ci/runtime-test.mjs --coverage    additionally report test coverage
//
// ADR-0001 fixes the test runner as node:test with node:assert/strict, so this entry
// point adds no framework. Tests are authored in TypeScript, compiled into the output
// directory with the project configuration, and executed from the compiled tree.
//
// An empty runtime tree is a valid state and reports success without running anything.

import { rmSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import {
  assertSupportedNodeVersion,
  info,
  listFiles,
  loadQualityConfig,
  repositoryRoot,
  runNode,
  typescriptCompilerPath,
} from '../quality/lib/toolchain.mjs';

assertSupportedNodeVersion();

const config = loadQualityConfig();
const coverage = process.argv.includes('--coverage');
const outputDirectory = config.runtime.outputDirectory;

const testSources = listFiles({
  roots: config.runtime.sourceRoots,
  extensions: [config.runtime.testFileSuffix],
  ignoredDirectories: config.ignoredDirectories,
});

if (testSources.length === 0) {
  info('test', `No "*${config.runtime.testFileSuffix}" files under ${config.runtime.sourceRoots.join(', ')}.`);
  info('test', 'The runtime tree is empty; the test runner activates with the first runtime test.');
  process.exit(0);
}

rmSync(join(repositoryRoot, outputDirectory), { recursive: true, force: true });

info('test', `Compiling the project before running ${testSources.length} test file(s).`);
const compileStatus = runNode([typescriptCompilerPath(), '--project', 'tsconfig.json']);
if (compileStatus !== 0) {
  process.exit(compileStatus);
}

const compiledTests = testSources.map((source) => `${outputDirectory}/${source.slice(0, -3)}.js`);
const runnerArgs = ['--test'];
if (coverage) {
  runnerArgs.push('--experimental-test-coverage');
}
runnerArgs.push(...compiledTests);

info('test', `Running the Node.js test runner${coverage ? ' with coverage' : ''}.`);
const testStatus = runNode(runnerArgs);
if (testStatus !== 0) {
  process.exit(testStatus);
}

info('test', `Tests passed for ${compiledTests.length} compiled test file(s).`);
