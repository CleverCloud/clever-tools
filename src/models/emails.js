import { todo_getEmailAddresses as getEmailAddresses } from '@clevercloud/client/esm/api/v2/user.js';
import { sendToApi } from './send-to-api.js';
import * as User from './user.js';

/**
 * Get the primary and secondary email addresses of the current user
 * @returns {Promise<{ primary: string, secondary: string[] }>} The primary and secondary email addresses of the current user
 */
export async function getUserEmailAddresses() {
  const currentUser = await User.getCurrent();
  const secondaryAddresses = await getEmailAddresses().then(sendToApi);
  return {
    primary: currentUser.email,
    secondary: secondaryAddresses.sort(),
  };
}
