import { todo_addEmailAddress as addEmailAddress } from '@clevercloud/client/esm/api/v2/user.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { sendToApi } from '../../models/send-to-api.js';
import { emailArg } from './emails.args.js';

export const emailsAddCommand = defineCommand({
  description: 'Add a new secondary email address to the current user',
  since: '3.13.0',
  options: {},
  args: [emailArg],
  async handler(_options, secondaryAddress) {
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
  },
});
