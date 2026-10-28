import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
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
