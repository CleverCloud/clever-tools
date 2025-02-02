import * as User from '../models/user.js';
import { sendToApi } from './send-to-api.js';
import { addEmailAddress, getEmailAddresses, removeEmailAddress } from './emails-api.js';

/**
 * Get the primary and secondary emails of the current user
 * @returns {Promise<{ primary: string, secondary: string[] }>} The primary and secondary emails of the current user
 */
export async function getUserEmails () {
  const primaryEmail = (await User.getCurrent()).email;
  const secondaryEmails = (await getEmailAddresses({})
    .then(sendToApi))
    .sort();

  return { primary: primaryEmail, secondary: secondaryEmails };
}

/**
 * Add a new secondary email to the current user
 * @param {string} email The email address
 * @returns {Promise<object>} The response of the API call
 */
export async function addSecondaryEmail (email) {

  const emails = await getUserEmails();

  if (emails.secondary.includes(email) || emails.primary === email) {
    throw new Error('This email address is already associated with the current user');
  }

  const encoded = encodeURIComponent(email);
  return addEmailAddress({ email: encoded }).then(sendToApi);
}

/**
 * Remove a secondary email from the current user
 * @param {string} email The email address
 * @returns {Promise<object>} The response of the API call
 */
export async function removeSecondaryEmail (email) {

  const emails = await getUserEmails();

  if (emails.secondary.length === 0) {
    throw new Error('No secondary email address to remove');
  }

  if (!emails.secondary.includes(email)) {
    throw new Error('This is not a secondary email address of the current user, it can\'t be removed');
  }

  const encoded = encodeURIComponent(email);
  return removeEmailAddress({ email: encoded }).then(sendToApi);
}

/**
 * Set the primary email of the current user
 * @param {string} email The email address
 * @returns {Promise<object>} The response of the API call
 */
export async function setPrimaryEmail (email) {

  const emails = await getUserEmails();

  if (emails.primary === email) {
    throw new Error('This email address is already the primary one');
  }

  const encoded = encodeURIComponent(email);
  return addEmailAddress({ email: encoded }, { make_primary: true }).then(sendToApi);
}
