import { defineCommand } from '../../lib/define-command.js';
import { operatorNgDisable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const keycloakDisableNgCommand = defineCommand({
  name: 'disable-ng',
  description: 'Unlink Keycloak from its Network Group',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [addonIdOrNameArg],
  async execute(params) {
    const [addonIdOrName] = params.args;
    await operatorNgDisable('keycloak', addonIdOrName);
  },
});
