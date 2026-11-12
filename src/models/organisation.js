import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { ambiguousNameError } from '../lib/ambiguous-name-error.js';
import { sendToApi } from './send-to-api.js';

export async function getId(orgaIdOrName) {
  if (orgaIdOrName == null) {
    return null;
  }

  if (orgaIdOrName.orga_id != null) {
    return orgaIdOrName.orga_id;
  }

  return getByName(orgaIdOrName.orga_name).then((orga) => orga.id);
}

async function getByName(name) {
  const fullSummary = await getSummary({}).then(sendToApi);
  return filterOwners(fullSummary.organisations, { orga_name: name })[0];
}

/**
 * Keep the owners of a `/v2/summary` matching an organisation ID or name, sorted by name.
 * Every owner is kept when `orgaIdOrName` is null, an ID matching no owner keeps none.
 * @param {Array<Object>} owners - The `organisations` of a `/v2/summary`
 * @param {{ orga_id: string } | { orga_name: string } | null} orgaIdOrName
 * @throws {Error} If a name matches no owner or several owners
 * @returns {Array<Object>}
 */
export function filterOwners(owners, orgaIdOrName) {
  if (orgaIdOrName?.orga_name != null) {
    const matchingOwners = owners.filter((owner) => owner.name === orgaIdOrName.orga_name);

    if (matchingOwners.length === 0) {
      throw new Error('Organisation not found');
    }
    if (matchingOwners.length > 1) {
      throw new Error('Ambiguous organisation name');
    }

    return matchingOwners;
  }

  return owners
    .filter((owner) => orgaIdOrName == null || owner.id === orgaIdOrName.orga_id)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * @typedef {Object} OrganisationSummary
 * @property {string} id - `orga_...` ID, or `user_...` ID for the personal space
 * @property {string} name
 * @property {string} role - Role of the current user on the organisation
 * @property {boolean} isPersonal - Whether the organisation is the personal space of the current user
 */

/**
 * List the organisations of the current user, the personal space included, from `GET /v2/summary`.
 * @returns {Promise<Array<OrganisationSummary>>}
 */
export async function listOrganisations() {
  const { organisations } = await fetchOrganisations();
  return organisations;
}

/**
 * @returns {Promise<{ organisations: Array<OrganisationSummary>, currentUserId: string }>}
 */
async function fetchOrganisations() {
  const summary = await getSummary().then(sendToApi);
  const organisations = summary.organisations.map((organisation) => ({
    id: organisation.id,
    name: organisation.name,
    role: organisation.role,
    isPersonal: organisation.id.startsWith('user_'),
  }));
  return { organisations, currentUserId: summary.user.id };
}

/**
 * Resolve an organisation by its ID or its exact name, among the organisations of the current user.
 * @param {{ orga_id?: string, orga_name?: string }} orgaIdOrName - As parsed by `orgaIdOrName()` (`src/parsers.js`)
 * @returns {Promise<OrganisationSummary>}
 * @throws {Error} If no organisation matches, or if a name matches several organisations
 */
export async function resolveOrganisation(orgaIdOrName) {
  const { organisation } = await resolveOrganisationAndUser(orgaIdOrName);
  return organisation;
}

/**
 * Resolve an organisation like `resolveOrganisation()`, with the ID of the current user, which the same
 * `GET /v2/summary` holds.
 * @param {{ orga_id?: string, orga_name?: string }} orgaIdOrName - As parsed by `orgaIdOrName()` (`src/parsers.js`)
 * @returns {Promise<{ organisation: OrganisationSummary, currentUserId: string }>}
 * @throws {Error} If no organisation matches, or if a name matches several organisations
 */
export async function resolveOrganisationAndUser(orgaIdOrName) {
  const { organisations, currentUserId } = await fetchOrganisations();

  if (orgaIdOrName.orga_id != null) {
    const organisation = organisations.find((o) => isSameId(o.id, orgaIdOrName.orga_id));
    if (organisation == null) {
      throw new Error(`Organisation "${orgaIdOrName.orga_id}" not found`);
    }
    return { organisation, currentUserId };
  }

  const name = orgaIdOrName.orga_name ?? '';
  const matches = organisations.filter((o) => o.name === name);
  if (matches.length === 0) {
    const lowerCaseName = name.toLowerCase();
    const closeMatches = organisations.filter((o) => o.name.toLowerCase() === lowerCaseName);
    const hint =
      closeMatches.length > 0 ? `, did you mean ${closeMatches.map((o) => `"${o.name}"`).join(' or ')}?` : '';
    throw new Error(`Organisation "${name}" not found${hint}`);
  }
  if (matches.length > 1) {
    throw ambiguousNameError(name, matches);
  }
  return { organisation: matches[0], currentUserId };
}

/**
 * Compare two IDs (`orga_...`, `user_...`) case insensitively, as the argument schemas accept them in any case.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function isSameId(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}
