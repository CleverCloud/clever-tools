import { getAllMembers } from '@clevercloud/client/esm/api/v2/organisation.js';
import { sendToApi } from '../models/send-to-api.js';

/**
 * @typedef {Object} OrganisationMember
 * @property {string} id - `user_...` ID
 * @property {string} email
 * @property {string | null} name
 * @property {string} role - `ADMIN`, `MANAGER`, `DEVELOPER` or `ACCOUNTING`
 * @property {string | null} mfa - Raw `preferredMFA` of the member
 * @property {boolean} isMfaEnabled - Whether 2FA is enabled (`preferredMFA` is `TOTP`, same rule as the console)
 * @property {boolean} isCurrentUser
 */

/**
 * Normalise the raw members of `GET /v2/organisations/{id}/members`. This is the only place that reads the raw shape
 * of a member. Members with the role `NONE` are dropped.
 * @param {Array<any>} rawMembers
 * @param {string | null} currentUserId - ID of the current user, `null` when the caller does not need `isCurrentUser`
 * @returns {Array<OrganisationMember>}
 */
export function toMembers(rawMembers, currentUserId) {
  return rawMembers
    .filter((rawMember) => rawMember.role !== 'NONE')
    .map((rawMember) => {
      const mfa = rawMember.member.preferredMFA ?? null;
      return {
        id: rawMember.member.id,
        email: rawMember.member.email,
        name: rawMember.member.name ?? null,
        role: rawMember.role,
        mfa,
        isMfaEnabled: mfa === 'TOTP',
        isCurrentUser: rawMember.member.id === currentUserId,
      };
    });
}

/**
 * Fetch the members of an organisation, normalised (see `toMembers()`).
 * @param {string} orgaId
 * @param {string | null} currentUserId - ID of the current user, `null` when the caller does not need `isCurrentUser`
 * @returns {Promise<Array<OrganisationMember> | null>} `null` when the API refuses the member list (403)
 */
export async function fetchMembers(orgaId, currentUserId) {
  try {
    const rawMembers = await getAllMembers({ id: orgaId }).then(sendToApi);
    return toMembers(rawMembers, currentUserId);
  } catch (error) {
    if (error?.response?.status === 403) {
      return null;
    }
    throw error;
  }
}
