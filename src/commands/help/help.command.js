import { defineCommand } from '../../lib/define-command.js';

export const helpCommand = defineCommand({
  description: 'Display help about the Clever Cloud CLI',
  since: '0.1.0',
  sinceDate: '2014-11-13',
  options: {},
  args: [],
  handler: null,
});
