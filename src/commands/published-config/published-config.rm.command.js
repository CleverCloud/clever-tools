import { getAllExposedEnvVars, updateAllExposedEnvVars } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { envVariableNameArg } from '../global.args.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const publishedConfigRmCommand = {
  name: 'rm',
  description: 'Remove a published configuration variable from an application',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [envVariableNameArg],
  async execute(params) {
    const [varName] = params.args;
    const { alias, app: appIdOrName } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const publishedConfigs = await getAllExposedEnvVars({ id: ownerId, appId }).then(sendToApi);
    delete publishedConfigs[varName];
    await updateAllExposedEnvVars({ id: ownerId, appId }, publishedConfigs).then(sendToApi);

    Logger.println('Your published config item has been successfully removed');
  },
};
