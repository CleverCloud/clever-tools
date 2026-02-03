import { config, updateConfig } from '../../config/config.js';
import { defineCommand } from '../../lib/define-command.js';
import { Logger } from '../../logger.js';

export const logoutCommand = defineCommand({
  description: 'Logout from Clever Cloud',
  since: '1.0.0',
  options: {},
  args: [],
  async handler() {
    // write empty object
    await updateConfig({});
    Logger.println(`${config.CONFIGURATION_FILE} has been updated.`);
  },
});
