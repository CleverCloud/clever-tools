import { defineCommand } from '../../lib/define-command.js';
import { addonListCommand } from './addon.list.command.js';

export const addonCommand = defineCommand({
  ...addonListCommand,
  description: 'Manage add-ons',
});
