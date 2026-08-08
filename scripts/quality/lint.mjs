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

// Matches the specifier of a static import or export, a side-effect import, and a
// dynamic import. The scan runs over the whole file so that a specifier on the closing
// line of a multi-line import statement is still checked.
const specifierPattern = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)['"]([^'"\n]+)['"]/g;
const commonJsUsage = /\b(?:require\s*\(|module\.exports|exports\.[A-Za-z_$]|__dirname|__filename)/;
const commentLine = /^\s*(?:\/\/|\/\*|\*)/;

const findings = [];

function report(file, lineNumber, rule, message) {
  findings.push(`${file}:${lineNumber} [${rule}] ${message}`);
}

/** Maps a character offset in the file to its one-based line number. */
function lineNumberAt(lineStartOffsets, offset) {
  let line = 1;
  while (line < lineStartOffsets.length && lineStartOffsets[line] <= offset) {
    line += 1;
  }
  return line;
}

/** Yields every module specifier in the file with the line it appears on. */
function specifiersOf(content) {
  const rawLines = content.split('\n');
  const lineStartOffsets = [0];
  for (const rawLine of rawLines) {
    lineStartOffsets.push(lineStartOffsets[lineStartOffsets.length - 1] + rawLine.length + 1);
  }

  const specifiers = [];
  specifierPattern.lastIndex = 0;
  let match = specifierPattern.exec(content);
  while (match !== null) {
    const lineNumber = lineNumberAt(lineStartOffsets, match.index);
    const lineText = rawLines[lineNumber - 1] ?? '';
    if (!commentLine.test(lineText)) {
      specifiers.push({ specifier: match[1], lineNumber });
    }
    match = specifierPattern.exec(content);
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
  const content = readFileSync(join(repositoryRoot, file), 'utf8');
  const lines = content.split('\n').map((line) => line.replace(/\r$/, ''));

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (line.length > maxLineLength) {
      report(file, lineNumber, 'MAX-LINE-LENGTH', `line is ${line.length} characters; the limit is ${maxLineLength}.`);
    }

    if (commentLine.test(line)) {
      return;
    }

    if (commonJsUsage.test(line)) {
      report(file, lineNumber, 'NO-COMMONJS', 'CommonJS constructs are not allowed; the runtime is ESM (ADR-0001).');
    }
  });

  for (const { specifier, lineNumber } of specifiersOf(content)) {
    checkSpecifier(file, lineNumber, specifier);
  }
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
