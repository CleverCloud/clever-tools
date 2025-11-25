import { defineCommand } from '../../lib/define-command.js';
import { openBrowser } from '../../models/utils.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const emailsOpenCommand = defineCommand({
  name: 'open',
  description: 'Open the email addresses management page in the Console',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [],
  execute() {
    return openBrowser(
      '/users/me/emails',
      'Opening the email addresses management page of the Console in your browser',
    );
  },
});
