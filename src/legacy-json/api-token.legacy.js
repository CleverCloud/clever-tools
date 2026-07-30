/**
 * Inverse of `transformApiToken` in
 * `@clevercloud/client/cc-api-bridge-commands/api-token/api-token-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-bridge-commands/api-token/api-token.types.js').ApiToken} apiToken
 * @returns {import('./api-token.legacy.types.js').LegacyApiToken}
 */
export function toLegacyApiToken(apiToken) {
  return {
    apiTokenId: apiToken.apiTokenId,
    userId: apiToken.userId,
    creationDate: apiToken.createdAt,
    expirationDate: apiToken.expiresAt,
    ip: apiToken.ip,
    name: apiToken.name,
    description: apiToken.description,
    state: apiToken.state,
  };
}

/**
 * Inverse of `transformCreatedApiToken` in
 * `@clevercloud/client/cc-api-bridge-commands/api-token/api-token-transform.js`.
 *
 * @param {import('@clevercloud/client/cc-api-bridge-commands/api-token/create-api-token-command.types.js').CreateApiTokenCommandResponse} createdApiToken
 * @returns {import('./api-token.legacy.types.js').LegacyCreatedApiToken}
 */
export function toLegacyCreatedApiToken(createdApiToken) {
  return {
    apiToken: createdApiToken.apiToken,
    apiTokenId: createdApiToken.apiTokenId,
    creationDate: createdApiToken.createdAt,
    expirationDate: createdApiToken.expiresAt,
    name: createdApiToken.name,
    description: createdApiToken.description,
    state: createdApiToken.state,
  };
}
