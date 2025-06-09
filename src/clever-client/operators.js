// TODO: Move this to the Clever Cloud JS Client

/**
 * GET /v4/addon-providers/addon-{provider}/addons/{realId}
 * @param {Object} params
 * @param {String} params.provider
 * @param {String} params.realId
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
 * @param {String} params.provider
 * @param {String} params.realId
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
 * @param {String} params.provider
 * @param {String} params.realId
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

/**
 * POST /v4/addon-providers/addon-{provider}/addons/{realId}/networkgroup
 * @param {Object} params
 * @param {String} params.provider
 * @param {String} params.realId
 */
export function ngEnableOperator (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-${params.provider}/addons/${params.realId}/networkgroup`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-{provider}/addons/{realId}/networkgroup
 * @param {Object} params
 * @param {String} params.provider
 * @param {String} params.realId
 */
export function ngDisableOperator (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'delete',
    url: `/v4/addon-providers/addon-${params.provider}/addons/${params.realId}/networkgroup`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET /v4/addon-providers/addon-{provider}/addons/{realId}/version/check
 * @param {Object} params
 * @param {String} params.provider
 * @param {String} params.realId
 */
export function versionCheck (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-${params.provider}/addons/${params.realId}/version/check`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-{provider}/addons/{realId}/version/update
 * @param {Object} params
 * @param {String} params.provider
 * @param {String} params.realId
 * @param {Object} body
 */
export function versionUpdate (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-${params.provider}/addons/${params.realId}/version/update`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    // no queryParams
    body,
  });
}
