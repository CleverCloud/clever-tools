import * as Application from '../models/application.js';
import { Logger } from '../logger.js';
import { sendToApi } from '../models/send-to-api.js';
import { undeploy as stopApplication } from '@clevercloud/client/esm/api/v2/application.js';

export async function stop (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await stopApplication({ id: ownerId, appId }).then(sendToApi);
  Logger.printSuccess('Application successfully stopped!');
}
