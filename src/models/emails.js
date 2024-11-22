import * as User from '../models/user.js';
import { sendToApi } from '../models/send-to-api.js';
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
export function addSecondaryEmail (email) {
  const encoded = encodeURIComponent(email);
  return addEmailAddress({ email: encoded }).then(sendToApi);
}

/**
 * Remove a secondary email from the current user
 * @param {string} email The email address
 * @returns {Promise<object>} The response of the API call
 */
export function removeSecondaryEmail (email) {
  const encoded = encodeURIComponent(email);
  return removeEmailAddress({ email: encoded }).then(sendToApi);
}

/**
 * Set the primary email of the current user
 * @param {string} email The email address
 * @returns {Promise<object>} The response of the API call
 */
export function setPrimaryEmail (email) {
  const encoded = encodeURIComponent(email);
  return addEmailAddress({ email: encoded }, { make_primary: true }).then(sendToApi);
}
