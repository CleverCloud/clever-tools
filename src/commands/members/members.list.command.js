import { z } from 'zod';
import { formatBorderedTable } from '../../format-table.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { formatOrganisation } from '../../lib/organisation-format.js';
import { fetchMembers, sortMembers } from '../../lib/organisation-members.js';
import { Logger } from '../../logger.js';
import { resolveOrganisationAndUser } from '../../models/organisation.js';
import { orgaIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatOption } from '../global.options.js';
import { ROLES_LIST, roleSchema } from './members.options.js';

export const membersListCommand = defineCommand({
  description: 'List the members of an organisation',
  since: null,
  options: {
    role: defineOption({
      name: 'role',
      schema: roleSchema.optional(),
      description: `Only list the members with this role (${ROLES_LIST})`,
      placeholder: 'role',
    }),
    withoutMfa: defineOption({
      name: 'without-2fa',
      schema: z.boolean().default(false),
      description: 'Only list the members without 2FA',
    }),
    format: humanJsonOutputFormatOption,
  },
  args: [orgaIdOrNameArg],
  async handler(options, orgaIdOrName) {
    const { role, withoutMfa, format } = options;

    const { organisation, currentUserId } = await resolveOrganisationAndUser(orgaIdOrName);
    if (organisation.isPersonal) {
      throw new Error('Personal spaces have no members, use an organisation instead');
    }
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
        const rows = members.map((member) => [
          member.role,
          member.name ?? '-',
          member.email,
          member.id,
          member.isMfaEnabled ? 'enabled' : 'disabled',
        ]);
        Logger.println(formatBorderedTable([['ROLE', 'NAME', 'EMAIL', 'ID', '2FA'], ...rows]));
      }
    }
  },
});
