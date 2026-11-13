import { updateMember } from '@clevercloud/client/esm/api/v2/organisation.js';
import { defineCommand } from '../../lib/define-command.js';
import { memberUpdateError } from '../../lib/organisation-errors.js';
import { formatOrganisation, formatOrganisationLabel } from '../../lib/organisation-format.js';
import { assertNotPersonalSpace, fetchMembersIfReadable, resolveMember } from '../../lib/organisation-members.js';
import { Logger } from '../../logger.js';
import { resolveOrganisation } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameArg } from './organisations.args.js';
import { memberIdOrEmailArg } from './organisations.members.args.js';
import { requiredRoleOption } from './organisations.members.options.js';

export const organisationsMembersUpdateCommand = defineCommand({
  description: 'Update the role of a member of an organisation',
  since: null,
  options: {
    role: requiredRoleOption,
  },
  args: [orgaIdOrNameArg, memberIdOrEmailArg],
  async handler(options, orgaIdOrName, memberIdOrEmail) {
    const { role } = options;

    const organisation = await resolveOrganisation(orgaIdOrName);
    assertNotPersonalSpace(organisation);
    const orgaLabel = formatOrganisationLabel(organisation);
    // The member list gives the previous role, it can be unreadable: a member given by ID is updated anyway
    const members = await fetchMembersIfReadable(organisation.id, null);
    const member = resolveMember(members, memberIdOrEmail, organisation.name);
    const userId = member?.id ?? memberIdOrEmail;
    const memberLabel = member?.email ?? memberIdOrEmail;

    // Only the role is sent: a missing job keeps the current one
    await updateMember({ id: organisation.id, userId }, { role })
      .then(sendToApi)
      .catch((error) => {
        throw memberUpdateError(error, { memberLabel, role, orgaLabel });
      });

    Logger.printSuccess(`Member ${memberLabel} updated in ${formatOrganisation(organisation)}`);
    Logger.println(`  Role:  ${member != null ? `${member.role} → ${role}` : role}`);
  },
});
