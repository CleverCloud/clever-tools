#!/usr/bin/env node
//
// Lint and format the file Claude Code just edited.
//
// This script is a Claude Code PostToolUse hook (see .claude/settings.json), run after
// every Edit, Write or MultiEdit. It reads the hook payload on stdin, then runs ESLint
// (with --fix) and Prettier on the edited file. Files outside the repository are skipped,
// and Prettier skips the files listed in .prettierignore (Markdown).
//
// When ESLint errors remain after --fix, they are printed on stderr and the script exits
// with code 2, so Claude Code feeds them back to the agent.
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

const JS_FILE_REGEX = /\.[cm]?js$/;

runCommand(async () => {
  const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const payload = JSON.parse(fs.readFileSync(0, 'utf-8'));
  const filePath = payload.tool_input?.file_path;

  if (filePath == null) {
    return;
  }

  const relativePath = path.relative(projectDir, path.resolve(projectDir, filePath));
  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return;
  }

  // `npm run lint:fix` is `eslint --fix`, the file is appended to it
  const eslintResult = JS_FILE_REGEX.test(relativePath)
    ? run(projectDir, `npm run --silent lint:fix -- --no-warn-ignored "${relativePath}"`)
    : null;

  // `npm run format` is `prettier . --write`, appending the file would format the whole repository
  run(projectDir, `npx --no-install prettier --write --ignore-unknown --log-level=warn "${relativePath}"`);

  if (eslintResult != null && eslintResult.status !== 0) {
    console.error(`ESLint errors remain in ${relativePath}:\n${eslintResult.stdout}${eslintResult.stderr}`);
    process.exitCode = 2;
  }
});

/**
 * Runs a shell command from the repository root and captures its output.
 * @param {string} projectDir - Root of the repository
 * @param {string} command - The shell command to run
 * @returns {import('node:child_process').SpawnSyncReturns<string>}
 */
function run(projectDir, command) {
  return spawnSync(command, { cwd: projectDir, shell: true, encoding: 'utf-8' });
}
