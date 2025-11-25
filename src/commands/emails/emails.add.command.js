import { emailArg } from './emails.args.js';
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

export const emailsAddCommand = {
  name: 'add',
  description: 'Add a new secondary email address to the current user',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [
    emailArg,
  ],
  async execute(params) {
    const [secondaryAddress] = params.args;
    
      const secondaryAddressEncoded = encodeURIComponent(secondaryAddress);
      try {
        await addEmailAddress({ email: secondaryAddressEncoded }).then(sendToApi);
        Logger.printSuccess(
          `The server sent a confirmation email to ${secondaryAddress} to validate your secondary address`,
        );
      } catch (e) {
        switch (e?.responseBody?.id) {
          case 101:
            throw new Error('This address already belongs to your account');
          case 550:
            throw new Error('The format of this address is invalid');
          case 1004:
            throw new Error('This address belongs to another account');
          default:
            throw e;
        }
      }
  }
};
