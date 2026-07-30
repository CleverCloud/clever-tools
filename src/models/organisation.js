import { GetOrganisationSummariesCommand } from '@clevercloud/client/cc-api-commands/organisation/get-organisation-summaries-command.js';
import { clients } from './cc-api-client.js';

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
  const summaries = await clients.ccApi.send(new GetOrganisationSummariesCommand());
  const filteredOrgs = summaries.filter((summary) => !summary.isPersonal && summary.name === name);

  if (filteredOrgs.length === 0) {
    throw new Error('Organisation not found');
  }
  if (filteredOrgs.length > 1) {
    throw new Error('Ambiguous organisation name');
  }

  return filteredOrgs[0];
}
