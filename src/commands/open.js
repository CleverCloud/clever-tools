import openPage from 'open';

import * as Application from '../models/application.js';
import * as Domain from '../models/domain.js';
import { Logger } from '../logger.js';

export async function open (params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const vhost = await Domain.getBest(appId, ownerId);
  const url = 'https://' + vhost.fqdn;

  Logger.println('Opening the application in your browser');
  await openPage(url, { wait: false });
}
