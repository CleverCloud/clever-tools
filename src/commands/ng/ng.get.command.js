import { ngAnyIdOrLabelArg } from './ng.args.js';
import { ngResourceTypeOpt } from './ng.opts.js';
import { colorOpt, updateNotifierOpt, verboseOpt, orgaIdOrNameOpt, humanJsonOutputFormatOpt } from '../global.opts.js';
import { printResults } from '../../lib/ng-print.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as networkGroupResources from '../../models/ng-resources.js';
import * as networkGroup from '../../models/ng.js';

export const ngGetCommand = {
  name: 'get',
  description: 'Get details about a Network Group, a member or a peer',
  experimental: false,
  featureFlag: null,
  opts: {
    type: ngResourceTypeOpt,
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    org: orgaIdOrNameOpt,
    format: humanJsonOutputFormatOpt
  },
  args: [
    ngAnyIdOrLabelArg,
  ],
  async execute(params) {
    const [idOrLabel] = params.args;
      const { org, format } = params.options;
      const type = params.options.type ?? 'single';
    
      await printResults(idOrLabel, org, format, 'get', type);
  }
};
