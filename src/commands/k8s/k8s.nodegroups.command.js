import { defineCommand } from '../../lib/define-command.js';

export const k8sNodeGroupCommand = defineCommand({
  description: 'Manage Kubernetes node groups',
  since: '4.9.0',
  featureFlag: 'k8s',
});
