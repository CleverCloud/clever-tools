import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';

export const ngDeleteExternalCommand = defineCommand({
  description: 'Delete an external peer from a Network Group',
  since: '3.12.0',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [ngExternalIdOrLabelArg, ngIdOrLabelArg],
  async handler(options, peerIdOrLabel, ngIdOrLabel) {
    const { org } = options;

    const peerText = peerIdOrLabel.ngResourceLabel ?? peerIdOrLabel.memberId;
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    await networkGroupResources.deleteExternalPeerWithParent(ngIdOrLabel, peerText, org);
    Logger.printSuccess(
      `External peer ${styleText('green', peerText)} successfully deleted from Network Group ${styleText('green', ngText)}`,
    );
  },
});
