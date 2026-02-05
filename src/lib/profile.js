/**
 * @typedef {import('../config/config.js').Profile} Profile
 */

/**
 * Formats a profile for display.
 * @param {Profile} profile
 * @returns {string}
 */
export function formatProfile(profile) {
  return [
    profile.alias,
    // Legacy profiles don't have the email
    profile.email != null ? `(${profile.email})` : null,
  ]
    .filter(Boolean)
    .join(' ');
}
