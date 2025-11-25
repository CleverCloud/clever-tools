import { colorOpt, updateNotifierOpt, verboseOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
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

export const emailsCommand = {
  name: 'emails',
  description: 'Manage email addresses of the current user',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [],
  async execute(params) {
    const { format } = params.options;
      const addresses = await getUserEmailAddresses();
    
      switch (format) {
        case 'json': {
          Logger.printJson(addresses);
          break;
        }
        case 'human':
        default: {
          Logger.println('✉️  Primary email address:');
          Logger.println(` • ${styleText('green', addresses.primary)}`);
          if (addresses.secondary.length > 0) {
            Logger.println();
            Logger.println(`✉️  ${addresses.secondary.length} secondary email address(es):`);
            addresses.secondary.forEach((address) => Logger.println(` • ${styleText('blue', address)}`));
          }
        }
      }
  }
};
