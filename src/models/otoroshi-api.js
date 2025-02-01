// TODO: Move this to the Clever Cloud JS Client

/**
 * GET /v4/addon-providers/addon-otoroshi/addons/{otoroshiId}
 * @param {Object} params
 * @param {String} params.undefined
 */
export function getOtoroshi (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-otoroshi/addons/${params.otoroshiId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-otoroshi/addons/{otoroshiId}/reboot
 * @param {Object} params
 * @param {String} params.undefined
 */
export function rebootOtoroshi (params) {
  // no multipath for /self or /organisations/{id}/ng
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-otoroshi/addons/${params.otoroshiId}/reboot`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-otoroshi/addons/{otoroshiId}/rebuild
 * @param {Object} params
 * @param {String} params.undefined
 */
export function rebuildOtoroshi (params) {
  // no multipath for /self or /organisations/{id}/ng
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-otoroshi/addons/${params.otoroshiId}/rebuild`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}
