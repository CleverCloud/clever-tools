import { defineCommand } from '../../lib/define-command.js';
import { operatorNgEnable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakEnableNgCommand = defineCommand({
  description: 'Link Keycloak to a Network Group, used for multi-instances secure communication',
  since: '3.13.0',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorNgEnable('keycloak', addonIdOrName);
  },
});
