import { defineCommand } from '../../lib/define-command.js';
import { operatorRebuild } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const matomoRebuildCommand = defineCommand({
  description: 'Rebuild Matomo',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorRebuild('matomo', addonIdOrName);
  },
});
