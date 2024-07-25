import application from '@clevercloud/client/cjs/api/v2/application.js';

import { sendToApi } from './send-to-api.js';

export function list (ownerId, appId, showAll) {
  const limit = showAll ? null : 10;
  return application.getAllDeployments({ id: ownerId, appId, limit }).then(sendToApi);
};
