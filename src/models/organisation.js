import _ from 'lodash';

import { getSummary } from '@clevercloud/client/esm/api/v2/user.js';
import { sendToApi } from "./send-to-api.js";

export async function getId (orgaIdOrName) {
  if (orgaIdOrName == null) {
    return null;
  }

  if (orgaIdOrName.orga_id != null) {
    return orgaIdOrName.orga_id;
  }

  return getByName(orgaIdOrName.orga_name)
    .then((orga) => orga.id);
}

async function getByName (name) {

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
