import { updateMember } from '@clevercloud/client/esm/api/v2/organisation.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { memberUpdateError } from '../../lib/organisation-errors.js';
import { formatOrganisation, formatOrganisationLabel } from '../../lib/organisation-format.js';
import { assertNotPersonalSpace, fetchMembersIfReadable, resolveMember } from '../../lib/organisation-members.js';
import { Logger } from '../../logger.js';
import { resolveOrganisation } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameArg } from '../global.args.js';
import { memberIdOrEmailArg } from './members.args.js';
import { ROLES_LIST, roleSchema } from './members.options.js';

export const membersUpdateCommand = defineCommand({
  description: 'Update the role of a member of an organisation',
  since: '5.5.0',
  options: {
    role: defineOption({
      name: 'role',
      schema: roleSchema,
      description: `New role of the member (${ROLES_LIST})`,
      placeholder: 'role',
    }),
  },
  args: [orgaIdOrNameArg, memberIdOrEmailArg],
  async handler(options, orgaIdOrName, memberIdOrEmail) {
    const { role } = options;

    const organisation = await resolveOrganisation(orgaIdOrName);
    assertNotPersonalSpace(organisation);
    const orgaLabel = formatOrganisationLabel(organisation);
    // The member list gives the previous role, it can be unreadable: a member given by ID is updated anyway
    const members = await fetchMembersIfReadable(organisation.id, null);
    const member = resolveMember(members, memberIdOrEmail, orgaLabel);
    const userId = member?.id ?? memberIdOrEmail;
    const memberLabel = member?.email ?? memberIdOrEmail;

    if (member?.role === role) {
      Logger.println(`Member ${memberLabel} already has the role ${role} in ${formatOrganisation(organisation)}`);
      return;
    }

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
