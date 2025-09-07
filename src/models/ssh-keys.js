import { todo_getSshKeys as getSshKeys } from '@clevercloud/client/esm/api/v2/user.js';
import { sendToApi } from './send-to-api.js';

/**
 * @return {Promise<Array<{ name: string, key: string, fingerprint: string }>>}
 */
export async function getUserSshKeys() {
  const rawKeys = await getSshKeys().then(sendToApi);
  return rawKeys.sort((a, b) => a.name.localeCompare(b.name));
}
