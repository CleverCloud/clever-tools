import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { orgaIdOrNameOption } from '../global.options.js';
import { ngIdOrLabelArg } from './ng.args.js';

export const ngDeleteCommand = defineCommand({
  description: 'Delete a Network Group',
  since: '3.12.0',
  sinceDate: '2025-03-06',
  options: {
    org: orgaIdOrNameOption,
  },
  args: [ngIdOrLabelArg],
  async handler(options, ngIdOrLabel) {
    const { org } = options;

    await networkGroup.destroy(ngIdOrLabel, org);
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    Logger.printSuccess(`Network Group ${styleText('green', ngText)} successfully deleted!`);
  },
});
