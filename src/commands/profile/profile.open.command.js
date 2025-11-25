import { defineCommand } from '../../lib/define-command.js';
import { openBrowser } from '../../models/utils.js';
import { colorOpt, humanJsonOutputFormatOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const profileOpenCommand = defineCommand({
  name: 'open',
  description: 'Open your profile in the Console',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [],
  async execute() {
    await openBrowser('/users/me/information', 'Opening the profile page in your browser');
  },
});
