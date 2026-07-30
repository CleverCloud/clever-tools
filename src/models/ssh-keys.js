import { ListPersonalSshKeyCommand } from '@clevercloud/client/cc-api-commands/ssh-key/list-personal-ssh-key-command.js';
import { clients } from './cc-api-client.js';

/**
 * @return {Promise<Array<{ name: string, key: string, fingerprint: string }>>}
 */
export async function getUserSshKeys() {
  const rawKeys = await clients.ccApi.send(new ListPersonalSshKeyCommand());
  return rawKeys.sort((a, b) => a.name.localeCompare(b.name));
}
