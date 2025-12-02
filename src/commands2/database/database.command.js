import { defineCommand } from '../../lib/define-command.js';

export const databaseCommand = defineCommand({
  description: 'Manage databases and backups',
  flags: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
