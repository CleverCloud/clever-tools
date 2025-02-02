/**
 * GET /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys/_template
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function getAiEndpointApiKeyTemplate (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys/_template`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {Object} body
 */
export function createAiEndpointApiKey (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys`,
    headers: { Accept: 'application/json' },
    // no query params
    body,
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys/{apiKeyId}/_deploy
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function deployAiEndpointApiKey (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}/_deploy`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys/{apiKeyId}/_undeploy
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function undeployAiEndpointApiKey (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}/_undeploy`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * GET /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function listAiEndpointApiKeys (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * GET /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys/{apiKeyId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function getAiEndpointApiKey (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * PATCH /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys/{apiKeyId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {Object} body
 */
export function patchAiEndpointApiKey (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}`,
    headers: { Accept: 'application/json' },
    // no query params
    body,
  });
}

/**
 * DELETE /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys/{apiKeyId}
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function deleteAiEndpointApiKey (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'delete',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}`,
    headers: { Accept: 'application/json' },
    // no query params
    // no body
  });
}

/**
 * POST /addon-providers/addon-ai/addons/{aiId}/ai/endpoints/{endpointId}/apikeys/_search
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 * @param {Object} body
 */
export function searchAiEndpointApiKeys (params, body) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-ai/addons/${params.aiId}/ai/endpoints/${params.endpointId}/apikeys/_search`,
    headers: { Accept: 'application/json' },
    // no query params
    body,
  });
}
