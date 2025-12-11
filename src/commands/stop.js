import { undeploy as stopApplication } from '@clevercloud/client/esm/api/v2/application.js';
import { Logger } from '../logger.js';
import * as Application from '../models/application.js';
import { sendToApi } from '../models/send-to-api.js';

export async function stop(options) {
  const { alias, app: appIdOrName } = options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  await stopApplication({ id: ownerId, appId }).then(sendToApi);
  Logger.printSuccess('Application successfully stopped!');
}
