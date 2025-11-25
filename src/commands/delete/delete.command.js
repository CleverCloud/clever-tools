import { styleText } from '../../lib/style-text.js';
import { Logger } from '../../logger.js';
import * as AppConfig from '../../models/app_configuration.js';
import * as Application from '../../models/application.js';
import { aliasOpt, appIdOrNameOpt, colorOpt, updateNotifierOpt, verboseOpt } from '../global.opts.js';

export const deleteCommand = {
  name: 'delete',
  description: 'Delete an application',
  experimental: false,
  featureFlag: null,
  opts: {
    yes: {
      name: 'yes',
      description: 'Skip confirmation and delete the application directly',
      type: 'flag',
      metavar: null,
      aliases: ['y'],
      default: null,
      required: null,
      parser: null,
      complete: null,
    },
    color: colorOpt,
    'update-notifier': updateNotifierOpt,
    verbose: verboseOpt,
    alias: aliasOpt,
    app: appIdOrNameOpt,
  },
  args: [],
  async execute(params) {
    const { alias, app: appIdOrName, yes: skipConfirmation } = params.options;
    const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

    const app = await Application.get(ownerId, appId);
    if (app == null) {
      throw new Error("The application doesn't exist");
    }

    // delete app
    await Application.deleteApp(app, skipConfirmation);
    Logger.printSuccess(`Application ${styleText('green', styleText('bold', `${app.name}`))} successfully deleted!`);
    Logger.println(`  ${styleText('grey', '•')} Application ID: ${styleText('grey', app.id)}`);

    const wasUnlinked = await AppConfig.removeLinkedApplication({ appId, alias });
    if (wasUnlinked) {
      Logger.println(`  ${styleText('blue', '→')} Local alias ${styleText('blue', alias || app.name)} unlinked`);
    }
  },
};
