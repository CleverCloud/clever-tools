import { defineCommand } from '../../lib/define-command.js';

export const terraformCommand = defineCommand({
  description: 'Terraform commands',
  since: null,
  isExperimental: true,
  featureFlag: 'terraform',
  options: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
