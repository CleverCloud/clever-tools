import { getAllMembers } from '@clevercloud/client/esm/api/v2/organisation.js';
import { isSameId } from '../models/organisation.js';
import { sendToApi } from '../models/send-to-api.js';
import { userIdRegex } from '../parsers.js';

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
 * @returns {Promise<Array<OrganisationMember>>}
 */
export async function fetchMembers(orgaId, currentUserId) {
  const rawMembers = await getAllMembers({ id: orgaId }).then(sendToApi);
  return toMembers(rawMembers, currentUserId);
}

/**
 * Fetch the members of an organisation like `fetchMembers()`, or `null` when the API refuses the member list (403:
 * role without the right, or a partner organisation that hides its members).
 * @param {string} orgaId
 * @param {string | null} currentUserId - ID of the current user, `null` when the caller does not need `isCurrentUser`
 * @returns {Promise<Array<OrganisationMember> | null>}
 */
export async function fetchMembersIfReadable(orgaId, currentUserId) {
  try {
    return await fetchMembers(orgaId, currentUserId);
  } catch (error) {
    if (error?.response?.status === 403) {
      return null;
    }
    throw error;
  }
}

/**
 * Sort members for display: the current user first, then by email.
 * @param {Array<OrganisationMember>} members
 * @returns {Array<OrganisationMember>}
 */
export function sortMembers(members) {
  return members.toSorted((a, b) => {
    if (a.isCurrentUser !== b.isCurrentUser) {
      return a.isCurrentUser ? -1 : 1;
    }
    return a.email.localeCompare(b.email);
  });
}

/**
 * Find a member by its ID or its email, both case insensitive.
 * @param {Array<OrganisationMember> | null} members - `null` when the member list is not readable
 * @param {string} memberIdOrEmail - `user_...` ID or email
 * @param {string} orgaName
 * @returns {OrganisationMember | null} `null` when the list is not readable and the member is given by ID
 * @throws {Error} If no member matches, or if an email cannot be resolved because the list is not readable
 */
export function resolveMember(members, memberIdOrEmail, orgaName) {
  const isId = userIdRegex.test(memberIdOrEmail);
  if (members == null) {
    if (isId) {
      return null;
    }
    throw new Error('Cannot resolve an email, the member list is not readable: use the member ID (user_...)');
  }
  const email = memberIdOrEmail.toLowerCase();
  const member = members.find((m) => (isId ? isSameId(m.id, memberIdOrEmail) : m.email.toLowerCase() === email));
  if (member == null) {
    throw new Error(`Member "${memberIdOrEmail}" not found in ${orgaName}`);
  }
  return member;
}
