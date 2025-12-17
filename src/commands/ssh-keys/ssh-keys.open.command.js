import { defineCommand } from '../../lib/define-command.js';
import { openBrowser } from '../../models/utils.js';

export const sshKeysOpenCommand = defineCommand({
  description: 'Open the SSH keys management page in the Console',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [],
  handler() {
    return openBrowser('/users/me/ssh-keys', 'Opening the SSH keys management page of the Console in your browser');
  },
});
