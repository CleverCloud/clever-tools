import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import {
  todo_addEmailAddress as addEmailAddress,
  todo_removeEmailAddress as removeEmailAddress,
} from '@clevercloud/client/esm/api/v2/user.js';
import { confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getUserEmailAddresses } from '../../models/emails.js';
import { sendToApi } from '../../models/send-to-api.js';
import { openBrowser } from '../../models/utils.js';

export const emailsOpenCommand = {
  name: 'open',
  description: 'Open the email addresses management page in the Console',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [],
  execute() {
    return openBrowser('/users/me/emails', 'Opening the email addresses management page of the Console in your browser');
  }
};
