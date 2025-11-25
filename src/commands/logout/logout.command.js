import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { Logger } from '../../logger.js';
import { conf, writeOAuthConf } from '../../models/configuration.js';

export const logoutCommand = {
  name: 'logout',
  description: 'Logout from Clever Cloud',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt
  },
  args: [],
  async execute() {
    // write empty object
      await writeOAuthConf({});
      Logger.println(`${conf.CONFIGURATION_FILE} has been updated.`);
  }
};
