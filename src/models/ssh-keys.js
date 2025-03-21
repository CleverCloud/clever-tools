import { sendToApi } from '../models/send-to-api.js';
import { getSshKeys, addSshKey, removeSshKey } from './ssh-keys-api.js';

/**
 * Get the SSH keys of the current user sorted by name
 * @returns {Promise<object[]>} The SSH keys of the current user
 */
export async function getKeys () {
  return (await getSshKeys({})
    .then(sendToApi))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Add a new SSH key to the current user
 * @param {string} keyName The name of the SSH key
 * @param {string} pubKeyContent The content of the SSH key
 * @returns {Promise<object>} The added SSH key
 */
export function addKey (keyName, pubKeyContent) {
  return addSshKey({ key: encodeURIComponent(keyName) }, `"${pubKeyContent}"`).then(sendToApi);
}

/**
 * Remove a SSH key from the current user
 * @param {string} keyName The name of the SSH key
 * @returns {Promise<object>} The removed SSH key
 */
export async function removeKey (keyName) {
  return await removeSshKey({ key: encodeURIComponent(keyName) }).then(sendToApi);
}
