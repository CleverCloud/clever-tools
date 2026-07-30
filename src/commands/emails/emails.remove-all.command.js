import { DeleteProfileEmailAddressCommand } from '@clevercloud/client/cc-api-commands/profile/delete-profile-email-address-command.js';
import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { confirm } from '../../lib/prompts.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { getUserEmailAddresses } from '../../models/emails.js';

export const emailsRemoveAllCommand = defineCommand({
  description: 'Remove all secondary email addresses from the current user',
  since: '3.13.0',
  options: {
    yes: defineOption({
      name: 'yes',
      schema: z.boolean().default(false),
      description: 'Skip confirmation',
      aliases: ['y'],
    }),
  },
  args: [],
  async handler(options) {
    if (!options.yes) {
      await confirm('Are you sure you want to remove all your secondary addresses?', 'No secondary addresses removed');
    }

    const addresses = await getUserEmailAddresses();

    if (addresses.secondary.length === 0) {
      Logger.println('No secondary address to remove');
      return;
    }

    const results = await Promise.all(
      addresses.secondary.map((addressToRemove) => {
        return clients.ccApi
          .send(new DeleteProfileEmailAddressCommand({ address: addressToRemove }))
          .then(() => [true, addressToRemove])
          .catch(() => [false, addressToRemove]);
      }),
    );

    if (results.every(([isRemoved]) => isRemoved)) {
      Logger.printSuccess('All secondary addresses were removed successfully');
    } else {
      const addressesWithErrors = results
        .filter(([isRemoved]) => !isRemoved)
        .map(([_, address]) => address)
        .join(', ');
      throw new Error(`Some errors occured while removing these addresses: ${addressesWithErrors}`);
    }
  },
});
