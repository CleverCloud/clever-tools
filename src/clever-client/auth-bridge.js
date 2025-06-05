export function createApiToken ({ email, password, mfaCode, name, description = '', expirationDate }) {
  return Promise.resolve({
    method: 'post',
    url: '/api-tokens',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { email, password, mfaCode, name, description, expirationDate },
  });
}

export function listApiTokens () {
  return Promise.resolve({
    method: 'get',
    url: '/api-tokens',
    headers: { Accept: 'application/json' },
  });
}

export function updateApiToken (apiTokenId, { name, description }) {
  return Promise.resolve({
    method: 'put',
    url: `/api-tokens/${apiTokenId}`,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: { name, description },
  });
}

export function deleteApiToken (apiTokenId) {
  return Promise.resolve({
    method: 'delete',
    url: `/api-tokens/${apiTokenId}`,
    headers: { Accept: 'application/json' },
  });
}

export function addOauthHeaderPlaintext (tokens) {

  return async function (requestParams) {

    const authorizationHeader = (
      'OAuth '
      + [
        `oauth_consumer_key="${tokens.OAUTH_CONSUMER_KEY}"`,
        `oauth_token="${tokens.API_OAUTH_TOKEN}"`,
        // %26 is URL escaped character "&"
        `oauth_signature="${tokens.OAUTH_CONSUMER_SECRET}%26${tokens.API_OAUTH_TOKEN_SECRET}"`,
        // oauth_nonce is not mandatory
        // oauth_signature_method is not mandatory, it defaults to PLAINTEXT
        // oauth_timestamp is not mandatory
        // oauth_version is not mandatory, it defaults to 1.0
      ].join(', ')
    );

    return {
      ...requestParams,
      headers: {
        authorization: authorizationHeader,
        ...requestParams.headers,
      },
    };
  };
}
