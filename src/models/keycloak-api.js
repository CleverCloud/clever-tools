// TODO: Move this to the Clever Cloud JS Client

/**
 * GET /v4/addon-providers/addon-keycloak/addons/{keycloakId}
 * @param {Object} params
 * @param {String} params.undefined
 */
export function getKeycloak (params) {
  // no multipath for /self or /organisations/{id}
  return Promise.resolve({
    method: 'get',
    url: `/v4/addon-providers/addon-keycloak/addons/${params.keycloakId}`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-keycloak/addons/{keycloakId}/ng
 * @param {Object} params
 * @param {String} params.undefined
 */
export function ngEnableKeycloak (params) {
  // no multipath for /self or /organisations/{id}/ng
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-keycloak/addons/${params.keycloakId}/ng`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * DELETE /v4/addon-providers/addon-keycloak/addons/{keycloakId}/ng
 * @param {Object} params
 * @param {String} params.undefined
 */
export function ngDisableKeycloak (params) {
  // no multipath for /self or /organisations/{id}/ng
  return Promise.resolve({
    method: 'delete',
    url: `/v4/addon-providers/addon-keycloak/addons/${params.keycloakId}/ng`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-keycloak/addons/{keycloakId}/reboot
 * @param {Object} params
 * @param {String} params.undefined
 */
export function rebootKeycloak (params) {
  // no multipath for /self or /organisations/{id}/reboot
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-keycloak/addons/${params.keycloakId}/reboot`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}

/**
 * POST /v4/addon-providers/addon-keycloak/addons/{keycloakId}/rebuild
 * @param {Object} params
 * @param {String} params.undefined
 */
export function rebuildKeycloak (params) {
  // no multipath for /self or /organisations/{id}/rebuild
  return Promise.resolve({
    method: 'post',
    url: `/v4/addon-providers/addon-keycloak/addons/${params.keycloakId}/rebuild`,
    headers: { Accept: 'application/json' },
    // no queryParams
    // no body
  });
}
