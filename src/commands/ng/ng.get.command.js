import { defineCommand } from '../../lib/define-command.js';
import { printResults } from '../../lib/ng-print.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { ngAnyIdOrLabelArg } from './ng.args.js';
import { ngResourceTypeOption } from './ng.options.js';

export const ngGetCommand = defineCommand({
  description: 'Get details about a Network Group, a member or a peer',
  since: '3.12.0',
  options: {
    type: ngResourceTypeOption,
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [ngAnyIdOrLabelArg],
  async handler(options, idOrLabel) {
    const { org, format } = options;
    const type = options.type ?? 'single';

    await printResults(idOrLabel, org, format, 'get', type);
  },
});
