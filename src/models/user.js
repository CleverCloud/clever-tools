import { get } from '@clevercloud/client/esm/api/v2/organisation.js';
import { sendToApi } from '../models/send-to-api.js';

export function getCurrent () {
  return get({}).then(sendToApi);
}

export function getCurrentId () {
  return get({}).then(sendToApi)
    .then(({ id }) => id);
}

// TODO move to clever client
export function getCurrentToken () {
  return Promise.resolve({
    method: 'get',
    url: '/v2/self/tokens/current',
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  }).then(sendToApi);
}
