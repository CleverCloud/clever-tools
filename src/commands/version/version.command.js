import pkg from '../../../package.json' with { type: 'json' };
import { Logger } from '../../logger.js';
import { colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const versionCommand = {
  name: 'version',
  description: 'Display the clever-tools version',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
  },
  args: [],
  async execute() {
    Logger.println(pkg.version);
  },
};
