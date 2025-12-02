import { defineCommand } from '../../lib/define-command.js';
import { openBrowser } from '../../models/utils.js';

export const emailsOpenCommand = defineCommand({
  description: 'Open the email addresses management page in the Console',
  flags: {},
  args: [],
  handler() {
    return openBrowser(
      '/users/me/emails',
      'Opening the email addresses management page of the Console in your browser',
    );
  },
});
