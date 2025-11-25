import { defineCommand } from '../../lib/define-command.js';
import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { colorOpt, humanJsonOutputFormatOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const keycloakGetCommand = defineCommand({
  name: 'get',
  description: 'Get information about a deployed Keycloak',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    format: humanJsonOutputFormatOpt,
  },
  args: [addonIdOrNameArg],
  async execute(params) {
    const [addonIdOrName] = params.args;
    const { format } = params.options;
    await operatorPrint('keycloak', addonIdOrName, format);
  },
});
