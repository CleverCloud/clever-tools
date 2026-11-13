import { removeMemeber as removeMember } from '@clevercloud/client/esm/api/v2/organisation.js';
import { defineCommand } from '../../lib/define-command.js';
import { memberRemoveError } from '../../lib/organisation-errors.js';
import { formatOrganisation, formatOrganisationLabel } from '../../lib/organisation-format.js';
import { assertNotPersonalSpace, fetchMembersIfReadable, resolveMember } from '../../lib/organisation-members.js';
import { assertInteractiveTerminal, confirm } from '../../lib/prompts.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { isSameId, resolveOrganisation } from '../../models/organisation.js';
import { sendToApi } from '../../models/send-to-api.js';
import * as User from '../../models/user.js';
import { skipConfirmationOption } from '../global.options.js';
import { orgaIdOrNameArg } from './organisations.args.js';
import { memberIdOrEmailArg } from './organisations.members.args.js';

export const organisationsMembersRemoveCommand = defineCommand({
  description: 'Remove a member from an organisation, or leave it when the member is yourself',
  since: null,
  options: {
    skipConfirmation: skipConfirmationOption,
  },
  args: [orgaIdOrNameArg, memberIdOrEmailArg],
  async handler(options, orgaIdOrName, memberIdOrEmail) {
    const { skipConfirmation } = options;

    const organisation = await resolveOrganisation(orgaIdOrName);
    assertNotPersonalSpace(organisation);
    const orgaLabel = formatOrganisationLabel(organisation);
    const currentUserId = await User.getCurrentId();
    // The member list can be unreadable: a member given by ID is removed anyway
    const members = await fetchMembersIfReadable(organisation.id, currentUserId);
    const member = resolveMember(members, memberIdOrEmail, organisation.name);
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
