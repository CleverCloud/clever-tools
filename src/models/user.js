import { get } from '@clevercloud/client/esm/api/v2/organisation.js';
import { sendToApi } from './send-to-api.js';

export function getCurrent() {
  return get({}).then(sendToApi);
}

export function getCurrentId() {
  return get({})
    .then(sendToApi)
    .then(({ id }) => id);
}
