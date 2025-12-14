import { defineCommand } from '../../lib/define-command.js';
import { openBrowser } from '../../models/utils.js';

export const profileOpenCommand = defineCommand({
  description: 'Open your profile in the Console',
  since: '3.11.0',
  options: {},
  args: [],
  async handler() {
    await openBrowser('/users/me/information', 'Opening the profile page in your browser');
  },
});
