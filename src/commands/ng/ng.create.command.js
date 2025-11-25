import { defineArgument } from '../../lib/define-argument.js';
import { defineCommand } from '../../lib/define-command.js';
import { defineOption } from '../../lib/define-option.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import {
  commaSeparated as commaSeparatedParser,
  ngResourceType as ngResourceTypeParser,
  tags as tagsParser,
} from '../../parsers.js';
import { colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const ngCreateCommand = defineCommand({
  name: 'create',
  description: 'Create a Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    link: defineOption({
      name: 'link',
      description:
        'Comma separated list of members IDs to link to a Network Group (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.)',
      type: 'option',
      metavar: 'members_ids',
      aliases: null,
      default: null,
      required: null,
      parser: commaSeparatedParser,
      complete: null,
    }),
    description: defineOption({
      name: 'description',
      description: 'Network Group description',
      type: 'option',
      metavar: 'description',
      aliases: null,
      default: null,
      required: null,
      parser: null,
      complete: null,
    }),
    tags: defineOption({
      name: 'tags',
      description: 'List of tags, separated by a comma',
      type: 'option',
      metavar: 'tags',
      aliases: null,
      default: null,
      required: null,
      parser: tagsParser,
      complete: null,
    }),
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
  },
  args: [
    defineArgument({
      name: 'ng-label',
      description: 'Network Group label',
      parser: ngResourceTypeParser,
      complete: null,
    }),
  ],
  async execute(params) {
    const [ngLabel] = params.args;
    const label = ngLabel.ngResourceLabel;
    const { description, link: membersIds, org, tags } = params.options;

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
