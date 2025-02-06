import { sendToApi } from './send-to-api.js';
import { getAllDeployments } from '@clevercloud/client/esm/api/v2/application.js';

export function list (ownerId, appId, showAll) {
  const limit = showAll ? null : 10;
  return getAllDeployments({ id: ownerId, appId, limit }).then(sendToApi);
};
