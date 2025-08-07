import * as Application from '../models/application.js';
import * as Domain from '../models/domain.js';
import { openBrowser } from '../models/utils.js';

export async function open(params) {
  const { alias, app: appIdOrName } = params.options;
  const { ownerId, appId } = await Application.resolveId(appIdOrName, alias);

  const vhost = await Domain.getBest(appId, ownerId);
  const url = 'https://' + vhost.fqdn;

  await openBrowser(url, 'Opening the application in your browser');
}
