import { styleText } from 'node:util';
import { Logger } from '../logger.js';
import * as AppConfig from '../models/app_configuration.js';
import * as Application from '../models/application.js';

export async function deleteApp(params) {
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
}
