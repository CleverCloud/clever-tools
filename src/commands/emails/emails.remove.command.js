import { todo_removeEmailAddress as removeEmailAddress } from '@clevercloud/client/esm/api/v2/user.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getUserEmailAddresses } from '../../models/emails.js';
import { sendToApi } from '../../models/send-to-api.js';
import { emailArg } from './emails.args.js';

export const emailsRemoveCommand = defineCommand({
  description: 'Remove a secondary email address from the current user',
  since: '3.13.0',
  options: {},
  args: [emailArg],
  async handler(_options, addressToRemove) {
    const addresses = await getUserEmailAddresses();

    if (!addresses.secondary.includes(addressToRemove)) {
      throw new Error("This address is not part of the secondary addresses of the current user, it can't be removed");
    }

    const addressToRemoveEncoded = encodeURIComponent(addressToRemove);
    await removeEmailAddress({ email: addressToRemoveEncoded }).then(sendToApi);

    Logger.printSuccess(`Secondary address ${addressToRemove} removed successfully`);
  },
});
