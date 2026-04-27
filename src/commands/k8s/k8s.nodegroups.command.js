import { defineCommand } from '../../lib/define-command.js';

export const k8sNodeGroupCommand = defineCommand({
  description: 'Manage Kubernetes node groups',
  since: 'unreleased',
  featureFlag: 'k8s',
});
