import * as Application from '../models/application.js';
import * as application from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../logger.js';
import { sendToApi } from '../models/send-to-api.js';
import colors from 'colors/safe.js';

export async function stop (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await application.undeploy({ id: ownerId, appId }).then(sendToApi);
  Logger.println(colors.bold.green('✓'), 'Application successfully stopped!');
}
