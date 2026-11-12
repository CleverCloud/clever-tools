import { addMember } from '@clevercloud/client/esm/api/v2/organisation.js';
import { z } from 'zod';
import { formatDateLocalized, toDate } from '../../lib/date-utils.js';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { memberInviteError } from '../../lib/organisation-errors.js';
import { formatOrganisation, formatOrganisationLabel } from '../../lib/organisation-format.js';
import { assertNotPersonalSpace } from '../../lib/organisation-members.js';
import { Logger } from '../../logger.js';
import { resolveOrganisation } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameArg } from './organisations.args.js';
import { inviteRoleOption } from './organisations.members.options.js';

export const organisationsMembersInviteCommand = defineCommand({
  description: 'Invite someone to join an organisation, by email',
  since: null,
  options: {
    role: inviteRoleOption,
  },
  args: [
    orgaIdOrNameArg,
    defineArgument({
      schema: z.email(),
      description: 'Email address of the person to invite',
      placeholder: 'email',
    }),
  ],
  async handler(options, orgaIdOrName, email) {
    const { role } = options;

    const organisation = await resolveOrganisation(orgaIdOrName);
    assertNotPersonalSpace(organisation);
    const orgaLabel = formatOrganisationLabel(organisation);

    const invitation = await addMember({ id: organisation.id }, { email, role })
      .then(sendToApi)
      .catch((error) => {
        throw memberInviteError(error, { email, role, orgaLabel });
      });

    Logger.printSuccess(`Invitation sent to ${email} as ${role} in ${formatOrganisation(organisation)}`);
    // The body of the response is not documented: only trust a string expiresAt
    const expiresAt = typeof invitation?.expiresAt === 'string' ? toDate(invitation.expiresAt) : undefined;
    if (expiresAt != null) {
      Logger.println(`  Expires: ${formatDateLocalized(expiresAt)}`);
    }
  },
});
