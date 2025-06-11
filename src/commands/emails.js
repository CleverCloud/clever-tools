import { styleText } from 'node:util';
import * as User from '../models/user.js';
import { Logger } from '../logger.js';
import { openBrowser } from '../models/utils.js';
import { sendToApi } from '../models/send-to-api.js';
import { confirm } from '../lib/prompts.js';
import {
  todo_addEmailAddress as addEmailAddress,
  todo_getEmailAddresses as getEmailAddresses,
  todo_removeEmailAddress as removeEmailAddress,
} from '@clevercloud/client/esm/api/v2/user.js';

/**
 * Show primary and secondary email addresses of the current user
 * @param {object} params The command parameters
 * @param {string} params.options.format The output format
 */
export async function list (params) {
  const { format } = params.options;
  const addresses = await getUserEmailAddresses();

  switch (format) {
    case 'json': {
      Logger.printJson(addresses);
      break;
    }
    case 'human':
    default: {
      Logger.println('✉️  Primary email address:');
      Logger.println(` • ${styleText('green', addresses.primary)}`);
      if (addresses.secondary.length > 0) {
        Logger.println();
        Logger.println(`✉️  ${addresses.secondary.length} secondary email address(es):`);
        addresses.secondary.forEach((address) =>
          Logger.println(` • ${styleText('blue', address)}`),
        );
      }
    }
  }
}

/**
 * Add a secondary email address to the current user
 * @param {object} params The command parameters
 * @param {Array<string>} params.args
 */
export async function addSecondary (params) {
  const [secondaryAddress] = params.args;

  const secondaryAddressEncoded = encodeURIComponent(secondaryAddress);
  try {
    await addEmailAddress({ email: secondaryAddressEncoded }).then(sendToApi);
    Logger.printSuccess(`The server sent a confirmation email to ${secondaryAddress} to validate your secondary address`);
  }
  catch (e) {
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
}

/**
 * Set the primary email address of the current user
 * @param {object} params The command parameters
 * @param {Array<string>} params.args
 */
export async function setPrimary (params) {
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

/**
 * Remove a secondary email address from the current user
 * @param {object} params The command parameters
 * @param {Array<string>} params.args
 */
export async function removeSecondary (params) {
  const [addressToRemove] = params.args;

  const addresses = await getUserEmailAddresses();

  if (!addresses.secondary.includes(addressToRemove)) {
    throw new Error('This address is not part of the secondary addresses of the current user, it can\'t be removed');
  }

  const addressToRemoveEncoded = encodeURIComponent(addressToRemove);
  await removeEmailAddress({ email: addressToRemoveEncoded }).then(sendToApi);

  Logger.printSuccess(`Secondary address ${addressToRemove} removed successfully`);
}

/**
 * Remove all secondary email addresses from the current user
 * @param {object} params The command parameters
 * @param {object} params.options The command options
 * @param {boolean} params.options.yes The user confirmation
 */
export async function removeAllSecondary (params) {
  if (!params.options.yes) {
    await confirm(
      'Are you sure you want to remove all your secondary addresses?',
      'No secondary addresses removed',
    );
  }

  const addresses = await getUserEmailAddresses();

  if (addresses.secondary.length === 0) {
    Logger.println('No secondary address to remove');
    return;
  }

  const results = await Promise.all(
    addresses.secondary.map((addressToRemove) => {
      const addressToRemoveEncoded = encodeURIComponent(addressToRemove);
      return removeEmailAddress({ email: addressToRemoveEncoded }).then(sendToApi)
        .then(() => [true, addressToRemove])
        .catch(() => [false, addressToRemove]);
    }),
  );

  if (results.every(([isRemoved]) => isRemoved)) {
    Logger.printSuccess('All secondary addresses were removed successfully');
  }
  else {
    const addressesWithErrors = results
      .filter(([isRemoved]) => !isRemoved)
      .map(([_, address]) => address)
      .join(', ');
    throw new Error(`Some errors occured while removing these addresses: ${addressesWithErrors}`);
  }
}

/**
 * Open the email addresses management page of the Console in your browser
 * @returns {Promise<void>} A promise that resolves when the page is opened
 */
export function openConsole () {
  return openBrowser('/users/me/emails', 'Opening the email addresses management page of the Console in your browser');
}

/**
 * Get the primary and secondary email addresses of the current user
 * @returns {Promise<{ primary: string, secondary: string[] }>} The primary and secondary email addresses of the current user
 */
async function getUserEmailAddresses () {
  const currentUser = await User.getCurrent();
  const secondaryAddresses = await getEmailAddresses().then(sendToApi);
  return {
    primary: currentUser.email,
    secondary: secondaryAddresses.sort(),
  };
}
