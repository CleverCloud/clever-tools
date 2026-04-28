#!/usr/bin/env node
// Tiny fixture used by test/cli-runner.test.js to exercise interactive prompt handling.
// Reads two lines from stdin, prompting on stderr (mirroring how @inquirer/prompts renders).

import { createInterface } from 'node:readline';

const rl = createInterface({ input: process.stdin });
/** @type {Array<string>} */
const lines = [];
const expected = 2;

process.stderr.write('\x1B[36mQ1?\x1B[39m ');
rl.on('line', (line) => {
  lines.push(line);
  if (lines.length === 1) {
    process.stderr.write('Q2? ');
  } else if (lines.length === expected) {
    rl.close();
  }
});
rl.on('close', () => {
  process.stdout.write(`A1=${lines[0]}\nA2=${lines[1]}\n`);
  process.exit(0);
});
