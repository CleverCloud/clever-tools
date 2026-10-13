#!/usr/bin/env node
//
// Lint and format the file Claude Code just edited.
//
// This script is a Claude Code PostToolUse hook (see .claude/settings.json), run after
// every Edit or Write. It reads the hook payload on stdin, then runs ESLint
// (with --fix) and Prettier on the edited file. Files outside the repository are skipped,
// and Prettier skips the files listed in .prettierignore (Markdown).
//
// When ESLint errors remain after --fix, or when Prettier fails (e.g. a file it can't parse),
// they are printed on stderr and the script exits with code 2, so Claude Code feeds them
// back to the agent.
//
// USAGE: lint-format.js < payload.json
//
// ENVIRONMENT VARIABLES:
//   CLAUDE_PROJECT_DIR    Root of the repository, set by Claude Code (defaults to the current directory)
//
// EXAMPLES:
//   echo '{"tool_input":{"file_path":"src/logger.js"}}' | lint-format.js

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { runCommand } from '../../scripts/lib/command.js';

const LINTED_FILE_REGEX = /\.([cm]?js|ts)$/;

runCommand(async () => {
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const payload = JSON.parse(fs.readFileSync(0, 'utf-8'));
  const filePath = payload.tool_input?.file_path;

  if (filePath == null) {
    return;
  }

  const absolutePath = path.resolve(projectDir, filePath);
  if (!fs.existsSync(absolutePath)) {
    return;
  }

  // Compare real paths, so a symlink inside the repository can't point the tools to a file outside of it
  const relativePath = path.relative(fs.realpathSync(projectDir), fs.realpathSync(absolutePath));
  if (relativePath === '..' || relativePath.startsWith(`..${path.sep}`) || path.isAbsolute(relativePath)) {
    return;
  }

  // Same as `npm run lint:fix` (`eslint --fix`) on this file, called directly so the path never goes through a shell
  const eslintResult = LINTED_FILE_REGEX.test(relativePath)
    ? run(projectDir, 'node_modules/eslint/bin/eslint.js', ['--fix', '--no-warn-ignored', '--', relativePath])
    : null;

  // `npm run format` is `prettier . --write`, appending the file would format the whole repository
  const prettierResult = run(projectDir, 'node_modules/prettier/bin/prettier.cjs', [
    '--write',
    '--ignore-unknown',
    '--log-level=warn',
    '--',
    relativePath,
  ]);

  if (eslintResult != null && eslintResult.status !== 0) {
    console.error(`ESLint errors remain in ${relativePath}:\n${eslintResult.stdout}${eslintResult.stderr}`);
    process.exitCode = 2;
  }
  if (prettierResult.status !== 0) {
    console.error(`Prettier failed on ${relativePath}:\n${prettierResult.stdout}${prettierResult.stderr}`);
    process.exitCode = 2;
  }
});

/**
 * Runs a Node.js script of the project from the repository root, without a shell, and captures its output.
 * @param {string} projectDir - Root of the repository
 * @param {string} script - Path of the script, relative to the repository root
 * @param {string[]} args - Arguments, passed as is: never interpreted by a shell
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function run(projectDir, script, args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: projectDir, encoding: 'utf-8' });
}
