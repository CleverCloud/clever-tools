import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { getUserEmailAddresses } from '../../models/emails.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const emailsCommand = defineCommand({
  description: 'Manage email addresses of the current user',
  since: '3.13.0',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const { format } = options;
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
});
