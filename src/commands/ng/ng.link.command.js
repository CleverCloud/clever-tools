import { ngResourceIdArg, ngIdOrLabelArg } from './ng.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt } from '../global.opts.js';
import { printResults } from '../../lib/ng-print.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import * as networkGroup from '../../models/ng.js';

export const ngLinkCommand = {
  name: 'link',
  description: 'Link a resource by its ID (app_xxx, external_xxx, mysql_xxx, postgresql_xxx, redis_xxx, etc.) to a Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt
  },
  args: [
    ngResourceIdArg,
    ngIdOrLabelArg,
  ],
  async execute(params) {
    const [resourceId, ngIdOrLabel] = params.args;
      const { org } = params.options;
    
      await networkGroupResources.linkMember(ngIdOrLabel, resourceId.memberId, org);
      const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
      Logger.printSuccess(
        `Member ${styleText('green', resourceId.memberId)} successfully linked to Network Group ${styleText('green', ngText)}`,
      );
  }
};
