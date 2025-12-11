import { defineCommand } from '../../lib/define-command.js';
import { operatorPrint } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';
import { humanJsonOutputFormatOption } from '../global.options.js';

export const keycloakGetCommand = defineCommand({
  description: 'Get information about a deployed Keycloak',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {
    format: humanJsonOutputFormatOption,
  },
  args: [addonIdOrNameArg],
  async handler(options, addonIdOrName) {
    const { format } = options;
    await operatorPrint('keycloak', addonIdOrName, format);
  },
});
