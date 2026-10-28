import { defineCommand } from '../../lib/define-command.js';

export const terraformCommand = defineCommand({
  description: 'Terraform commands',
  since: '5.3.0',
  isExperimental: true,
  featureFlag: 'terraform',
  options: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
