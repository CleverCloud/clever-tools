import { defineCommand } from '../../lib/define-command.js';

export const configProviderCommand = defineCommand({
  description: 'Manage configuration providers',
  since: '4.6.0',
  options: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
