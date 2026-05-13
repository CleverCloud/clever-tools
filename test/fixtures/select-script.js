#!/usr/bin/env node
// Tiny fixture used by test/cli-runner.test.js to exercise raw-mode prompts.
// Renders an @inquirer/select with three choices and prints the chosen value.
import { select } from '@inquirer/prompts';

const answer = await select({
  message: 'Pick one',
  choices: [
    { name: 'Alpha', value: 'alpha' },
    { name: 'Beta', value: 'beta' },
    { name: 'Gamma', value: 'gamma' },
  ],
});

console.log(`PICKED=${answer}`);
