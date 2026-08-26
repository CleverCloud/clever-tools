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

/**
 * List the Warp 10 platform applications a READ token may be scoped to on this deployment.
 *
 * Each entry carries its `name`, a one-line `description`, and a `default` flag saying whether it
 * is part of the set a token covers when the request omits `applications`.
 *
 * @returns {Promise<object>} the request params, to be sent with `sendToApi`
 */
export function getAvailableMetricsApplications() {
  return Promise.resolve({
    method: 'get',
    url: '/v4/stats/available-applications',
    headers: { Accept: 'application/json' },
    // no body
  });
}
