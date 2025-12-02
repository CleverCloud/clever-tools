import { defineCommand } from '../../lib/define-command.js';
import { printResults } from '../../lib/ng-print.js';
import { humanJsonOutputFormatFlag, orgaIdOrNameFlag } from '../global.flags.js';
import { ngAnyIdOrLabelArg } from './ng.args.js';
import { ngResourceTypeFlag } from './ng.flags.js';

export const ngSearchCommand = defineCommand({
  description: 'Search Network Groups, members or peers and get their details',
  flags: {
    type: ngResourceTypeFlag,
    org: orgaIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [ngAnyIdOrLabelArg],
  async handler(flags, idOrLabel) {
    const { org, format } = flags;
    const type = flags.type;

    await printResults(idOrLabel, org, format, 'search', type);
  },
});
