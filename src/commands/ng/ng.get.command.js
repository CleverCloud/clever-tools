import { defineCommand } from '../../lib/define-command.js';
import { printResults } from '../../lib/ng-print.js';
import { colorOpt, humanJsonOutputFormatOpt, orgaIdOrNameOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { ngAnyIdOrLabelArg } from './ng.args.js';
import { ngResourceTypeOpt } from './ng.opts.js';

export const ngGetCommand = defineCommand({
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
    format: humanJsonOutputFormatOpt,
  },
  args: [ngAnyIdOrLabelArg],
  async execute(params) {
    const [idOrLabel] = params.args;
    const { org, format } = params.options;
    const type = params.options.type ?? 'single';

    await printResults(idOrLabel, org, format, 'get', type);
  },
});
