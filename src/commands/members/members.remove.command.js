import { removeMemeber as removeMember } from '@clevercloud/client/esm/api/v2/organisation.js';
import { defineCommand } from '../../lib/define-command.js';
import { memberRemoveError } from '../../lib/organisation-errors.js';
import { formatOrganisation, formatOrganisationLabel } from '../../lib/organisation-format.js';
import { assertNotPersonalSpace, fetchMembersIfReadable, resolveMember } from '../../lib/organisation-members.js';
import { assertInteractiveTerminal, confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { isSameId, resolveOrganisationAndUser } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import { orgaIdOrNameArg } from '../global.args.js';
import { skipConfirmationOption } from '../global.options.js';
import { memberIdOrEmailArg } from './members.args.js';

export const membersRemoveCommand = defineCommand({
  description: 'Remove a member from an organisation',
  since: null,
  options: {
    skipConfirmation: skipConfirmationOption,
  },
  args: [orgaIdOrNameArg, memberIdOrEmailArg],
  async handler(options, orgaIdOrName, memberIdOrEmail) {
    const { skipConfirmation } = options;

    const { organisation, currentUserId } = await resolveOrganisationAndUser(orgaIdOrName);
    assertNotPersonalSpace(organisation);
    const orgaLabel = formatOrganisationLabel(organisation);
    // The member list can be unreadable: a member given by ID is removed anyway
    const members = await fetchMembersIfReadable(organisation.id, currentUserId);
    const member = resolveMember(members, memberIdOrEmail, orgaLabel);
    const userId = member?.id ?? memberIdOrEmail;
    const memberLabel = member?.email ?? memberIdOrEmail;
    const isLeaving = isSameId(userId, currentUserId);

    if (!skipConfirmation) {
      assertInteractiveTerminal('Use --yes to skip the confirmation.');
      const memberWithId = member != null ? `${member.email} ${styleText('grey', `(${member.id})`)}` : userId;
      const message = isLeaving
        ? `Leave ${formatOrganisation(organisation)}? You will lose access to the organisation.`
        : `Remove ${memberWithId} from ${formatOrganisation(organisation)}?`;
      await confirm(message, 'Aborted, nothing was removed', false);
    }

    await removeMember({ id: organisation.id, userId })
      .then(sendToApi)
      .catch((error) => {
        throw memberRemoveError(error, { memberLabel, orgaLabel });
      });

    if (isLeaving) {
      Logger.printSuccess(`You left ${formatOrganisation(organisation)}`);
    } else {
      Logger.printSuccess(`Member ${memberLabel} removed from ${formatOrganisation(organisation)}`);
    }
  },
});
