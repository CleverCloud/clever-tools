import { defineCommand } from '../../lib/define-command.js';

export const k8sCommand = defineCommand({
  description: 'Manage Kubernetes clusters',
  since: '4.3.0',
  sinceDate: '2025-10-22',
  isExperimental: true,
  featureFlag: 'k8s',
  options: {},
  args: [],
  // Parent command - no handler, only contains subcommands
  handler: null,
});
