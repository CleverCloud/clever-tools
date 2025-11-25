import { getAllExposedEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { toNameEqualsValueString } from '@clevercloud/client/esm/utils/env-vars.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, envFormatOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const publishedConfigCommand = {
  name: 'published-config',
  description: 'Manage the configuration made available to other applications by this application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
    format: envFormatOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName, format } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
    const pairs = Object.entries(publishedConfigs).map(([name, value]) => ({ name, value }));

    switch (format) {
      case 'json': {
        Logger.printJson(pairs);
        break;
      }
      case 'shell':
        Logger.println(toNameEqualsValueString(pairs, { addExports: true }));
        break;
      case 'human':
      default: {
        Logger.println('# Published configs');
        Logger.println(toNameEqualsValueString(pairs, { addExports: false }));
      }
    }
  },
};
