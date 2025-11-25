import { drainIdArg } from './drain.args.js';
import { colorOpt, updateNotifierOpt, verboseOpt, aliasOpt, appIdOrNameOpt } from '../global.opts.js';
import { createDrain, deleteDrain, disableDrain, enableDrain, getDrain, getDrains } from '../../clever-client/drains.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { DRAIN_TYPE_CLI_CODES, DRAIN_TYPES, formatDrain } from '../../models/drain.js';
import { sendToApi } from '../../models/send-to-api.js';

export const drainDisableCommand = {
  name: 'disable',
  description: 'Disable a drain',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt
  },
  args: [
    drainIdArg,
  ],
  async execute(params) {
    const [drainId] = params.args;
      const { alias, app: appIdOrName } = params.options;
    
      const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);
    
      await disableDrain({ ownerId, applicationId, drainId }).then(sendToApi);
    
      Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully disabled!`);
  }
};
