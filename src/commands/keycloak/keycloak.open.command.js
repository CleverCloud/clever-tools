import { defineCommand } from '../../lib/define-command.js';
import { operatorOpen } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakOpenCommand = defineCommand({
  description: 'Open the Keycloak dashboard in Clever Cloud Console',
  since: '3.13.0',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorOpen('keycloak', addonIdOrName);
  },
});
