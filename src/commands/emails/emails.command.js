import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getUserEmailAddresses } from '../../models/emails.js';
import { colorOpt, humanJsonOutputFormatOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const emailsCommand = {
  name: 'emails',
  description: 'Manage email addresses of the current user',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt,
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
  },
};
