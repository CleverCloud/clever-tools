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
 * PUT /v1/secret/data/{secret}
 * @param {Object} params
 * @param {String} params.secret
 * @param {Object} body
 */
export function putSecret (params, body) {
  return Promise.resolve({
    method: 'put',
    url: `/v1/secret/data/${params.secret}`,
    headers: { 'Content-Type': 'application/json' },
    body,
    // no query params
  });
}
