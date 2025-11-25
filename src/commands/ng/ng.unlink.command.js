import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import { colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { ngIdOrLabelArg, ngResourceIdArg } from './ng.args.js';

export const ngUnlinkCommand = {
  name: 'unlink',
  description:
    'Unlink a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) from a Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
  },
  args: [ngResourceIdArg, ngIdOrLabelArg],
  async execute(params) {
    const [resourceId, ngIdOrLabel] = params.args;
    const { org } = params.options;

    await networkGroupResources.unlinkMember(ngIdOrLabel, resourceId.memberId, org);
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    Logger.printSuccess(
      `Member ${styleText('green', resourceId.memberId)} successfully unlinked from Network Group ${styleText('green', ngText)}`,
    );
  },
};
