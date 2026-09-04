/**
 * Create a Warp 10 READ token scoped to an owner and a set of platform applications.
 *
 * The owner may be an organisation (`orga_…`) or a personal space (`user_…`); the route is named
 * `organisations` but accepts both.
 *
 * @param {object} params
 * @param {string} params.ownerId Organisation or personal space ID
 * @param {string[]} params.applications Platform applications the token grants read access to
 * @param {string} params.ttl Token lifespan, as an ISO 8601 duration
 * @returns {Promise<object>} the request params, to be sent with `sendToApi`
 */
export function createMetricsReadToken({ ownerId, applications, ttl }) {
  return Promise.resolve({
    method: 'post',
    url: `/v4/stats/organisations/${ownerId}/tokens/read`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { applications, ttl },
  });
}
