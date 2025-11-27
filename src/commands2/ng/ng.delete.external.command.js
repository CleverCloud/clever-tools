import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import { orgaIdOrNameFlag } from '../global.flags.js';
import { ngExternalIdOrLabelArg, ngIdOrLabelArg } from './ng.args.js';

export const ngDeleteExternalCommand = defineCommand({
  description: 'Delete an external peer from a Network Group',
  flags: {
    org: orgaIdOrNameFlag,
  },
  args: [ngExternalIdOrLabelArg, ngIdOrLabelArg],
  async handler(flags, peerIdOrLabel, ngIdOrLabel) {
    const { org } = flags;

    const peerText = peerIdOrLabel.ngResourceLabel ?? peerIdOrLabel.memberId;
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    await networkGroupResources.deleteExternalPeerWithParent(ngIdOrLabel, peerText, org);
    Logger.printSuccess(
      `External peer ${styleText('green', peerText)} successfully deleted from Network Group ${styleText('green', ngText)}`,
    );
  },
});
