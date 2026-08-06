// Type-checks the runtime TypeScript tree against the root tsconfig.json.
//
// Usage:
//   node scripts/quality/typecheck.mjs            type-check only (no emit)
//   node scripts/quality/typecheck.mjs --emit     compile into the configured output directory
//
// The runtime tree is empty until Wave 3 lands its first module. An empty tree is a
// valid state, not a failure: the compiler is skipped with an explicit message so that
// the toolchain is usable from the commit that introduces it.

import process from 'node:process';

import {
  assertSupportedNodeVersion,
  info,
  listFiles,
  loadQualityConfig,
  runNode,
  typescriptCompilerPath,
} from './lib/toolchain.mjs';

assertSupportedNodeVersion();

const config = loadQualityConfig();
const emit = process.argv.includes('--emit');
const sources = listFiles({
  roots: config.runtime.sourceRoots,
  extensions: config.runtime.sourceExtensions,
  ignoredDirectories: config.ignoredDirectories,
});

if (sources.length === 0) {
  info('typecheck', `No TypeScript sources under ${config.runtime.sourceRoots.join(', ')}; the runtime tree is empty.`);
  info('typecheck', 'Skipped the compiler. This check activates automatically with the first runtime module.');
  process.exit(0);
}

const args = [typescriptCompilerPath(), '--project', 'tsconfig.json'];
if (!emit) {
  args.push('--noEmit');
}

info('typecheck', `Compiling ${sources.length} TypeScript file(s) with the project configuration.`);
const status = runNode(args);
if (status !== 0) {
  process.exit(status);
}

info('typecheck', emit ? 'Compilation succeeded.' : 'Type check passed.');
