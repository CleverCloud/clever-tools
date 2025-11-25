import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import { colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';

export const ngDeleteExternalCommand = {
  name: 'external',
  description: 'Delete an external peer from a Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
  },
  args: [ngExternalIdOrLabelArg, ngIdOrLabelArg],
  async execute(params) {
    const [peerIdOrLabel, ngIdOrLabel] = params.args;
    const { org } = params.options;

    const peerText = peerIdOrLabel.ngResourceLabel ?? peerIdOrLabel.memberId;
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    await networkGroupResources.deleteExternalPeerWithParent(ngIdOrLabel, peerText, org);
    Logger.printSuccess(
      `External peer ${styleText('green', peerText)} successfully deleted from Network Group ${styleText('green', ngText)}`,
    );
  },
};
