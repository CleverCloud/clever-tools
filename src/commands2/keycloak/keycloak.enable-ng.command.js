import { defineCommand } from '../../lib/define-command.js';
import { operatorNgEnable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakEnableNgCommand = defineCommand({
  description: 'Link Keycloak to a Network Group, used for multi-instances secure communication',
  flags: {},
  args: [addonIdOrNameArg],
  async handler(_flags, addonIdOrName) {
    await operatorNgEnable('keycloak', addonIdOrName);
  },
});
