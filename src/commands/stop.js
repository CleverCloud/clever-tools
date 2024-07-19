import * as Application from '../models/application.js';
import application from '@clevercloud/client/cjs/api/v2/application.js';
import { Logger } from '../logger.js';
import { sendToApi } from '../models/send-to-api.js';

export async function stop (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await application.undeploy({ id: ownerId, appId }).then(sendToApi);
  Logger.println('App successfully stopped!');
}
