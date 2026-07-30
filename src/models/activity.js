import { ListDeploymentCommand } from '@clevercloud/client/cc-api-commands/deployment/list-deployment-command.js';
import { clients } from './cc-api-client.js';

export function list(ownerId, appId, showAll) {
  const limit = showAll ? undefined : 10;
  return clients.ccApi.send(new ListDeploymentCommand({ ownerId, applicationId: appId, limit }));
}
