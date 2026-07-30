import { CreateProfileEmailAddressCommand } from '@clevercloud/client/cc-api-commands/profile/create-profile-email-address-command.js';
import { isCcHttpError } from '@clevercloud/client/utils/error-utils.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';
import { clients } from '../../models/cc-api-client.js';
import { emailArg } from './emails.args.js';

export const emailsAddCommand = defineCommand({
  description: 'Add a new secondary email address to the current user',
  since: '3.13.0',
  options: {},
  args: [emailArg],
  async handler(_options, secondaryAddress) {
    try {
      await clients.ccApi.send(new CreateProfileEmailAddressCommand({ address: secondaryAddress }));
      Logger.printSuccess(
        `The server sent a confirmation email to ${secondaryAddress} to validate your secondary address`,
      );
    } catch (e) {
      if (isCcHttpError(e)) {
        switch (e.code) {
          case 'clever.profile.email-address.already-defined':
            throw new Error('This address already belongs to your account');
          case 'clever.profile.email-address.invalid-format':
            throw new Error('The format of this address is invalid');
          case 'clever.profile.email-address.already-used':
            throw new Error('This address belongs to another account');
        }
      }
      throw e;
    }
  },
});
