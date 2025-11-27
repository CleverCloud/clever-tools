import { z } from 'zod';
import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineFlag } from '../../lib/define-flag.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { ngResourceType } from '../../parsers.js';
import { orgaIdOrNameFlag } from '../global.flags.js';

export const ngCreateCommand = defineCommand({
  description: 'Create a Network Group',
  flags: {
    link: defineFlag({
      name: 'link',
      schema: z
        .string()
        .transform((v) => v.split(','))
        .optional(),
      description:
        'Comma separated list of members IDs to link to a Network Group (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)',
      placeholder: 'members_ids',
    }),
    description: defineFlag({
      name: 'description',
      schema: z.string().optional(),
      description: 'Network Group description',
      placeholder: 'description',
    }),
    tags: defineFlag({
      name: 'tags',
      schema: z.string().optional(),
      description: 'List of tags, separated by a comma',
      placeholder: 'tags',
    }),
    org: orgaIdOrNameFlag,
  },
  args: [
    defineArgument({
      schema: z.string().transform(ngResourceType),
      description: 'Network Group label',
      placeholder: 'ng-label',
    }),
  ],
  async handler(flags, ngLabel) {
    const label = ngLabel.ngResourceLabel;
    const { description, link: membersIds, org, tags } = flags;

    await networkGroup.create(label, description, tags, membersIds, org);

    const successMessage = `Network Group ${styleText('green', label)} successfully created`;
    if (membersIds == null) {
      Logger.printSuccess(`${successMessage}!`);
    } else {
      Logger.printSuccess(`${successMessage} with member(s):`);
      Logger.println(membersIds.map((id) => styleText('grey', `  - ${id}`)).join('\n'));
    }
  },
});
