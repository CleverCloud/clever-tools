import { ListTcpRedirectionNamespaceCommand } from '@clevercloud/client/cc-api-commands/tcp-redirection/list-tcp-redirection-namespace-command.js';
import * as Application from './application.js';
import { clients } from './cc-api-client.js';

export async function getNamespaces(ownerId) {
  return clients.ccApi.send(new ListTcpRedirectionNamespaceCommand({ ownerId }));
}

export async function completeNamespaces() {
  // Sadly we do not have access to current params in complete as of now
  const { ownerId } = await Application.resolveId(null, null);

  return getNamespaces(ownerId);
}
