import { defineCommand } from '../../lib/define-command.js';

export const configProviderCommand = defineCommand({
  description: 'Manage configuration providers',
  since: 'unreleased',
  options: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
