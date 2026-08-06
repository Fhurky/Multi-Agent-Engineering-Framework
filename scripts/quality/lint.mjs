// Lints the runtime TypeScript tree against the binding parameters of ADR-0001.
//
// Usage:
//   node scripts/quality/lint.mjs                 lint the configured runtime source roots
//   node scripts/quality/lint.mjs --root <path>   lint an explicit root instead (repeatable)
//
// The compiler already enforces type-level correctness through the strict options in
// tsconfig.json. This linter enforces the module-system and dependency rules that the
// compiler cannot express, using no third-party dependency of its own:
//
//   ESM-RELATIVE-EXTENSION  relative import specifiers end with .js
//   NO-THIRD-PARTY-IMPORT   bare specifiers are Node.js builtins only
//   NO-COMMONJS             no require, module.exports, __dirname, or __filename
//   STRICT-ASSERT           assertions import node:assert/strict, never node:assert
//   MAX-LINE-LENGTH         lines stay within the configured limit
//
// The scan is line-based and deliberately simple. It reads import and export statements
// and ignores comment lines; it is a guard rail, not a parser.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

import {
  assertSupportedNodeVersion,
  fail,
  info,
  listFiles,
  loadQualityConfig,
  repositoryRoot,
  rootOverrides,
} from './lib/toolchain.mjs';

assertSupportedNodeVersion();

const config = loadQualityConfig();
const overrides = rootOverrides(process.argv.slice(2));
const roots = overrides.length > 0 ? overrides : config.runtime.sourceRoots;
const { maxLineLength, allowedBareImportPrefixes, relativeImportExtension } = config.lint;

const staticSpecifier = /^\s*(?:import|export)\b[^'"]*?from\s*['"]([^'"]+)['"]/;
const bareImport = /^\s*import\s*['"]([^'"]+)['"]/;
const dynamicImport = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/;
const commonJsUsage = /\b(?:require\s*\(|module\.exports|exports\.[A-Za-z_$]|__dirname|__filename)/;
const commentLine = /^\s*(?:\/\/|\/\*|\*)/;

const findings = [];

function report(file, lineNumber, rule, message) {
  findings.push(`${file}:${lineNumber} [${rule}] ${message}`);
}

function specifiersOf(line) {
  const specifiers = [];
  for (const pattern of [staticSpecifier, bareImport, dynamicImport]) {
    const match = pattern.exec(line);
    if (match !== null) {
      specifiers.push(match[1]);
    }
  }
  return specifiers;
}

function checkSpecifier(file, lineNumber, specifier) {
  if (specifier.startsWith('.')) {
    if (!specifier.endsWith(relativeImportExtension)) {
      report(
        file,
        lineNumber,
        'ESM-RELATIVE-EXTENSION',
        `relative specifier "${specifier}" must end with "${relativeImportExtension}" (ADR-0001).`,
      );
    }
    return;
  }

  if (!allowedBareImportPrefixes.some((prefix) => specifier.startsWith(prefix))) {
    report(
      file,
      lineNumber,
      'NO-THIRD-PARTY-IMPORT',
      `specifier "${specifier}" is not a Node.js builtin; the runtime has zero third-party dependencies (ADR-0001).`,
    );
    return;
  }

  if (specifier === 'node:assert') {
    report(file, lineNumber, 'STRICT-ASSERT', 'import "node:assert/strict" instead of "node:assert" (ADR-0001).');
  }
}

const files = listFiles({
  roots,
  extensions: config.runtime.sourceExtensions,
  ignoredDirectories: config.ignoredDirectories,
});

for (const file of files) {
  const lines = readFileSync(join(repositoryRoot, file), 'utf8').split('\n');
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const withoutCarriageReturn = line.replace(/\r$/, '');

    if (withoutCarriageReturn.length > maxLineLength) {
      report(
        file,
        lineNumber,
        'MAX-LINE-LENGTH',
        `line is ${withoutCarriageReturn.length} characters; the limit is ${maxLineLength}.`,
      );
    }

    if (commentLine.test(withoutCarriageReturn)) {
      return;
    }

    for (const specifier of specifiersOf(withoutCarriageReturn)) {
      checkSpecifier(file, lineNumber, specifier);
    }

    if (commonJsUsage.test(withoutCarriageReturn)) {
      report(
        file,
        lineNumber,
        'NO-COMMONJS',
        'CommonJS constructs are not allowed; the runtime is ESM (ADR-0001).',
      );
    }
  });
}

if (findings.length > 0) {
  for (const finding of findings) {
    process.stderr.write(`${finding}\n`);
  }
  fail(`Lint failed with ${findings.length} finding(s) in ${files.length} file(s).`);
}

if (files.length === 0) {
  info('lint', `No TypeScript sources under ${roots.join(', ')}; the runtime tree is empty.`);
  process.exit(0);
}

info('lint', `Lint passed for ${files.length} file(s).`);
