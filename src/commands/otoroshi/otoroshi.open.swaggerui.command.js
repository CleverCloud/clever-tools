import { defineCommand } from '../../lib/define-command.js';
import { operatorOpenSwaggerUi } from '../../lib/operator-commands.js';
import { addonIdOrNameArg } from '../global.args.js';

export const otoroshiOpenSwaggeruiCommand = defineCommand({
  description: 'Open the Otoroshi Swagger UI in your browser',
  since: 'unreleased',
  options: {},
  args: [addonIdOrNameArg],
  async handler(_options, addonIdOrName) {
    await operatorOpenSwaggerUi(addonIdOrName);
  },
});
