import { DeleteProfileEmailAddressCommand } from '@clevercloud/client/cc-api-commands/profile/delete-profile-email-address-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getUserEmailAddresses } from '../../models/emails.js';
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

    await clients.ccApi.send(new DeleteProfileEmailAddressCommand({ address: addressToRemove }));

    Logger.printSuccess(`Secondary address ${addressToRemove} removed successfully`);
  },
});
