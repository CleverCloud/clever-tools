import { colorOpt, updateNotifierOpt, verboseOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import dedent from 'dedent';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as User from '../../models/user.js';
import { openBrowser } from '../../models/utils.js';

export const profileOpenCommand = {
  name: 'open',
  description: 'Open your profile in the Console',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [],
  async execute() {
    await openBrowser('/users/me/information', 'Opening the profile page in your browser');
  }
};
