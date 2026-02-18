import { config } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { styleText } from '../../lib/style-text.js';
import { resolveConfigProviderId } from '../../models/config-provider.js';
import { openBrowser } from '../../models/utils.js';
import { configProviderIdOrNameArg } from './config-provider.args.js';

export const configProviderOpenCommand = defineCommand({
  description: 'Open the configuration provider in Clever Cloud Console',
  since: '4.6.0',
  options: {},
  args: [configProviderIdOrNameArg],
  async handler(_options, addonIdOrRealIdOrName) {
    const { addonId } = await resolveConfigProviderId(addonIdOrRealIdOrName);
    await openBrowser(`${config.GOTO_URL}/${addonId}`, `Opening ${styleText('blue', addonId)} in the browser...`);
  },
});
