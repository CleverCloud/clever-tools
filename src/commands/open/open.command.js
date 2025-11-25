import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import * as Application from '../../models/application.js';
import * as Domain from '../../models/domain.js';
import { openBrowser } from '../../models/utils.js';

export const openCommand = {
  name: 'open',
  description: 'Open an application in the Console',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName } = params.options;
      const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);
    
      const vhost = await Domain.getBest(appId, ownerId);
      const url = 'https://' + vhost.fqdn;
    
      await openBrowser(url, 'Opening the application in your browser');
  }
};
