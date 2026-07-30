import { ListProfileEmailAddressCommand } from '@clevercloud/client/cc-api-commands/profile/list-profile-email-address-command.js';
import { clients } from './cc-api-client.js';

/**
 * Get the primary and secondary email addresses of the current user
 * @returns {Promise<{ primary: string, secondary: string[] }>} The primary and secondary email addresses of the current user
 */
export async function getUserEmailAddresses() {
  const addresses = await clients.ccApi.send(new ListProfileEmailAddressCommand());
  return {
    primary: addresses.primaryAddress.address,
    secondary: addresses.secondaryAddresses.map(({ address }) => address),
  };
}
