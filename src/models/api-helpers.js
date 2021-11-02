'use strict';

// TODO: move to clever-client
// Tmp TARDIS Warp10 API calls

/**
 * GET /v4/saas/tardis/warp10/{id}/applications
 * @param {Object} params
 * @param {String} params.id
 */
 async function getWarp10Applications (params, from, to) {
  let searchParams = new URLSearchParams();
  let suffix = ""
  if (from) {
    searchParams.set('from', from);
  }
  if (to) {
    searchParams.set('to', to);
  }
  if (Array.from(searchParams).length > 0) {
    suffix = `?${searchParams.toString()}`
  }
  return Promise.resolve({
    method: 'get',
    url: `/v4/saas/tardis/warp10/${params.id}/applications${suffix}`,
    headers: { Accept: 'application/json' },
  });
}

/**
 * POST /v4/saas/tardis/warp10/{id}/applications
 * @param {Object} params
 * @param {String} params.id
 * @param {String} params.ttl
 */
 async function createWarp10Application (params, withoutTokens) {
  const body = {}
  if (params.ttl) {
    body['ttl'] = params.ttl
  }
  let suffix = ""
  if (withoutTokens) {
    suffix = "?appOnly=true"
  }
  return Promise.resolve({
    method: 'post',
    url: `/v4/saas/tardis/warp10/${params.id}/applications${suffix}`,
    headers: { Accept: 'application/json' },
    body: body
  });
}

/**
 * GET /v4/saas/tardis/warp10/{id}/application/{app}
 * @param {Object} params
 * @param {String} params.id
 * @param {String} params.app
 */
 async function getInfoWarp10Application (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/saas/tardis/warp10/${params.id}/application/${params.app}`,
    headers: { Accept: 'application/json' },
  });
}

/**
 * DELETE /v4/saas/tardis/warp10/{id}/application/{app}
 * @param {Object} params
 * @param {String} params.id
 * @param {String} params.app
 */
 async function deleteWarp10Applications(params) {
  return Promise.resolve({
    method: 'delete',
    url: `/v4/saas/tardis/warp10/${params.id}/application/${params.app}`,
    headers: { Accept: 'application/json' },
  });
}

/**
 * GET /v4/saas/tardis/warp10/{id}/application/{app}/tokens
 * @param {Object} params
 * @param {String} params.id
 * @param {String} params.app
 */
 async function getAllTokens (params, withDetails, from, to) {
  let searchParams = new URLSearchParams();
  let suffix = ""
  if (!withDetails) {
    searchParams.set('onlyId', true);
  }
  if (from) {
    searchParams.set('from', from);
  }
  if (to) {
    searchParams.set('to', to);
  }
  if (Array.from(searchParams).length > 0) {
    suffix = `?${searchParams.toString()}`
  }
  return Promise.resolve({
    method: 'get',
    url: `/v4/saas/tardis/warp10/${params.id}/application/${params.app}/tokens${suffix}`,
    headers: { Accept: 'application/json' },
  });
}

/**
 * POST /v4/saas/tardis/warp10/{id}/application/{app}/tokens
 * @param {Object} params
 * @param {String} params.id
 * @param {String} params.app
 * @param {String} params.type
 * @param {String} params.ephemeral
 * @param {String} params.ttl
 * @param {String} params.properties 
 */
 async function createAToken (params) {
  const body = {
    'type': params.type
  }
  if (params.ttl) {
    body['ttl'] = params.ttl
  }
  if (params.properties) {
    const json = '{' + params.properties.replace(/(\w+)=(\w+)/g, `"$1":"$2"`) + '}'
    body['properties'] = JSON.parse(json)
  }
  if (params.ephemeral) {
    body['ephemeral'] = params.ephemeral
  }
  if (params.name) {
    body['name'] = params.name
  }
  return Promise.resolve({
    method: 'post',
    url: `/v4/saas/tardis/warp10/${params.id}/application/${params.app}/tokens`,
    headers: { Accept: 'application/json' },
    body: body
  });
}

/**
 * GET /v4/saas/tardis/warp10/{id}/application/{app}/token/{token}
 * @param {Object} params
 * @param {String} params.id
 * @param {String} params.app
 * @param {String} params.token
 */
 async function getInfoToken (params) {
  return Promise.resolve({
    method: 'get',
    url: `/v4/saas/tardis/warp10/${params.id}/application/${params.app}/token/${params.token}`,
    headers: { Accept: 'application/json' },
  });
}

module.exports = {
  getWarp10Applications,
  createWarp10Application,
  getInfoWarp10Application,
  deleteWarp10Applications,
  getAllTokens,
  createAToken,
  getInfoToken
};
