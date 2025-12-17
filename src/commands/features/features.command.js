import { defineCommand } from '../../lib/define-command.js';
import { featuresListCommand } from './features.list.command.js';

export const featuresCommand = defineCommand({
  ...featuresListCommand,
  description: 'Manage Clever Tools experimental features',
});
