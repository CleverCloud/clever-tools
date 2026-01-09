import { defineCommand } from '../../lib/define-command.js';

export const helpCommand = defineCommand({
  description: 'Display help about the Clever Cloud CLI',
  since: '0.1.0',
  options: {},
  args: [],
  handler: null,
});
