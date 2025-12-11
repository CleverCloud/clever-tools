import { defineCommand } from '../../lib/define-command.js';
import { operatorNgDisable } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const keycloakDisableNgCommand = defineCommand({
  description: 'Unlink Keycloak from its Network Group',
  since: '3.13.0',
  sinceDate: '2025-06-10',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorNgDisable('keycloak', addonIdOrName);
  },
});
