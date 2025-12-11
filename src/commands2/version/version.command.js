import pkg from '../../../package.json' with { type: 'json' };
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';

export const versionCommand = defineCommand({
  description: 'Display the clever-tools version',
  since: '1.0.0',
  sinceDate: '2018-10-15',
  options: {},
  args: [],
  async handler() {
    Logger.println(pkg.version);
  },
});
