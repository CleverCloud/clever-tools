import { defineCommand } from '../../lib/define-command.js';

export const serviceTokensCommand = defineCommand({
  description: 'Manage organisation service tokens for machine-to-machine authentication',
  since: '4.8.0',
  options: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
