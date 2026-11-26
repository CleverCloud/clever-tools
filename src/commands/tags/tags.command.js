import { defineCommand } from '../../lib/define-command.js';

export const tagsCommand = defineCommand({
  description: 'Manage the tags of applications, add-ons, Kubernetes clusters and Network Groups',
  since: null,
  isExperimental: true,
  featureFlag: 'tags',
});
