// Inspirations:
// https://github.com/sindresorhus/p-defer/blob/master/index.js
// https://github.com/ljharb/promise-deferred/blob/master/index.js

import * as User from '../models/user.js';
import * as Organisation from '../models/organisation.js';

// When you mix async/await APIs with event emitters callbacks, it's hard to keep a proper error flow without a good old deferred.
export class Deferred {

  constructor () {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export function truncateWithEllipsis (length, string) {
  if (string.length > length - 1) {
    return string.substring(0, length - 1) + '…';
  }
  return string;
}

/**
 * Get the owner ID from an Organisation ID or name
 * @param {object} orgaIdOrName The Organisation ID or name
 * @returns {Promise<string>} The owner ID
 */
export async function getOwnerIdFromOrgaIdOrName (orgaIdOrName) {
  return orgaIdOrName != null
    ? Organisation.getId(orgaIdOrName)
    : User.getCurrentId();
}
