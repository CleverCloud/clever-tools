// TODO: import from Clever JS Client

/**
 * GET /self/keys
 * @param {Object} params
 */
export function getSshKeys () {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: '/v2/self/keys',
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * DELETE /self/keys/{key}
 * @param {Object} params
 * @param {String} params.key
 */
export function removeSshKey (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'delete',
    url: `/v2/self/keys/${params.key}`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * PUT /self/keys/{key}
 * @param {Object} params
 * @param {String} params.key
 * @param {Object} body
 */
export function addSshKey (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'put',
    url: `/v2/self/keys/${params.key}`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    // no query params
    body,
  });
}
