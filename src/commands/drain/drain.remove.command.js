import { deleteDrain } from '../../clever-client/drains.js';
import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as Application from '../../models/application.js';
import { sendToApi } from '../../models/send-to-api.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';
import { drainIdArg } from './drain.args.js';

export const drainRemoveCommand = {
  name: 'remove',
  description: 'Remove a drain',
  experimental: false,
  featureFlag: null,
  opts: {
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [drainIdArg],
  async execute(params) {
    const [drainId] = params.args;
    const { alias, app: appIdOrName } = params.options;

    const { ownerId, appId: applicationId } = await Application.resolveId(appIdOrName, alias);

    await deleteDrain({ ownerId, applicationId, drainId }).then(sendToApi);
    Logger.printSuccess(`Drain ${styleText(['bold', 'green'], drainId)} has been successfully removed!`);
  },
};
