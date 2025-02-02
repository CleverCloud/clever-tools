/**
 * GET /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/_template
 * @param {Object} params
 * @param {String} params.undefined
 */
export function getAiEndpointTemplate (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/_template`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * GET /addon-providers/addon-ai/addons/{aiId}/ai/endpoints
 * @param {Object} params
 * @param {String} params.undefined
 */
export function getAiEndpoints (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/endpoints/list`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * GET /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function getAiEndpoint (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/_search
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {Object} body
 */
export function searchAiEndpoints (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/_search`,
    headers: { Accept: 'application/json' },
    // no query params
    body,
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/_status
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function getAiEndpointStatus (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/_status`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 *
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {Object} body
 */
export function createAiEndpoint (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}`,
    headers: { Accept: 'application/json' },
    // no query params
    body,
  });
}

// TODO: MOVE TO PATCH? //
/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {Object} body
 */
export function updateAiEndpoint (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}`,
    headers: { Accept: 'application/json' },
    // no query params
    body,
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/_deploy
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 *
 */
export function deployAiEndpoint (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/_deploy`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/_undeploy
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 *
 */
export function undeployAiEndpoint (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/_undeploy`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 *
 * DELETE /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function deleteAiEndpoint (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'delete',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}
