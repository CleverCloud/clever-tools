import { defineCommand } from '../../lib/define-command.js';
import { printResults } from '../../lib/ng-print.js';
import { humanJsonOutputFormatFlag, orgaIdOrNameFlag } from '../global.flags.js';
import { ngAnyIdOrLabelArg } from './ng.args.js';
import { ngResourceTypeFlag } from './ng.flags.js';

export const ngGetCommand = defineCommand({
  description: 'Get details about a Network Group, a member or a peer',
  flags: {
    type: ngResourceTypeFlag,
    org: orgaIdOrNameFlag,
    format: humanJsonOutputFormatFlag,
  },
  args: [ngAnyIdOrLabelArg],
  async handler(flags, idOrLabel) {
    const { org, format } = flags;
    const type = flags.type ?? 'single';

    await printResults(idOrLabel, org, format, 'get', type);
  },
});
