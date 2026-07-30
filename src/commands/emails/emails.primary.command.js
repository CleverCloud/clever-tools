import { SetProfilePrimaryEmailAddressCommand } from '@clevercloud/client/cc-api-commands/profile/set-profile-primary-email-address-command.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getUserEmailAddresses } from '../../models/emails.js';
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

    await clients.ccApi.send(new SetProfilePrimaryEmailAddressCommand({ address: newPrimaryAddress }));

    Logger.printSuccess(`Primary address updated to ${newPrimaryAddress} successfully`);
  },
});
