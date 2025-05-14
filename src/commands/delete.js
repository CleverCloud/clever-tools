import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import colors from 'colors/safe.js';

export async function deleteApp (params) {
  const { alias, app: appIdOrName, yes: skipConfirmation } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const app = await Application.get(ownerId, appId);
  if (app == null) {
    throw new Error('The application doesn\'t exist');
  }
  else {
    // delete app
    await Application.deleteApp(app, skipConfirmation);
    Logger.println(`${colors.green('✓')} Application ${colors.green(colors.bold(`${app.name}`))} successfully deleted!`);
    Logger.println(`  ${colors.gray('•')} Application ID: ${colors.gray(app.id)}`);

    const wasUnlinked = await AppConfig.removeLinkedApplication({ appId, alias });
    if (wasUnlinked) {
      Logger.println(`  ${colors.blue('→')} Local alias ${colors.blue(alias || app.name)} unlinked`);
    }
  }
};
