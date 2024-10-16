import * as Application from './application.js';
import * as organisation from '@clevercloud/client/esm/api/v2/organisation.js';
import { sendToApi } from './send-to-api.js';
import cliparse from 'cliparse';
export async function getNamespaces (ownerId) {
  return organisation.getNamespaces({ id: ownerId }).then(sendToApi);
}

export async function completeNamespaces () {
  // Sadly we do not have access to current params in complete as of now
  const { ownerId } = await Application.resolveId(null, null);

  return getNamespaces(ownerId).then(cliparse.autocomplete.words);
}
