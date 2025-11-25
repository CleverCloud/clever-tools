// TODO: Move this to the Clever Cloud JS Client

/**
 * GET https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 */
export function getAIEndpoints(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {Object} params.body
 */
export function createAIEndpoint(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: params.body,
  });
}

/**
 * GET https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 */
export function getAIEndpoint(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 *  @param {Object} params.body
 */
export function updateAIEndpoint(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'post',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: params.body,
  });
}

/**
 * DELETE https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 */
export function deleteAIEndpoint(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'delete',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}`,
    headers: { Accept: 'application/json' },
    // no body
  });
}

/**
 * GET https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}/apikeys
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 */
export function getAIEndpointApiKeys(params) {
    // no multipath for /self or /organisations/{id}
    return Promise.resolve({
      method: 'get',
      url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}/apikeys`,
      headers: { Accept: 'application/json' },
      // no queryParams
      // no body
    });
}

/**
 * POST https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}/apikeys
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 *  @param {Object} params.body
 */
export function createAIEndpointApiKey(params) {
    // no multipath for /self or /organisations/{id}
    return Promise.resolve({
      method: 'post',
      url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}/apikeys`,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: params.body,
    });
}

/**
 * GET https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}/apikeys/{apiKeyId}
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 *  @param {String} params.apiKeyId
 */
export function getAIEndpointApiKey(params) {
    // no multipath for /self or /organisations/{id}
    return Promise.resolve({
      method: 'get',
      url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}`,
      headers: { Accept: 'application/json' },
      // no queryParams
      // no body
    });
}

/**
 * POST https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}/apikeys/{apiKeyId}
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 *  @param {String} params.apiKeyId
 *  @param {Object} params.body
 */
export function updateAIEndpointApiKey(params) {
    // no multipath for /self or /organisations/{id}
    return Promise.resolve({
      method: 'post',
      url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}`,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: params.body,
    });
}

/**
 * DELETE https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}/apikeys/{apiKeyId}
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 *  @param {String} params.endpointId
 *  @param {String} params.apiKeyId
 */
export function deleteAIEndpointApiKey(params) {
    // no multipath for /self or /organisations/{id}
    return Promise.resolve({
      method: 'delete',
      url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}/apikeys/${params.apiKeyId}`,
      headers: { Accept: 'application/json' },
      // no body
    });
}

/**
 * GET https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}/budgets
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.realId
 * @param {String} params.endpointId
 */
export function getAIEndpointBudgets(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}/budgets`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/endpoints/{endpointId}/budgets/{budgetId}
 * @param {Object} params
 * @param {String} params.ownerId
 * @param {String} params.realId
 * @param {String} params.endpointId
 * @param {String} params.budgetId
 */
export function getAIEndpointBudget(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/endpoints/${params.endpointId}/budgets/${params.budgetId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * GET https://api.clever-cloud.com/v4/ai/organisations/{ownerId}/ai/{realId}/providers
 *  @param {Object} params
 *  @param {String} params.ownerId
 *  @param {String} params.realId
 */
export function getAIProviders(params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/ai/organisations/${params.ownerId}/ai/${params.realId}/providers`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}
