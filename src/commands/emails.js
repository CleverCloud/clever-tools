import colors from 'colors/safe.js';

import { Logger } from '../logger.js';
import { confirm } from '../models/interact.js';
import { executeCommand, openBrowser } from '../models/utils.js';
import { getUserEmails, addSecondaryEmail, setPrimaryEmail, removeSecondaryEmail } from '../models/emails.js';

/**
 * Show primary and secondary emails of the current user
 * @param {object} params The command parameters
 * @param {string} params.options.format The output format
 */
export async function list (params) {
  const { format } = params.options;
  const emails = await getUserEmails();

  switch (format) {
    case 'json': {
      Logger.printJson(emails);
      break;
    }
    case 'human':
    default: {
      printEmails(emails);
    }
  }
}

/**
 * Add a secondary email to the current user
 * @param {object} params The command parameters
 * @param {string} params.namedArgs.email The email to add
 */
export function addSecondary (params) {
  return executeCommand(addSecondaryEmail, [params.namedArgs.email]);
}

/**
 * Set the primary email of the current user
 * @param {object} params The command parameters
 * @param {string} params.namedArgs.email The email to set as primary
 * @returns {Promise<object>} The response's message of the API call
 */
export function setPrimary (params) {
  return executeCommand(setPrimaryEmail, [params.namedArgs.email]);
}

/**
 * Remove a secondary email from the current user
 * @param {object} params The command parameters
 * @param {string} params.namedArgs.email The email to remove
 * @returns {Promise<object>} The response's message of the API call
 */
export function removeSecondary (params) {
  return executeCommand(removeSecondaryEmail, [params.namedArgs.email]);
}

/**
 * Remove all secondary emails from the current user
 * @param {object} params The command parameters
 * @param {string} params.options.yes The user confirmation
 */
export async function clearSecondary (params) {
  const emails = await getUserEmails();

  if (!emails.length) {
    Logger.println('No secondary emails to remove');
    return;
  }

  if (!params.options.yes) {
    await confirm(
      'Are you sure you want to remove all your secondary emails? (y/n) ',
      'No secondary emails removed',
    );
  }

  await Promise.all(emails.map(removeSecondaryEmail));
  Logger.println('All secondary emails removed');
}

/**
 * Print the emails of the current user in human-readable format
 * @param {object} emails The primary and secondary emails of the current user
 * @param {string} emails.primary The primary email of the current user
 * @param {string[]} emails.secondary The secondary emails of the current user
 */
function printEmails (emails) {
  Logger.println('📧 Primary:');
  Logger.println(` ▶ ${colors.green(emails.primary)}`);

  if (emails.secondary.length > 0) {
    Logger.println();
    Logger.println(`📧 Secondary (${emails.secondary.length}):`);
    emails.secondary.forEach((email) =>
      Logger.println(` ▷ ${colors.blue(email)}`),
    );
  }
}

/**
 * Open the emails management page of the Console in your browser
 * @returns {Promise<void>} A promise that resolves when the page is opened
 */
export async function openConsole () {
  openBrowser('https://console.clever-cloud.com/users/me/emails', 'Opening the emails management page in your browser');
}
