import { defineCommand } from '../../lib/define-command.js';
import { operatorNgEnable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const keycloakEnableNgCommand = defineCommand({
  name: 'enable-ng',
  description: 'Link Keycloak to a Network Group, used for multi-instances secure communication',
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
    await operatorNgEnable('keycloak', addonIdOrName);
  },
});
