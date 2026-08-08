// Checks or normalizes whitespace formatting across the toolchain and runtime trees.
//
// Usage:
//   node scripts/quality/format.mjs --check          report violations and exit non-zero
//   node scripts/quality/format.mjs --write          rewrite the offending files in place
//   node scripts/quality/format.mjs --root <path>    override the configured roots (repeatable)
//
// The repository stores every text file with LF endings (.gitattributes declares
// "* text=auto eol=lf"), so this check enforces the same rules the repository already
// promises: no byte order mark, LF endings, no trailing whitespace, no tab indentation,
// and exactly one final newline. It intentionally does not reflow code, so it never
// competes with a future opinionated formatter and adds no dependency.

import { readFileSync, writeFileSync } from 'node:fs';
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
const argv = process.argv.slice(2);
const write = argv.includes('--write');
const overrides = rootOverrides(argv);
const roots = overrides.length > 0 ? overrides : config.format.roots;
const indent = ' '.repeat(config.format.indentWidth);

const files = listFiles({
  roots,
  extensions: config.format.extensions,
  ignoredDirectories: config.ignoredDirectories,
});

const violations = [];
const rewritten = [];

function normalize(original) {
  const reasons = [];
  let content = original;

  if (config.format.forbidByteOrderMark && content.startsWith('\uFEFF')) {
    reasons.push('byte order mark');
    content = content.slice(1);
  }

  if (config.format.lineEnding === 'lf' && content.includes('\r')) {
    reasons.push('non-LF line ending');
    content = content.split('\r\n').join('\n').split('\r').join('\n');
  }

  if (config.format.forbidTabIndentation && /^\t+/m.test(content)) {
    reasons.push('tab indentation');
    content = content.replace(/^\t+/gm, (tabs) => indent.repeat(tabs.length));
  }

  if (config.format.forbidTrailingWhitespace && /[ \t]+$/m.test(content)) {
    reasons.push('trailing whitespace');
    content = content.replace(/[ \t]+$/gm, '');
  }

  if (config.format.requireFinalNewline && content.length > 0) {
    const trimmed = content.replace(/\n+$/, '');
    if (content !== `${trimmed}\n`) {
      reasons.push('missing or repeated final newline');
      content = `${trimmed}\n`;
    }
  }

  return { content, reasons };
}

for (const file of files) {
  const absolutePath = join(repositoryRoot, file);
  const original = readFileSync(absolutePath, 'utf8');
  const { content, reasons } = normalize(original);
  if (reasons.length === 0) {
    continue;
  }

  if (write) {
    writeFileSync(absolutePath, content, 'utf8');
    rewritten.push(file);
  } else {
    violations.push(`${file}: ${reasons.join(', ')}`);
  }
}

if (violations.length > 0) {
  for (const violation of violations) {
    process.stderr.write(`${violation}\n`);
  }
  fail(`Format check failed for ${violations.length} file(s). Run "npm run format" to fix them.`);
}

if (write) {
  info('format', `Normalized ${rewritten.length} file(s) out of ${files.length} checked.`);
} else {
  info('format', `Format check passed for ${files.length} file(s).`);
}
