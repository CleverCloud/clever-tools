import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroup from '../../models/ng.js';
import { colorOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { ngIdOrLabelArg } from './ng.args.js';

export const ngDeleteCommand = {
  name: 'delete',
  description: 'Delete a Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
  },
  args: [ngIdOrLabelArg],
  async execute(params) {
    const [ngIdOrLabel] = params.args;
    const { org } = params.options;

    await networkGroup.destroy(ngIdOrLabel, org);
    const ngText = ngIdOrLabel.ngResourceLabel ?? ngIdOrLabel.ngId;
    Logger.printSuccess(`Network Group ${styleText('green', ngText)} successfully deleted!`);
  },
};
