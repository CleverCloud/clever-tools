import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { orgaIdOrNameFlag } from '../global.flags.js';
import { ngIdOrLabelArg } from './ng.args.js';

export const ngDeleteCommand = defineCommand({
  description: 'Delete a Network Group',
  flags: {
    org: orgaIdOrNameFlag,
  },
  args: [ngIdOrLabelArg],
  async handler(flags, ngIdOrLabel) {
    const { org } = flags;

    await networkGroup.destroy(ngIdOrLabel, org);
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    Logger.printSuccess(`Network Group ${styleText('green', ngText)} successfully deleted!`);
  },
});
