import { todo_addEmailAddress as addEmailAddress } from '@clevercloud/client/esm/api/v2/user.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { getUserEmailAddresses } from '../../models/emails.js';
import { sendToApi } from '../../models/send-to-api.js';
import { emailArg } from './emails.args.js';

export const emailsPrimaryCommand = defineCommand({
  description: 'Set the primary email address of the current user',
  since: '3.13.0',
  options: {},
  args: [emailArg],
  async handler(_options, newPrimaryAddress) {
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
  },
});
