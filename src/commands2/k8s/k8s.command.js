import { defineCommand } from '../../lib/define-command.js';

export const k8sCommand = defineCommand({
  description: 'Manage Kubernetes clusters',
  isExperimental: true,
  featureFlag: 'k8s',
  flags: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
