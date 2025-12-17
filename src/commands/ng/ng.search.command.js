import { defineCommand } from '../../lib/define-command.js';
import { printResults } from '../../lib/ng-print.js';
import { humanJsonOutputFormatOption, orgaIdOrNameOption } from '../global.options.js';
import { ngAnyIdOrLabelArg } from './ng.args.js';
import { ngResourceTypeOption } from './ng.options.js';

export const ngSearchCommand = defineCommand({
  description: 'Search Network Groups, members or peers and get their details',
  since: '3.12.0',
  sinceDate: '2025-03-06',
  options: {
    type: ngResourceTypeOption,
    org: orgaIdOrNameOption,
    format: humanJsonOutputFormatOption,
  },
  args: [ngAnyIdOrLabelArg],
  async handler(options, idOrLabel) {
    const { org, format } = options;
    const type = options.type;

    await printResults(idOrLabel, org, format, 'search', type);
  },
});
