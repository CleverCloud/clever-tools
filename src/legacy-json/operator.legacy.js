// One module for the four providers, because the CLI's operator commands are generic: it inverts
// `keycloak-transform.js`, `matomo-transform.js`, `metabase-transform.js` and
// `otoroshi-transform.js` in `@clevercloud/client/cc-api-commands/<provider>/`.
//
// Not put back: the order of the environment variables, which the client sorts by name where the
// API answers with an object whose key order the CLI never saw. Otoroshi has no environment at all
// in the client shape, so if its API sends `envVars`, they are gone before the CLI can print them.

/**
 * Inverse of the `transform<Provider>Info` function of the given provider.
 *
 * @param {string} provider The operator's provider
 * @param {any} operator The operator, as the client's `Get<Provider>Command` returns it
 * @returns {import('./operator.legacy.types.js').LegacyOperatorInfo}
 */
export function toLegacyOperator(provider, operator) {
  switch (provider) {
    case 'keycloak':
      return toLegacyKeycloakInfo(operator);
    case 'matomo':
      return toLegacyMatomoInfo(operator);
    case 'metabase':
      return toLegacyMetabaseInfo(operator);
    case 'otoroshi':
      return toLegacyOtoroshiInfo(operator);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/keycloak/keycloak.types.js').KeycloakInfo} keycloak
 * @returns {import('./operator.legacy.types.js').LegacyKeycloakInfo}
 */
function toLegacyKeycloakInfo(keycloak) {
  return {
    resourceId: keycloak.id,
    addonId: keycloak.addonId,
    name: keycloak.name,
    ownerId: keycloak.ownerId,
    plan: keycloak.plan,
    version: keycloak.version,
    javaVersion: keycloak.javaVersion,
    accessUrl: keycloak.accessUrl,
    availableVersions: keycloak.availableVersions,
    resources: keycloak.resources,
    // the transform turns the API's `null` into an absent key
    features: { networkGroup: keycloak.features.networkGroup ?? null },
    initialCredentials: keycloak.initialCredentials,
    envVars: toLegacyEnvVars(keycloak.environment),
  };
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/matomo/matomo.types.js').MatomoInfo} matomo
 * @returns {import('./operator.legacy.types.js').LegacyMatomoInfo}
 */
function toLegacyMatomoInfo(matomo) {
  return {
    resourceId: matomo.id,
    addonId: matomo.addonId,
    name: matomo.name,
    ownerId: matomo.ownerId,
    plan: matomo.plan,
    version: matomo.version,
    phpVersion: matomo.phpVersion,
    accessUrl: matomo.accessUrl,
    availableVersions: matomo.availableVersions,
    resources: matomo.resources,
    envVars: toLegacyEnvVars(matomo.environment),
  };
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/metabase/metabase.types.js').MetabaseInfo} metabase
 * @returns {import('./operator.legacy.types.js').LegacyMetabaseInfo}
 */
function toLegacyMetabaseInfo(metabase) {
  return {
    resourceId: metabase.id,
    addonId: metabase.addonId,
    name: metabase.name,
    ownerId: metabase.ownerId,
    plan: metabase.plan,
    version: metabase.version,
    javaVersion: metabase.javaVersion,
    accessUrl: metabase.accessUrl,
    availableVersions: metabase.availableVersions,
    resources: {
      entrypoint: metabase.resources.entrypoint,
      // the transform turns the API's `null` into an absent key
      pgsqlId: metabase.resources.pgsqlId ?? null,
    },
    envVars: toLegacyEnvVars(metabase.environment),
  };
}

/**
 * @param {import('@clevercloud/client/cc-api-commands/otoroshi/otoroshi.types.js').OtoroshiInfo} otoroshi
 * @returns {import('./operator.legacy.types.js').LegacyOtoroshiInfo}
 */
function toLegacyOtoroshiInfo(otoroshi) {
  return {
    resourceId: otoroshi.id,
    addonId: otoroshi.addonId,
    name: otoroshi.name,
    ownerId: otoroshi.ownerId,
    plan: otoroshi.plan,
    version: otoroshi.version,
    javaVersion: otoroshi.javaVersion,
    accessUrl: otoroshi.accessUrl,
    availableVersions: otoroshi.availableVersions,
    resources: {
      entrypoint: otoroshi.resources.entrypoint,
      redisId: otoroshi.resources.redisId,
      // the transform turns the API's `null` into an absent key
      pulsarId: otoroshi.resources.pulsarId ?? null,
      elasticId: otoroshi.resources.elasticId ?? null,
    },
    features: { networkGroup: otoroshi.features.networkGroup ?? null },
    api: otoroshi.api,
    initialCredentials: otoroshi.initialCredentials,
  };
}

/**
 * Inverse of the `transform<Provider>VersionCheck` functions, which are identical across providers.
 *
 * @param {{ installed: string, availableVersions: Array<string>, latest: string, needUpdate: boolean }} versionCheck
 * @returns {import('./operator.legacy.types.js').LegacyOperatorVersionCheck}
 */
export function toLegacyOperatorVersionCheck(versionCheck) {
  return {
    installed: versionCheck.installed,
    available: versionCheck.availableVersions,
    latest: versionCheck.latest,
    needUpdate: versionCheck.needUpdate,
  };
}

/**
 * Inverse of `toArray` in `@clevercloud/client/utils/environment-utils.js`, which turns the API's
 * `{ NAME: 'value' }` map into a `{ name, value }` array.
 *
 * @param {Array<{ name: string, value: string }>} environment
 * @returns {Record<string, string>}
 */
function toLegacyEnvVars(environment) {
  return Object.fromEntries(environment.map(({ name, value }) => [name, value]));
}
