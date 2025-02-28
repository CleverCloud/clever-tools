// TODO: Move this to the Clever Cloud JS Client

/**
 * GET /networkgroups/organisations/{ownerId}/networkgroups/search?query
 * @param {Object} params
 * @param {String} params.undefined
 * @param {String} params.undefined
 */
export function searchNetworkGroupOrResource (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/networkgroups/organisations/${params.ownerId}/networkgroups/search`,
    headers: { Accept: 'application/json' },
    queryParams: { query: params.query },
    // no body
  });
}
