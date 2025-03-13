/**
 * GET /v1/secret/data/{secret}
 * @param {Object} params
 * @param {String} params.secret
 */
export function getSecret (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v1/secret/data/${params.secret}`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * PATCH /v1/secret/data/{secret}
 * @param {Object} params
 * @param {String} params.secret
 * @param {Object} body
 */
export function patchSecret (params, body) {
  return Promise.resolve({
    method: 'patch',
    url: `/v1/secret/data/${params.secret}`,
    headers: { 'Content-Type': 'application/json' },
    body,
    // no query params
  });
}

/**
 * PUT /v1/secret/data/{secret}
 * @param {Object} params
 * @param {String} params.secret
 * @param {Object} body
 */
export function putSecret (params, body) {
  return Promise.resolve({
    method: 'post',
    url: `/v1/secret/data/${params.secret}`,
    headers: { 'Content-Type': 'application/json' },
    body,
    // no query params
  });
}
