import {
  ListProfileEmailAddressCommand
} from '@clevercloud/client/cc-api-commands/profile/list-profile-email-address-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { getApiClient } from '../../lib/new-client.ts';
import * as logger from '../../logger.js';

export const emailsCommand = defineCommand({
  description: 'Manage email addresses of the current user',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [],
  async handler(options) {
    const client = await getApiClient();

    const emailAddresses = await client.send(new ListProfileEmailAddressCommand());
    const addresses = {
      primary: emailAddresses.primaryAddress.address,
      secondary: emailAddresses.secondaryAddresses.map((e) => e.address),
    };

    switch (options.format) {
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
