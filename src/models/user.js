import { GetProfileCommand } from '@clevercloud/client/cc-api-commands/profile/get-profile-command.js';
import { clients } from './cc-api-client.js';

export function getCurrent() {
  return clients.ccApi.send(new GetProfileCommand());
}

export function getCurrentId() {
  return getCurrent().then(({ id }) => id);
}
