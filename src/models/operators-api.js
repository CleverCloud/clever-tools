// TODO: Move this to the Clever Cloud JS Client

/**
 * GET /v4/addon-providers/addon-{provider}/addons/{realId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function getOperator (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-${params.provider}/addons/${params.realId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-{provider}/addons/{realId}/reboot
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function rebootOperator (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-${params.provider}/addons/${params.realId}/reboot`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-{provider}/addons/{realId}/rebuild
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function rebuildOperator (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-${params.provider}/addons/${params.realId}/rebuild`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}
