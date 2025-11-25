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

export const emailsPrimaryCommand = {
  name: 'primary',
  description: 'Set the primary email address of the current user',
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
    const [newPrimaryAddress] = params.args;
    
      const addresses = await getUserEmailAddresses();
    
      if (addresses.primary === newPrimaryAddress) {
        throw new Error('This address is already the primary one');
      }
    
      if (!addresses.secondary.includes(newPrimaryAddress)) {
        throw new Error('This address must be added as a secondary address before marking it as primary');
      }
    
      const newPrimaryEmailEncoded = encodeURIComponent(newPrimaryAddress);
      await addEmailAddress({ email: newPrimaryEmailEncoded }, { make_primary: true }).then(sendToApi);
    
      Logger.printSuccess(`Primary address updated to ${newPrimaryAddress} successfully`);
  }
};
