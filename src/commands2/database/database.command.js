import { defineCommand } from '../../lib/define-command.js';

export const databaseCommand = defineCommand({
  description: 'Manage databases and backups',
  since: '2.10.0',
  options: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
