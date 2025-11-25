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

export const emailsRemoveCommand = {
  name: 'remove',
  description: 'Remove a secondary email address from the current user',
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
    const [addressToRemove] = params.args;
    
      const addresses = await getUserEmailAddresses();
    
      if (!addresses.secondary.includes(addressToRemove)) {
        throw new Error("This address is not part of the secondary addresses of the current user, it can't be removed");
      }
    
      const addressToRemoveEncoded = encodeURIComponent(addressToRemove);
      await removeEmailAddress({ email: addressToRemoveEncoded }).then(sendToApi);
    
      Logger.printSuccess(`Secondary address ${addressToRemove} removed successfully`);
  }
};
