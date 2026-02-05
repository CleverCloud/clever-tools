import { get as getUser } from '@clevercloud/client/esm/api/v2/organisation.js';
import { getCurrentTokenInfo } from '@clevercloud/client/esm/api/v2/self.js';
import { sendToApiWithConfig } from '../models/send-to-api.js';
import { formatDateLocalized, toDate } from './date-utils.js';
import { styleText } from './style-text.js';

/**
 * @typedef {import('../config/config.js').Profile} Profile
 */

/**
 * @typedef {object} ProfileDetails
 * @property {string} alias
 * @property {string} email
 * @property {string | null | undefined} name
 * @property {string} [id]
 * @property {Date} [tokenExpiration]
 * @property {boolean} has2FA
 * @property {string} [avatar]
 * @property {Date} [creationDate]
 * @property {string} [lang]
 * @property {boolean} isProfileActive
 * @property {boolean} isTokenValid
 */

/**
 * Formats a profile for display.
 * @param {Profile | ProfileDetails} profile
 * @returns {string}
 */
export function formatProfile(profile) {
  return [
    profile.alias,
    profile.email != null ? `(${profile.email})` : null,
    profile.isProfileActive ? styleText('green', '[active]') : null,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Fetch full profile details using the profile's credentials.
 * @param {object} params
 * @param {Profile} params.profile
 * @param {boolean} params.isActive
 * @returns {Promise<ProfileDetails>}
 */
export async function getProfileDetails({ profile, isActive }) {
  const oauthData = { token: profile.token, secret: profile.secret };
  const sendWithCredentials = sendToApiWithConfig(oauthData);

  const [user, token] = await Promise.all([
    getUser({}).then(sendWithCredentials),
    getCurrentTokenInfo().then(sendWithCredentials),
  ]).catch(() => [null, null]);

  return {
    id: user?.id ?? profile.userId,
    email: user?.email ?? profile.email,
    name: user?.name,
    avatar: user?.avatar,
    creationDate: toDate(user?.creationDate),
    tokenExpiration: toDate(token?.expirationDate ?? profile.expirationDate),
    lang: user?.lang,
    has2FA: user != null ? user.preferredMFA != null && user.preferredMFA !== 'NONE' : undefined,
    alias: profile.alias,
    isProfileActive: isActive,
    isTokenValid: user != null,
  };
}

/**
 * Formats profile details for CLI display.
 * @param {ProfileDetails} profile
 */
export function formatProfileDetails(profile) {
  const lines = [];

  lines.push(styleText('bold', formatProfile(profile)));
  lines.push(profile.id);

  if (!profile.isTokenValid) {
    lines.push(styleText('red', 'Invalid or expired token'));
    return lines.map((line, index) => (index === 0 ? line : `  ${line}`)).join('\n');
  }

  lines.push(profile.name ? profile.name : '[unknown]');

  const expiresAtFormatted = formatDateLocalized(profile.tokenExpiration);
  if (expiresAtFormatted) {
    lines.push(`Expires on ${styleText('gray', expiresAtFormatted)}`);
  }

  lines.push(`2FA ${profile.has2FA ? styleText('green', 'enabled ✓') : styleText('red', 'disabled ✗')}`);

  return lines
    .map((line, index) => {
      return index === 0 ? line : `  ${line}`;
    })
    .join('\n');
}
