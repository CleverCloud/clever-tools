import { z } from 'zod';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { formatOrganisation } from '../../lib/organisation-format.js';
import { assertNotPersonalSpace, fetchMembers, sortMembers } from '../../lib/organisation-members.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import { resolveOrganisation } from '../../models/organisation.js';
import * as User from '../../models/user.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { orgaIdOrNameArg } from './organisations.args.js';
import { roleFilterOption } from './organisations.members.options.js';

export const organisationsMembersListCommand = defineCommand({
  description: 'List the members of an organisation',
  since: null,
  options: {
    role: roleFilterOption,
    withoutMfa: defineOption({
      name: 'without-2fa',
      schema: z.boolean().default(false),
      description: 'Only list the members without two-factor authentication enabled',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [orgaIdOrNameArg],
  async handler(options, orgaIdOrName) {
    const { role, withoutMfa, format } = options;

    const organisation = await resolveOrganisation(orgaIdOrName);
    assertNotPersonalSpace(organisation);
    const currentUserId = await User.getCurrentId();
    const members = sortMembers(await fetchMembers(organisation.id, currentUserId)).filter(
      (member) => (role == null || member.role === role) && (!withoutMfa || !member.isMfaEnabled),
    );

    switch (format) {
      case 'json': {
        Logger.printJson(members);
        break;
      }
      case 'human':
      default: {
        if (members.length === 0) {
          Logger.println(`🔎 No member found in ${formatOrganisation(organisation)}`);
          return;
        }
        const plural = members.length > 1 ? 's' : '';
        Logger.println(`🔎 Found ${members.length} member${plural} in ${formatOrganisation(organisation)}:`);
        Logger.println();
        for (const member of members) {
          const identity = member.name != null ? `${styleText('bold', member.name)} <${member.email}>` : member.email;
          const you = member.isCurrentUser ? ' you' : '';
          Logger.println(`• ${identity} ${styleText('grey', `(${member.id})`)}${you}`);
          Logger.println(`  Role: ${member.role}`);
          Logger.println(`  2FA:  ${member.isMfaEnabled ? 'enabled' : 'disabled'}`);
        }
      }
    }
  },
});
