import { defineCommand } from '../../lib/define-command.js';

export const k8sCommand = defineCommand({
  description: 'Manage Kubernetes clusters',
  since: '4.3.0',
  isExperimental: true,
  featureFlag: 'k8s',
});
