import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import _ from 'lodash';
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
  const filteredOrgs = _.filter(fullSummary.organisations, { name });

  if (filteredOrgs.length === 0) {
    throw new Error('Organisation not found');
  }
  if (filteredOrgs.length > 1) {
    throw new Error('Ambiguous organisation name');
  }

  return filteredOrgs[0];
}

/**
 * List the owners the current user belongs to, sorted by name.
 * The personal space is one of them, `/v2/summary` returns it among the organisations.
 * When an ID or a name is given, only the matching owner is returned.
 * @param {{ orga_id: String }|{ orga_name: String }|null} orgaIdOrName
 * @returns {Promise<Array<Object>>} the raw summary owners, with their applications and add-ons
 */
export async function listOwners(orgaIdOrName) {
  const summary = await getSummary({}).then(sendToApi);

  // A name has to be resolved against the summary we just fetched, an ID is only filtered on
  if (orgaIdOrName?.orga_name != null) {
    const matchingOwners = _.filter(summary.organisations, { name: orgaIdOrName.orga_name });

    if (matchingOwners.length === 0) {
      throw new Error('Organisation not found');
    }
    if (matchingOwners.length > 1) {
      throw new Error('Ambiguous organisation name');
    }

    return matchingOwners;
  }

  return (
    summary.organisations
      // If owner ID is present, only keep the matching org
      .filter((org) => orgaIdOrName == null || org.id === orgaIdOrName.orga_id)
      .sort((a, b) => a.name.localeCompare(b.name))
  );
}
