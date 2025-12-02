import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import { orgaIdOrNameFlag } from '../global.flags.js';
import { ngIdOrLabelArg, ngResourceIdArg } from './ng.args.js';

export const ngUnlinkCommand = defineCommand({
  description:
    'Unlink a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) from a Network Group',
  flags: {
    org: orgaIdOrNameFlag,
  },
  args: [ngResourceIdArg, ngIdOrLabelArg],
  async handler(flags, resourceId, ngIdOrLabel) {
    const { org } = flags;

    await networkGroupResources.unlinkMember(ngIdOrLabel, resourceId.memberId, org);
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    Logger.printSuccess(
      `Member ${styleText('green', resourceId.memberId)} successfully unlinked from Network Group ${styleText('green', ngText)}`,
    );
  },
});
