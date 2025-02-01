/**
 * POST /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs/
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {Object} body
 */
export function genBiscuitKeypair (auth, body) {
  return Promise.resolve({
    method: 'post',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    body,
  });
}

/**
 * DELETE /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs/${keypairId}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} keypairId
 */
export function deleteBiscuitKeypair (auth, keypairId) {
  return Promise.resolve({
    method: 'delete',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs/${keypairId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getBiscuitKeypairs (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs/${keypairId}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} keypairId
 */
export function getBiscuitKeypair (auth, keypairId) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs/${keypairId}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs/_template
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getBiscuitKeypairsTemplate (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-keypairs/_template`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * POST /api/extensions/biscuit/tokens/_generate
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {Object} body
 */
export function genBiscuitToken (auth, body) {
  return Promise.resolve({
    method: 'post',
    url: `${auth.apiUrl}/api/extensions/biscuit/tokens/_generate`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    body,
  });
}

/**
 * POST /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {Object} body
 */
export function createBiscuitVerifier (auth, body) {
  return Promise.resolve({
    method: 'post',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    body,
  });
}

/**
 * GET /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers/_template
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getBiscuitVerifierTemplate (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers/_template`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getBiscuitVerifiers (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * DELETE /apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers/{id}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} id
 */
export function deleteBiscuitVerifier (auth, id) {
  return Promise.resolve({
    method: 'delete',
    url: `${auth.apiUrl}/apis/biscuit.extensions.cloud-apim.com/v1/biscuit-verifiers/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * POST /apis/proxy.otoroshi.io/v1/routes
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {Object} body
 */
export function createRoute (auth, body) {
  return Promise.resolve({
    method: 'post',
    url: `${auth.apiUrl}/apis/proxy.otoroshi.io/v1/routes`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    body,
  });
}

/**
 * GET /apis/proxy.otoroshi.io/v1/routes/_template
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getRouteTemplate (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/proxy.otoroshi.io/v1/routes/_template`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/proxy.otoroshi.io/v1/routes
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getRoutes (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/proxy.otoroshi.io/v1/routes`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/proxy.otoroshi.io/v1/routes/{id}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} id
 */
export function getRoute (auth, id) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/proxy.otoroshi.io/v1/routes/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * DELETE /apis/proxy.otoroshi.io/v1/routes/{id}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} id
 */
export function deleteRoute (auth, id) {
  return Promise.resolve({
    method: 'delete',
    url: `${auth.apiUrl}/apis/proxy.otoroshi.io/v1/routes/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs/_template
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getWafTemplate (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs/_template`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getWafs (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs/${id}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} id
 */
export function getWaf (auth, id) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * POST /apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {Object} body
 */
export function createWaf (auth, body) {
  return Promise.resolve({
    method: 'post',
    url: `${auth.apiUrl}/apis/coraza-waf.extensions.otoroshi.io/v1/coraza-configs`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    body,
  });
}

/**
 * GET /apis/apim.otoroshi.io/v1/apikeys/_template
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getApiKeyTemplate (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/apim.otoroshi.io/v1/apikeys/_template`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * POST /apis/apim.otoroshi.io/v1/apikeys
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function createApiKey (auth, body) {
  return Promise.resolve({
    method: 'post',
    url: `${auth.apiUrl}/apis/apim.otoroshi.io/v1/apikeys`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    body,
  });
}

/**
 * GET /apis/apim.otoroshi.io/v1/apikeys
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 */
export function getApiKeys (auth) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/apim.otoroshi.io/v1/apikeys`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * GET /apis/apim.otoroshi.io/v1/apikeys/{id}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} id
 */
export function getApiKey (auth, id) {
  return Promise.resolve({
    method: 'get',
    url: `${auth.apiUrl}/apis/apim.otoroshi.io/v1/apikeys/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}

/**
 * DELETE /apis/apim.otoroshi.io/v1/apikeys/{id}
 * @param {string} auth.apiId
 * @param {string} auth.apiSecret
 * @param {string} id
 */
export function deleteApiKey (auth, id) {
  return Promise.resolve({
    method: 'delete',
    url: `${auth.apiUrl}/apis/apim.otoroshi.io/v1/apikeys/${id}`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${auth.apiId}:${auth.apiSecret}`).toString('base64')}`,
    },
    // no queryParams
    // no body
  });
}
