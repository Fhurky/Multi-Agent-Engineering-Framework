// Shared helpers for the runtime toolchain entry points.
//
// Owned by TASK-018 (devops) and bound by ADR-0001: Node.js 22 LTS or newer, ESM,
// and zero third-party dependencies. Only Node.js builtins may be imported here.

import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const configPath = join(repositoryRoot, 'scripts', 'quality', 'quality.config.json');

/** Converts a filesystem path to a repository-relative POSIX path. */
export function toPosix(path) {
  return path.split('\\').join('/');
}

/** Reads the shared quality configuration. */
export function loadQualityConfig() {
  return JSON.parse(readFileSync(configPath, 'utf8'));
}

/** Reads the declared minimum Node.js major version from the root manifest. */
export function requiredNodeMajor() {
  const manifest = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8'));
  const range = manifest.engines?.node ?? '';
  const match = /(\d+)/.exec(range);
  if (match === null) {
    throw new Error('package.json does not declare a parsable engines.node range.');
  }
  return Number(match[1]);
}

/** Fails fast when the active interpreter is older than the ADR-0001 platform floor. */
export function assertSupportedNodeVersion() {
  const required = requiredNodeMajor();
  const actual = Number(process.versions.node.split('.')[0]);
  if (actual < required) {
    fail(`Node.js ${required} or newer is required by ADR-0001, but this interpreter is ${process.versions.node}.`);
  }
}

/** Recursively lists repository-relative POSIX file paths under the given roots. */
export function listFiles({ roots, extensions, ignoredDirectories }) {
  const ignored = new Set(ignoredDirectories ?? []);
  const found = [];

  const walk = (absoluteDirectory) => {
    for (const entry of readdirSync(absoluteDirectory, { withFileTypes: true }).sort((a, b) =>
      a.name.localeCompare(b.name, 'en'),
    )) {
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) {
          walk(join(absoluteDirectory, entry.name));
        }
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      if (extensions.some((extension) => entry.name.endsWith(extension))) {
        found.push(toPosix(relative(repositoryRoot, join(absoluteDirectory, entry.name))));
      }
    }
  };

  for (const root of roots) {
    const absoluteRoot = join(repositoryRoot, root);
    if (existsSync(absoluteRoot) && statSync(absoluteRoot).isDirectory()) {
      walk(absoluteRoot);
    }
  }

  return found.sort((a, b) => a.localeCompare(b, 'en'));
}

/** Resolves the locally installed TypeScript compiler entry point. */
export function typescriptCompilerPath() {
  const compiler = join(repositoryRoot, 'node_modules', 'typescript', 'bin', 'tsc');
  if (!existsSync(compiler)) {
    fail('The TypeScript compiler is not installed. Run "npm ci" before running this check.');
  }
  return compiler;
}

/** Runs a Node.js child process with inherited output and returns its exit code. */
export function runNode(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: options.cwd ?? repositoryRoot,
    stdio: 'inherit',
    env: process.env,
  });
  if (result.error !== undefined) {
    throw result.error;
  }
  if (result.signal !== null) {
    return 1;
  }
  return result.status ?? 1;
}

/** Runs a Node.js child process with captured output and returns its exit code and streams. */
export function runNodeCaptured(args, options = {}) {
  const result = spawnSync(process.execPath, args, {
    cwd: options.cwd ?? repositoryRoot,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.error !== undefined) {
    throw result.error;
  }
  return {
    status: result.signal !== null ? 1 : (result.status ?? 1),
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

/** Reads repeated `--root <path>` overrides from the command line. */
export function rootOverrides(argv) {
  const roots = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--root' && index + 1 < argv.length) {
      roots.push(toPosix(argv[index + 1]));
      index += 1;
    }
  }
  return roots;
}

/** Emits a labelled informational line. */
export function info(label, message) {
  process.stdout.write(`[${label}] ${message}\n`);
}

/** Emits a labelled failure line and terminates with a non-zero exit code. */
export function fail(message) {
  process.stderr.write(`[error] ${message}\n`);
  process.exit(1);
}
